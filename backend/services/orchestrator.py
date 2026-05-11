import logging
import asyncio
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from services.scan_engine import hex_scanner
from services.vuln_service import VulnService
from services.ai_risk_engine import ai_risk_engine
from services.neo4j_service import neo4j_service
from database.db import SessionLocal
from models import Scan

# Configure Production Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("hexashield_core.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("NexusOrchestrator")

class OrchestratorService:
    """
    SYSTEM ARCHITECT: Unified Intelligence Orchestrator.
    Manages the lifecycle: Recon -> Scan -> Vuln -> AI -> Graph -> Report.
    """
    
    @staticmethod
    async def run_unified_workflow(target: str, intensity: str, scan_id: int):
        logger.info(f"Initiating Unified Workflow for Target: {target} [ScanID: {scan_id}]")
        
        db = SessionLocal()
        try:
            # 1. SCAN & RECON (Stage 1-3)
            # Utilizing the Robust HexScanner with direct subprocess control
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None, 
                hex_scanner.run_robust_scan, 
                target, intensity, 120 # Pass intensity and 120s global timeout
            )
            
            if results.get("status") == "error":
                logger.error(f"Workflow Interrupted: {results.get('message', 'Unknown Error')}")
                OrchestratorService._update_status(scan_id, "failed")
                return

            # 2. VULNERABILITY ANALYSIS (Stage 4)
            discovered_ports = results.get("ports", [])
            findings = []
            
            if discovered_ports:
                logger.info(f"Discovery phase complete. Identified {len(discovered_ports)} services.")
                # Map to vulnerability detection layer
                vuln_results = VulnService.analyze_vulnerabilities(discovered_ports)
                # Correct way to access nested vulnerabilities from the new schema
                findings = vuln_results.get("vulnerabilities", [])
                
                # 3. AI RISK ENRICHMENT (Stage 5)
                if findings:
                    logger.info(f"Analyzing {len(findings)} potential vulnerabilities via AI Risk Engine...")
                    ai_results = ai_risk_engine.predict_risk(findings)
                    for i, f in enumerate(findings):
                        res = ai_results[i]
                        # Injecting AI reasoning into the finding record
                        f['severity'] = res['predicted_risk'].upper()
                        f['ai_reasoning'] = res['ai_reason']
                        f['cvss_score'] = f.get('cvss', 5.0)

            # 4. DATABASE PERSISTENCE (Stage 6)
            # This is non-blocking for graph sync now
            VulnService.persist_findings(scan_id, findings, db)
            
            # 5. FINALIZATION
            OrchestratorService._update_status(scan_id, "completed")
            logger.info(f"Workflow Success for {target}. Intelligence persistent.")
            
        except Exception as e:
            logger.error(f"Critical Workflow Failure: {e}", exc_info=True)
            OrchestratorService._update_status(scan_id, "failed")
        finally:
            db.close()

    @staticmethod
    def _update_status(scan_id: int, status: str):
        with SessionLocal() as db:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if scan:
                scan.status = status
                db.commit()

orchestrator = OrchestratorService()
