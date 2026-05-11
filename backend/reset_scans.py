import os
import sys
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Add backend to sys.path
sys.path.append(os.path.abspath('.'))

load_dotenv()

from database.db import SessionLocal, engine
from models import Scan, Finding

def clear_scans():
    print("Connecting to PostgreSQL to ZERO the scan process...")
    db: Session = SessionLocal()
    try:
        # We use a transaction to ensure all associated findings are cleared due to CASCADE
        scans_count = db.query(Scan).count()
        findings_count = db.query(Finding).count()
        
        print(f"Current stats: {scans_count} scans, {findings_count} findings.")
        
        # Deleting all scans will trigger cascade delete for findings
        db.query(Scan).delete()
        db.commit()
        
        print("[SUCCESS] Scan history zeroed. Ready for a fresh port discovery process.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to clear scans: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input("This will delete ALL scan history and findings. Continue? (y/n): ")
    if confirm.lower() == 'y':
        clear_scans()
    else:
        print("Operation cancelled.")
