import socket
import json
import time
from database.db import SessionLocal
from services.vuln_service import VulnService
from services.scan_engine import hex_scanner
from models import Scan

class ScanService:
    @staticmethod
    # _is_admin and _is_nmap_installed are now handled internally by HexScanner

    @staticmethod
    def _shodan_recon(ip: str) -> Dict:
        """Fetches global intelligence from Shodan."""
        import requests
        api_key = os.getenv("SHODAN_API_KEY")
        if not api_key: return {"shodan_verified": False}
        try:
            url = f"https://api.shodan.io/shodan/host/{ip}?key={api_key}"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                services = []
                for item in data.get('data', []):
                    services.append({
                        "port": item.get('port'),
                        "service": item.get('service', {}).get('name', 'unknown').upper(),
                        "product": item.get('product', ''),
                        "version": item.get('version', ''),
                        "source": "SHODAN_GLOBAL_INTEL",
                        "risk": "Medium"
                    })
                return {
                    "shodan_verified": True,
                    "os": data.get('os', 'Unknown'),
                    "isp": data.get('isp', 'Unknown'),
                    "ports_discovered": data.get('ports', []),
                    "services": services
                }
        except Exception: pass
        return {"shodan_verified": False}

    @staticmethod
    # _is_nmap_installed utility removed (handled by HexScanner core)

    @staticmethod
    def scan_ports(target: str, scan_type: str, scan_id: Optional[int] = None):
        """High-Performance Multi-Phased Intelligence Engine."""
        start_time = time.time()
        
        try:
            target_clean = target.replace('http://', '').replace('https://', '').split('/')[0]
            ip = socket.gethostbyname(target_clean)
        except socket.gaierror:
            return {"error": f"Invalid Target: {target}", "status": "failed"}

        if not scan_id:
            with SessionLocal() as local_db:
                # [ZEROING LOGIC] Clear all previous historical scans for this specific target
                # to ensure a fresh "Port Discovery" and exploitation environment.
                existing = local_db.query(Scan).filter(Scan.target == target).all()
                for s in existing: 
                    local_db.delete(s)
                local_db.commit()
                
                new_scan = Scan(target=target, scan_type=f"QUANTUM_{scan_type.upper()}", status="running")
                local_db.add(new_scan)
                local_db.commit()
                local_db.refresh(new_scan)
                scan_id = new_scan.id

        open_ports = []
        
        def save_state(status_data: Dict):
            try:
                with SessionLocal() as s_db:
                    s_scan = s_db.query(Scan).get(scan_id)
                    if s_scan:
                        existing = json.loads(s_scan.results_json) if s_scan.results_json else {}
                        existing.update(status_data)
                        s_scan.results_json = json.dumps(existing)
                        s_db.commit()
            except Exception: pass

        # --- PHASE 1: EXTERNAL INTELLIGENCE GATHERING ---
        save_state({"phase": "Phase 1: External Intelligence Gathering"})
        external_intel = ScanService._shodan_recon(ip)
        
        # --- PHASE 2: DEEP PORT DISCOVERY (ROBUST ENGINE) ---
        save_state({"phase": "Phase 2: Deep Port Discovery (HexScanner Core)"})
        try:
            # Execute Tiered Scan via Robust Core
            scan_res = hex_scanner.run_robust_scan(target_clean, timeout=90)
            open_ports = scan_res.get("ports", [])
            
            if scan_res["status"] == "error":
                save_state({"phase": f"Discovery Engine Error: {scan_res.get('message')}"})

            # Merge External Intel for completeness (Non-blocking)
            if external_intel.get("shodan_verified"):
                for s_svc in external_intel['services']:
                    if not any(p['port'] == s_svc['port'] for p in open_ports):
                        open_ports.append(s_svc)

            if not open_ports:
                save_state({"phase": "Status: No active ports discovered. Target may be hardened or unreachable."})

            save_state({"ports": open_ports, "phase": "Phase 2 Complete: Robust Discovery Finished"})

            # --- PHASE 3: VULNERABILITY MAPPING & RISK CALCULATION ---
            save_state({"phase": "Phase 3: Intelligence-Driven Vulnerability Mapping"})
            
            # Map discovered ports to vulnerabilities
            findings = VulnService.analyze_vulnerabilities(open_ports)
            
            with SessionLocal() as final_db:
                VulnService.persist_findings(scan_id, findings, final_db)
                f_scan = final_db.query(Scan).get(scan_id)
                if f_scan:
                    f_scan.status = "completed"
                    f_scan.results_json = json.dumps({
                        "id": scan_id,
                        "status": scan_res["status"],
                        "target": target,
                        "ports": open_ports,
                        "scan_time_sec": round(time.time() - start_time, 2),
                        "external_intel": external_intel,
                        "phase": "Quantum Audit Complete",
                        "message": scan_res.get("message", "Scan Successful"),
                        "engine_log": scan_res.get("engine_log", "")
                    })
                    final_db.commit()

            return {"id": scan_id, "target": target, "status": "Success", "ports_found": len(open_ports)}

        except Exception as e:
            print(f"[ENGINE ERROR] {e}")
            with SessionLocal() as err_db:
                e_scan = err_db.query(Scan).get(scan_id)
                if e_scan:
                    e_scan.status = "failed"
                    err_db.commit()
            return {"error": str(e), "status": "failed"}
