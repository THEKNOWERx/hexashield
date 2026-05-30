import os
from database.db import SessionLocal, init_db
from models import User, Scan, Finding
from authentication.auth import get_password_hash
from datetime import datetime


def seed():
    init_db()
    db = SessionLocal()

    admin_password = os.environ.get("ADMIN_PASSWORD")
    if not admin_password:
        raise RuntimeError(
            "ADMIN_PASSWORD environment variable must be set before seeding. "
            "Copy .env.example to .env and set a strong password."
        )

    try:
        from sqlalchemy import func

        target_users = [
            {"username": "admin", "email": "admin@hexa.io", "role": "admin", "pw": admin_password},
        ]

        for u_data in target_users:
            existing = db.query(User).filter(
                (func.lower(User.username) == func.lower(u_data["username"])) |
                (func.lower(User.email) == func.lower(u_data["email"]))
            ).first()

            if not existing:
                new_user = User(
                    username=u_data["username"],
                    email=u_data["email"],
                    hashed_password=get_password_hash(u_data["pw"]),
                    role=u_data["role"],
                )
                db.add(new_user)
            else:
                existing.role = u_data["role"]
                existing.hashed_password = get_password_hash(u_data["pw"])

        db.commit()

        from models import AuthorizedScope
        target_scopes = [
            {"target": "127.0.0.1/32", "description": "Localhost - Internal Testing"},
            {"target": "192.168.0.0/16", "description": "Private Network - Lab A"},
            {"target": "10.0.0.0/8", "description": "Private Network - Lab B"},
            {"target": "demo.hexa-shield.io", "description": "Authorized Demo Domain"},
        ]
        for s_data in target_scopes:
            existing_scope = db.query(AuthorizedScope).filter(AuthorizedScope.target == s_data["target"]).first()
            if not existing_scope:
                new_scope = AuthorizedScope(**s_data)
                db.add(new_scope)

        db.commit()

    except Exception:
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
