from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Dict
from database.db import get_db
from models import Scan, Finding
from services.orchestrator import orchestrator
from services.nexus_engine import nexus_engine
from schemas.nexus_schemas import ScanRequest, ExploitationRequest
from authentication.auth import get_current_user, check_role
from services.ai_risk_engine import ai_risk_engine

router = APIRouter(tags=["Nexus API"])

@router.post("/scan", status_code=status.HTTP_202_ACCEPTED, dependencies=[Depends(check_role(["admin", "security_analyst"]))])
async def start_nexus_scan(request: ScanRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Security Engineer: Unified endpoint with strict input validation.
    Prevents command injection via Pydantic regex-based target filtering.
    """
    new_scan = Scan(target=request.target, scan_type="NEXUS_FULL", status="running")
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)
    
    # Architecture: Delegate to Orchestrator
    background_tasks.add_task(orchestrator.run_unified_workflow, request.target, request.intensity, new_scan.id)
    
    return {
        "message": "Unified Intelligence Workflow Initiated",
        "scan_id": new_scan.id,
        "target": request.target,
        "intensity": request.intensity
    }

@router.get("/vulnerabilities")
async def get_all_vulnerabilities(db: Session = Depends(get_db)):
    """Performance Engineer: Optimized JSON response for findings."""
    findings = db.query(Finding).all()
    return [{
        "id": f.id,
        "name": f.name,
        "severity": f.severity,
        "cvss": f.cvss,
        "cve": f.cve_id,
        "port": f.port
    } for f in findings]

@router.post("/exploitation", dependencies=[Depends(check_role(["admin", "security_analyst"]))])
async def trigger_nexus_exploitation(request: ExploitationRequest, db: Session = Depends(get_db)):
    """Architect: Hub for mapping vulnerabilities to weaponized vector suggestions."""
    finding = db.query(Finding).filter(Finding.id == request.finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    return {
        "status": "Ready",
        "finding_name": finding.name,
        "cve": finding.cve_id,
        "suggested_vector": f"msfconsole -x 'use auxiliary/scanner/portscan/tcp; set RHOSTS {finding.scan.target}'" if finding.scan else "N/A",
        "access_layer": "Restricted"
    }

@router.get("/dashboard")
async def get_nexus_dashboard_telemetry(db: Session = Depends(get_db)):
    """System Architect: High-level platform health and intelligence summary."""
    ai_risk_engine._ensure_model()
    return {
        "total_scans": db.query(Scan).count(),
        "total_findings": db.query(Finding).count(),
        "critical_count": db.query(Finding).filter(Finding.severity == "CRITICAL").count(),
        "ai_accuracy": round(ai_risk_engine.accuracy * 100, 2),
        "system_status": "Hardened",
        "tier": "Production-Grade"
    }

@router.get("/report")
async def get_nexus_report_summary(db: Session = Depends(get_db)):
    """Return summary of report availability."""
    recent_scan = db.query(Scan).order_by(Scan.id.desc()).first()
    return {
        "latest_scan": recent_scan.target if recent_scan else "None",
        "findings_count": recent_scan.findings_count if recent_scan else 0,
        "status": "Ready"
    }

@router.post("/chat")
async def nexus_chat_analytics(payload: dict, db: Session = Depends(get_db)):
    """
    SOC Analyst Interface: Context-aware security chat.
    Injects latest scan findings as context for the Nexus Engine.
    """
    query = payload.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")

    # Fetch latest scan context
    latest_scan = db.query(Scan).order_by(Scan.id.desc()).first()
    findings = []
    if latest_scan:
        findings = [{
            "name": f.name,
            "severity": f.severity,
            "cvss": f.cvss,
            "cve_id": f.cve_id,
            "port": f.port
        } for f in latest_scan.findings]

    analysis = nexus_engine.analyze_query(query, findings)
    return analysis
