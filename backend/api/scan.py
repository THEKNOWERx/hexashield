from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from services.orchestrator import orchestrator
from authentication.auth import get_current_user, check_role
from database.db import get_db
from models import Scan

router = APIRouter(prefix="/scan", tags=["scan"], dependencies=[Depends(check_role(["admin", "security_analyst", "analyst"]))])

@router.post("/start", status_code=status.HTTP_202_ACCEPTED)
async def start_scan(background_tasks: BackgroundTasks, target: str, intensity: str = "deep", current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Starts an ULTRA-ADVANCED intelligence audit in the background. Returns immediately."""
    
    # 1. Immediate record creation to prevent UI polling latencies
    try:
        existing = db.query(Scan).filter(Scan.target == target).all()
        for s in existing: db.delete(s)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[API] Cleanup Warning: {e}")

    new_scan = Scan(target=target, scan_type=f"ADVANCED_{intensity.upper()}", status="running", user_id=current_user.id)
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)
    
    # 2. Trigger Robust Orchestrator in Background
    background_tasks.add_task(orchestrator.run_unified_workflow, target, intensity, new_scan.id)
    
    return {
        "message": "ULTRA-ADVANCED Intelligence Engine Engaged.",
        "id": new_scan.id,
        "target": target,
        "status": "running"
    }

@router.delete("/{scan_id}")
async def delete_scan(scan_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a scan and its associated findings."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if scan:
        db.delete(scan)
        db.commit()
    return {"message": f"Scan {scan_id} deleted successfully."}

@router.get("/status/{scan_id}")
async def get_scan_status(scan_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the real status of a scan from the database."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        return {"error": "Scan not found", "status": "unknown", "progress": 0}
    
    # Simple progress heuristic: completed is 100, else 50
    progress = 100 if scan.status == "completed" else 50
    return {
        "scan_id": scan.id,
        "status": scan.status,
        "progress": progress,
        "findings_count": scan.findings_count,
        "target": scan.target,
        "results_json": scan.results_json
    }

