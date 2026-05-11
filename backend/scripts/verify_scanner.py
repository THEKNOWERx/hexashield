import sys
import os
import asyncio

# Add backend to path
sys.path.append('c:/Users/user/Desktop/hex/backend')

from services.scan_engine import hex_scanner
from services.orchestrator import orchestrator
from database.db import SessionLocal
from models import Scan, Finding

async def test_real_scan():
    target = "127.0.0.1"
    intensity = "fast"
    
    # 1. Create a dummy scan entry
    db = SessionLocal()
    new_scan = Scan(target=target, scan_type="VERIFICATION_TEST", status="running")
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)
    scan_id = new_scan.id
    
    print(f"--- Starting Verification Scan [ID: {scan_id}] for {target} ---")
    
    # 2. Run the orchestrator workflow
    await orchestrator.run_unified_workflow(target, intensity, scan_id)
    
    # 3. Check results
    db = SessionLocal()
    updated_scan = db.query(Scan).filter(Scan.id == scan_id).first()
    findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()
    
    print(f"Scan Status: {updated_scan.status}")
    print(f"Total Findings Found: {len(findings)}")
    
    if len(findings) > 0:
        print("\nDiscovered Ports & Services:")
        for f in findings:
            print(f" - Port {f.port}: {f.name} (Risk: {f.severity})")
        print("\n[SUCCESS] The scanner is now correctly identifying and persisting real ports.")
    else:
        print("\n[WARNING] No ports found. This might be due to local firewall or no services running on 127.0.0.1.")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_real_scan())
