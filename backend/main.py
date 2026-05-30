from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import uvicorn
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

load_dotenv()

from api import admin, recon, scan, vuln, ai, reports, exploit, nexus, notifications, attack_path
from authentication import auth
from database.db import get_db, init_db
from models import User


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        from database.seed import seed
        seed()
    except Exception as e:
        print(f"[STARTUP] Seed skipped: {e}")
    yield


app = FastAPI(
    title="HexaShield Security Platform",
    version="2.0.0",
    lifespan=lifespan,
)

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

api_router = APIRouter(prefix="/api")


@app.get("/")
async def root_api():
    return {"message": "HexaShield Security API is online", "docs": "/docs", "status": "active"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


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

    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@api_router.post("/register")
async def register(user_data: dict, db: Session = Depends(get_db)):
    from sqlalchemy import func
    hashed_pw = auth.get_password_hash(user_data.get("password"))

    existing_user = db.query(User).filter(
        func.lower(User.username) == func.lower(user_data.get("username"))
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=user_data.get("username"),
        email=user_data.get("email"),
        hashed_password=hashed_pw,
        role=user_data.get("role", "security_analyst"),
    )

    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")

    return {"message": "User registered successfully", "username": new_user.username}


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

app.include_router(api_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, workers=1)
