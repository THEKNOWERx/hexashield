import asyncio
from typing import List, Dict, Any, Optional
from hexascan.engine.nmap_engine import NmapEngine
from hexascan.engine.prober import Prober
from hexascan.engine.analyzer import Analyzer

class ScanOrchestrator:
    def __init__(self, target: str):
        self.target = target
        self.nmap = NmapEngine(target)
        self.prober = Prober(target)
        self.analyzer = Analyzer()

    async def run_full_validation_scan(self) -> Dict[str, Any]:
        """Final mission: Multi-tool, multi-stage accurate scan"""
        
        # Task 1: Resolution & Reachability
        if not await self.nmap.is_reachable():
            return {
                "target": self.target,
                "scan_status": "failed",
                "error": "Host unreachable or resolution failed"
            }

        # Stage 1: Fast Scan
        discovered_ports = await self.nmap.fast_scan()
        if not discovered_ports:
            return {
                "target": self.target,
                "scan_status": "success",
                "results": [],
                "summary": {"message": "No open ports found during discovery"}
            }

        # Stage 2: Deep Scan (Version/OS)
        nmap_details = await self.nmap.deep_scan(discovered_ports)

        # Stage 3: Cross-Validation Probes
        probe_tasks = {port: self.prober.cross_validate_port(port) for port in discovered_ports}
        probe_results = {}
        
        # Run probes concurrently
        for port, task in probe_tasks.items():
            probe_results[port] = await task

        # Stage 4: Synthesis & Confidence Scoring
        final_results = self.analyzer.synthesize(nmap_details, probe_results)

        # Task 11: Output Format
        summary = {
            "high_confidence": len([r for r in final_results if r["confidence"] == "High"]),
            "medium_confidence": len([r for r in final_results if r["confidence"] == "Medium"]),
            "low_confidence": len([r for r in final_results if r["confidence"] == "Low"])
        }

        return {
            "target": self.target,
            "ip": self.target, # Assuming target is IP for now, nmap handles it
            "scan_status": "success",
            "results": final_results,
            "summary": summary
        }
