import os
import sys
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Add backend to sys.path
sys.path.append(os.path.abspath('.'))

load_dotenv()

from database.db import DATABASE_URL, init_db
from database.seed import seed
from models import Base

def initialize():
    print(f"Connecting to: {DATABASE_URL}")
    
    # Create database if it doesn't exist
    try:
        from sqlalchemy_utils import database_exists, create_database
        # Added connect_timeout for PostgreSQL to fail fast if Docker is off
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 5} if "postgresql" in DATABASE_URL else {})
        if not database_exists(engine.url) and "sqlite" not in DATABASE_URL:
            print("Database does not exist. Creating...")
            create_database(engine.url)
            print("Database created successfully.")
    except ImportError:
        print("Note: sqlalchemy-utils not installed. Skipping automatic DB creation.")
    except Exception as e:
        print(f"Note: Could not automatically create DB: {e}")

    engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 5} if "postgresql" in DATABASE_URL else {})

    print("Dropping all tables for a CLEAN start (Zeroing)...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables in PostgreSQL...")
    init_db()
    
    print("Seeding initial administrative and sample data...")
    try:
        seed()
    except Exception as e:
        print(f"Seed warning: {e}")
        
    print("\n[SUCCESS] HexaShield PostgreSQL Infrastructure is READY.")

if __name__ == "__main__":
    initialize()
