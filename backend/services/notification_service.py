from sqlalchemy.orm import Session
from models import Notification, User
from datetime import datetime

class NotificationService:
    @staticmethod
    def create_notification(db: Session, user_id: int, title: str, message: str, type: str = "info"):
        """Create a new notification record in the database."""
        try:
            new_notif = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=type,
                is_read=0,
                timestamp=datetime.utcnow()
            )
            db.add(new_notif)
            db.commit()
            return new_notif
        except Exception as e:
            db.rollback()
            print(f"[NOTIF ERROR] Failed to create alert: {e}")
            return None

    @staticmethod
    def broadcast_system_alert(db: Session, title: str, message: str, type: str = "warning"):
        """Send a notification to all active users."""
        users = db.query(User).all()
        for user in users:
            NotificationService.create_notification(db, user.id, title, message, type)
