from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.all_models import User

router = APIRouter(prefix="/auth", tags=["Auth"])

class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserProfileSchema(BaseModel):
    id: str
    name: str
    email: str
    is_admin: bool
    groq_api_key: str | None = None
    openrouter_api_key: str | None = None

@router.post("/register")
async def register(payload: RegisterSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        is_admin=True if payload.email.startswith("admin@") else False
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": user.is_admin,
            "groq_api_key": user.groq_api_key,
            "openrouter_api_key": user.openrouter_api_key
        }
    }

@router.post("/login")
async def login(payload: LoginSchema, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": user.is_admin,
            "groq_api_key": user.groq_api_key,
            "openrouter_api_key": user.openrouter_api_key
        }
    }

@router.put("/profile/groq-key")
async def update_groq_key(payload: dict, user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if user:
        if "groq_api_key" in payload:
            user.groq_api_key = payload.get("groq_api_key", "")
        if "openrouter_api_key" in payload:
            user.openrouter_api_key = payload.get("openrouter_api_key", "")
        await db.commit()
    return {"status": "updated"}

@router.put("/profile/keys")
async def update_api_keys(payload: dict, user_id: str = "default_user", db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if user:
        if "groq_api_key" in payload:
            user.groq_api_key = payload.get("groq_api_key", "")
        if "openrouter_api_key" in payload:
            user.openrouter_api_key = payload.get("openrouter_api_key", "")
        await db.commit()
    return {
        "status": "updated",
        "groq_api_key": user.groq_api_key if user else None,
        "openrouter_api_key": user.openrouter_api_key if user else None
    }
