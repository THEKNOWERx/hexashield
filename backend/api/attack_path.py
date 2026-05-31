from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from models import Scan
from services.attack_path_service import attack_path_service
from authentication.auth import get_current_user

router = APIRouter(prefix="/attack-path", tags=["AI Attack Surface"])

@router.get("/latest")
async def get_latest_attack_path(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Expert Endpoint: Performs analysis on the MOST RECENT audit."""
    scan = (
        db.query(Scan).filter(Scan.findings_count > 0).order_by(Scan.id.desc()).first()
        or db.query(Scan).order_by(Scan.id.desc()).first()
    )
    if not scan:
        return {"graph": {"nodes": [], "links": []}, "predictive_analysis": {}, "metrics": {}}
    
    # Run the Intelligence Engine
    result = attack_path_service.generate_graph(scan)
    result["scan_id"] = scan.id
    return result

@router.get("/{scan_id}")
async def get_attack_path(scan_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Expert Endpoint: Performs multi-step graph analysis on a specific audit."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Audit data not found.")
    
    # Run the Intelligence Engine
    analysis = attack_path_service.generate_graph(scan)
    
    # Task 6: Safe Exploit Previews are embedded in 'findings_validated'
    # Format the response for high-fidelity frontend rendering
    return {
        "scan_id": scan_id,
        "target": scan.target,
        "graph": analysis["graph"],
        "predictive_analysis": analysis["predictive_analysis"]
    }
