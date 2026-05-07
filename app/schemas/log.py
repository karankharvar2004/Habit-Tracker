from pydantic import BaseModel
from datetime import date
from typing import Optional


# =========================
# Habit Log Create
# =========================

class HabitLogCreate(BaseModel):
    completed: Optional[bool] = None
    status: str = "completed"


# =========================
# Habit Log Response
# =========================

class HabitLogResponse(BaseModel):
    id: int
    completed: bool
    status: str
    used_freeze: bool
    date: date
    habit_id: int

    class Config:
        from_attributes = True
