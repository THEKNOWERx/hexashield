import sys
import os
import time

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.advanced_scanner import AdvancedScannerService
from database.db import SessionLocal, init_db
from models import Scan

def benchmark_fast_scan():
    init_db()
    target = "127.0.0.1" # Using localhost for maximum speed and safety
    intensity = "pulse"
    
    print("=== HEXASHIELD TURBO SCAN BENCHMARK ===")
    print(f"Target: {target}")
    
    with SessionLocal() as db:
        new_scan = Scan(target=target, scan_type=f"BENCHMARK_{intensity.upper()}", status="running")
        db.add(new_scan)
        db.commit()
        db.refresh(new_scan)
        scan_id = new_scan.id

    start_time = time.time()
    
    # Run the scan
    try:
        AdvancedScannerService.execute_advanced_scan(target, intensity, scan_id)
        
        print("[*] Scan initiated. Waiting for completion...", end="", flush=True)
        
        # Polling Loop to wait for async completion
        timeout = 60
        elapsed = 0
        while elapsed < timeout:
            with SessionLocal() as db:
                scan = db.query(Scan).filter(Scan.id == scan_id).first()
                if scan and scan.status != "running":
                    print(f"\n[+] Scan finished with status: {scan.status}")
                    break
            time.sleep(1)
            elapsed += 1
            print(".", end="", flush=True)
            
        if elapsed >= timeout:
            print("\n[!] Timeout waiting for scan.")
            return

        duration = time.time() - start_time
        print(f"Benchmark completed in {round(duration, 2)}s")
        
        with SessionLocal() as db:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            
            # Check results_json
            results = scan.results_json
            if isinstance(results, str):
                import json
                results = json.loads(results)
            
            if not results:
                print("[!] No results found in database.")
                return

            print(f"Ports Found: {len(results.get('ports', []))}")
            if duration < 45:
                print("[SUCCESS] Speed threshold met (< 45s)")
            else:
                print("[WARNING] Speed threshold exceeded")
                
    except Exception as e:
        print(f"[CRITICAL FAILURE] Benchmark crashed: {e}")

if __name__ == "__main__":
    benchmark_fast_scan()
