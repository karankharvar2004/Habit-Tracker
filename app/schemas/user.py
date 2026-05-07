from pydantic import BaseModel, EmailStr
from datetime import datetime


# =========================
# User Create Schema
# =========================

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


# =========================
# User Login Schema
# =========================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# =========================
# User Response Schema
# =========================

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class RefreshTokenRequest(BaseModel):
    refresh_token: str