from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.db import get_db
from models import Notification
from authentication.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationSchema(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: int
    timestamp: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[NotificationSchema])
async def get_notifications(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Fetch all notifications for the current authenticated user."""
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.timestamp.desc()).limit(50).all()

@router.patch("/read/{notification_id}")
async def mark_as_read(notification_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Mark a specific notification as read."""
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = 1
    db.commit()
    return {"status": "success", "message": "Notification marked as read"}

@router.patch("/read-all")
async def mark_all_read(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Mark all unread notifications for the user as read."""
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == 0).update({Notification.is_read: 1})
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}

@router.delete("/purge")
async def purge_notifications(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Clear all notification history for the user."""
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success", "message": "Notification history cleared"}
