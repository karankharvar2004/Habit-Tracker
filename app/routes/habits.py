from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.habit import Habit
from app.models.user import User

from app.schemas.habit import (
    HabitCreate,
    HabitResponse
)

from app.utils.security import get_current_user


router = APIRouter(
    prefix="/habits",
    tags=["Habits"]
)


# =========================
# Create Habit
# =========================

@router.post(
    "/",
    response_model=HabitResponse
)
def create_habit(
    habit: HabitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    new_habit = Habit(
        title=habit.title,
        description=habit.description,
        category=(habit.category or "General").strip() or "General",
        freeze_count=max(habit.freeze_count or 0, 0),
        user_id=current_user.id
    )

    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)

    return new_habit


# =========================
# Get All Habits
# =========================

@router.get(
    "/",
    response_model=list[HabitResponse]
)
def get_all_habits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    habits = db.query(Habit).filter(
        Habit.user_id == current_user.id
    ).all()

    return habits


# =========================
# Get Single Habit
# =========================

@router.get(
    "/{habit_id}",
    response_model=HabitResponse
)
def get_single_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == current_user.id
    ).first()

    if not habit:
        raise HTTPException(
            status_code=404,
            detail="Habit not found"
        )

    return habit


# =========================
# Update Habit
# =========================

@router.put(
    "/{habit_id}",
    response_model=HabitResponse
)
def update_habit(
    habit_id: int,
    updated_habit: HabitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == current_user.id
    ).first()

    if not habit:
        raise HTTPException(
            status_code=404,
            detail="Habit not found"
        )

    habit.title = updated_habit.title
    habit.description = updated_habit.description
    habit.category = (updated_habit.category or "General").strip() or "General"
    habit.freeze_count = max(updated_habit.freeze_count or 0, 0)

    db.commit()
    db.refresh(habit)

    return habit


# =========================
# Delete Habit
# =========================

@router.delete("/{habit_id}")
def delete_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.user_id == current_user.id
    ).first()

    if not habit:
        raise HTTPException(
            status_code=404,
            detail="Habit not found"
        )

    db.delete(habit)
    db.commit()

    return {
        "message": "Habit deleted successfully"
    }
