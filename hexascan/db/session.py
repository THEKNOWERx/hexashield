import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from hexascan.db.models import Base

# Default to SQLite in current directory
DB_PATH = os.path.join(os.getcwd(), "hexascan.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
