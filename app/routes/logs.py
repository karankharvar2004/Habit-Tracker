from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db

from app.models.log import HabitLog
from app.models.habit import Habit
from app.models.user import User

from app.schemas.log import (
    HabitLogCreate,
    HabitLogResponse
)

from app.utils.security import get_current_user


router = APIRouter(
    prefix="/logs",
    tags=["Habit Logs"]
)


VALID_LOG_STATUSES = {"completed", "missed", "skipped"}


# =========================
# Mark Habit Completion
# =========================

@router.post(
    "/{habit_id}",
    response_model=HabitLogResponse
)
def mark_habit_completion(
    habit_id: int,
    log: HabitLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    status = (log.status or "").strip().lower() or "completed"

    if status not in VALID_LOG_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid log status"
        )

    # Check Habit Ownership
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == current_user.id
    ).first()

    if not habit:
        raise HTTPException(
            status_code=404,
            detail="Habit not found"
        )

    # Check Existing Log For Today
    existing_log = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id,
        HabitLog.date == date.today()
    ).first()

    if existing_log:
        raise HTTPException(
            status_code=400,
            detail="Today's log already exists"
        )

    completed = status == "completed" if log.completed is None else log.completed
    used_freeze = False

    if status == "completed":
        completed = True
    elif status in {"missed", "skipped"}:
        completed = False

    if status == "missed" and habit.freeze_count > 0:
        habit.freeze_count -= 1
        used_freeze = True

    # Create Daily Log
    new_log = HabitLog(
        completed=completed,
        status=status,
        used_freeze=used_freeze,
        habit_id=habit_id
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


# =========================
# Get Habit Logs
# =========================

@router.get(
    "/{habit_id}",
    response_model=list[HabitLogResponse]
)
def get_habit_logs(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Verify Ownership
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == current_user.id
    ).first()

    if not habit:
        raise HTTPException(
            status_code=404,
            detail="Habit not found"
        )

    logs = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id
    ).all()

    return logs
