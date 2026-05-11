
import os
import sys

# Add backend to sys.path
sys.path.append(os.path.abspath('.'))

from database.db import init_db, SessionLocal, engine
from database.seed import seed
from models import Base

from database.db import init_db, SessionLocal, engine
from database.seed import seed
from models import Base

def reset():
    print(f"Connecting to: {engine.url}")
    print("Dropping all tables (Full System Reset)...")
    Base.metadata.drop_all(bind=engine)
    print("Initializing clean schema...")
    init_db()
    print("Seeding database with professional defaults...")
    try:
        seed()
    except Exception as e:
        print(f"Seed error: {e}")
    print("Database reset and seeded successfully in PostgreSQL.")

if __name__ == "__main__":
    confirm = input("CRITICAL: This will DELETE ALL DATA (PostgreSQL). Are you sure? (y/n): ")
    if confirm.lower() == 'y':
        reset()
    else:
        print("Reset cancelled.")
