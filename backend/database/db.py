import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# Determine database URL.
# Default to SQLite for easy local dev if POSTGRES_URL is not set,
# but user specifically wants PostgreSQL support, so we will use it if provided.

# Use absolute path for SQLite to prevent issues when running from different dirs
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_dir = os.path.join(BASE_DIR, 'database')
os.makedirs(db_dir, exist_ok=True)
default_sqlite_url = f"sqlite:///{os.path.join(db_dir, 'hexa.db')}"

# Determination with Intelligent Fallback
DATABASE_URL = os.getenv("DATABASE_URL", default_sqlite_url)

def get_engine():
    """Returns an engine with robust PostgreSQL support and graceful SQLite fallback."""
    if DATABASE_URL.startswith("postgresql"):
        try:
            # Enhanced performance settings for PostgreSQL
            pg_engine = create_engine(DATABASE_URL, 
                pool_size=int(os.getenv("POSTGRES_POOL_SIZE", "30")), # Increased for multi-threaded scanning
                max_overflow=int(os.getenv("POSTGRES_MAX_OVERFLOW", "60")),
                pool_timeout=15, # Increased timeout for slow Docker boots
                pool_pre_ping=True, # Critical for detecting stale connections
                pool_recycle=1800 # Recycle connections every 30 mins
            )
            # Connectivity Test
            with pg_engine.connect() as conn:
                print(f"[DATABASE] Connected successfully to PostgreSQL at {DATABASE_URL.split('@')[-1]}")
                return pg_engine
        except Exception as e:
            print(f"[DATABASE ERROR] PostgreSQL linkage failed: {e}")
            print(f"[DATABASE] CRITICAL FALLBACK: Using SQLite for emergency continuity.")
            
    # Resilient SQLite Fallback
    return create_engine(default_sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    print("[DATABASE] Synchronizing Schema...")
    Base.metadata.create_all(bind=engine)
    print("[DATABASE] Schema synchronization complete.")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
