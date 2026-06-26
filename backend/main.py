from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import uvicorn
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# Load environment variables from .env file
load_dotenv()

from api import admin, recon, scan, vuln, ai, reports, exploit, nexus, notifications, attack_path
from authentication import auth
from database.db import get_db, init_db
from models import User

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    init_db()
    try:
        from database.seed import seed
        seed()
        print("[STARTUP] Database initialized and seeded successfully.")
    except Exception as e:
        print(f"[STARTUP ERROR] Failed to run seed on startup: {e}")
    
    yield
    # Shutdown logic (if any)
    print("[SHUTDOWN] Cleaning up resources...")

app = FastAPI(
    title="AI-Assisted Ethical Penetration Testing Platform", 
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
async def root_api():
    return {"message": "HexaShield Security API is online", "docs": "/docs", "status": "active"}

# Global API Versioning Router
api_router = APIRouter(prefix="/api")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Status and Authentication (Inside v1)
@api_router.get("/health")
async def root():
    return {"message": "Cybersecurity Platform API is online", "status": "active"}

@api_router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    from sqlalchemy import func
    user = db.query(User).filter(func.lower(User.username) == func.lower(form_data.username)).first()

    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if getattr(user, 'is_active', 1) == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact administrator.",
        )
        
    import json
    try:
        permissions = json.loads(user.permissions) if getattr(user, 'permissions', None) else []
    except:
        permissions = []

    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role, "permissions": permissions, "is_active": getattr(user, 'is_active', 1)}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/register")
async def register(user_data: dict, db: Session = Depends(get_db)):
    from sqlalchemy import func
    hashed_pw = auth.get_password_hash(user_data.get("password"))

    # Case-insensitive check for existing username
    existing_user = db.query(User).filter(func.lower(User.username) == func.lower(user_data.get("username"))).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=user_data.get("username"),
        email=user_data.get("email"),
        hashed_password=hashed_pw,
        role=user_data.get("role", "security_analyst")
    )

    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")

    return {"message": "User registered successfully", "username": new_user.username}

# Router inclusions
api_router.include_router(admin.router)
api_router.include_router(recon.router)
api_router.include_router(scan.router)
api_router.include_router(vuln.router)
api_router.include_router(ai.router)
api_router.include_router(reports.router)
api_router.include_router(exploit.router)
api_router.include_router(nexus.router)
api_router.include_router(notifications.router)
api_router.include_router(attack_path.router)

# Finally include the versioned router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
