from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# =========================
# Habit Create Schema
# =========================

class HabitCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = "General"
    freeze_count: Optional[int] = 2


# =========================
# Habit Response Schema
# =========================

class HabitResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    freeze_count: int
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True
