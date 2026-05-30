import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_dir = os.path.join(BASE_DIR, "database")
os.makedirs(db_dir, exist_ok=True)
default_sqlite_url = f"sqlite:///{os.path.join(db_dir, 'hexa.db')}"

DATABASE_URL = os.getenv("DATABASE_URL", default_sqlite_url)


def get_engine():
    if DATABASE_URL.startswith("postgresql"):
        try:
            pg_engine = create_engine(
                DATABASE_URL,
                pool_size=int(os.getenv("POSTGRES_POOL_SIZE", "20")),
                max_overflow=int(os.getenv("POSTGRES_MAX_OVERFLOW", "40")),
                pool_timeout=15,
                pool_pre_ping=True,
                pool_recycle=1800,
            )
            with pg_engine.connect():
                return pg_engine
        except Exception as e:
            print(f"[DATABASE] PostgreSQL connection failed: {e}. Falling back to SQLite.")

    return create_engine(default_sqlite_url, connect_args={"check_same_thread": False})


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
