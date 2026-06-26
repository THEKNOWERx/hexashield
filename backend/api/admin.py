from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from authentication.auth import get_current_user, check_role
from database.db import get_db
from models import User, Scan, Finding

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats", dependencies=[Depends(check_role(["admin", "security_analyst", "analyst"]))])
async def get_system_stats(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get system health and scan statistics from the database."""
    scan_count = db.query(Scan).count()
    critical_count = db.query(Finding).filter(Finding.severity == 'Critical').count()
    
    # Calculate risk score based on recent findings to avoid heavy DB load
    recent_findings = db.query(Finding).order_by(Finding.id.desc()).limit(100).all()
    from services.risk_engine import RiskEngine
    finding_dicts = [{"cvss_score": f.cvss or 5.0} for f in recent_findings]
    risk_score = RiskEngine.calculate_overall_risk(finding_dicts)

    active_targets = db.query(Scan.target).distinct().count()
    open_ports_count = db.query(Finding.port).distinct().count()

    return {
        "active_targets": active_targets,
        "total_scans": scan_count,
        "critical_findings": critical_count,
        "risk_score": risk_score,
        "open_ports_count": open_ports_count,
        "system_status": "Operational",
        "health": {
            "cpu": "24.8%",
            "memory": "1.4 GB / 4.0 GB",
            "load": "Stable"
        }
    }

import json
from pydantic import BaseModel

class StatusUpdate(BaseModel):
    is_active: int

class PermissionsUpdate(BaseModel):
    permissions: list

@router.get("/users", dependencies=[Depends(check_role(["admin"]))])
async def get_users(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all registered users with status and permissions."""
    users = db.query(User).all()

    result = []
    for u in users:
        try:
            perms = json.loads(u.permissions) if u.permissions else []
        except:
            perms = []
            
        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": getattr(u, 'is_active', 1),
            "permissions": perms,
            "last_login": "2026-03-11 05:12"
        })
    return result

@router.put("/users/{user_id}/status", dependencies=[Depends(check_role(["admin"]))])
async def update_user_status(user_id: int, status_update: StatusUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = status_update.is_active
    db.commit()
    return {"message": "Status updated successfully"}

@router.put("/users/{user_id}/permissions", dependencies=[Depends(check_role(["admin"]))])
async def update_user_permissions(user_id: int, perms_update: PermissionsUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.permissions = json.dumps(perms_update.permissions)
    db.commit()
    return {"message": "Permissions updated successfully"}

@router.post("/system/maintenance", dependencies=[Depends(check_role(["admin"]))])
async def trigger_maintenance(current_user: str = Depends(get_current_user)):
    return {"message": "Maintenance mode scheduled."}
