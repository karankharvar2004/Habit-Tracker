from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.habit import Habit
from app.models.log import HabitLog
from app.models.user import User

from app.utils.security import get_current_user

from app.services.streak_service import (
    calculate_current_streak,
    calculate_longest_streak
)

from app.services.report_service import (
    generate_habit_chart,
    generate_progress_report,
)

from app.services.analytics_service import (
    generate_habit_analytics
)


def _build_habit_summary(habit, logs):
    streaks = {
        "current_streak": calculate_current_streak(logs),
        "longest_streak": calculate_longest_streak(logs),
    }
    analytics = generate_habit_analytics(logs)

    return {
        "id": habit.id,
        "title": habit.title,
        "category": habit.category,
        "freeze_count": habit.freeze_count,
        **streaks,
        **analytics,
    }

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# =========================
# Habit Streak Analytics
# =========================

@router.get("/streak/{habit_id}")
def get_habit_streaks(
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

    # Get Logs
    logs = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id
    ).all()

    # Calculate Streaks
    current_streak = calculate_current_streak(logs)

    longest_streak = calculate_longest_streak(logs)

    return {
        "habit_id": habit_id,
        "habit_title": habit.title,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_logs": len(logs),
        "freeze_count": habit.freeze_count,
    }


# =========================
# Habit Statistics
# =========================

@router.get("/stats/{habit_id}")
def get_habit_statistics(
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

    # Get Logs
    logs = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id
    ).all()

    # Generate Analytics
    analytics = generate_habit_analytics(logs)

    return {
        "habit_id": habit.id,
        "habit_title": habit.title,
        "analytics": analytics
    }


# =========================
# Generate Habit Chart
# =========================

@router.get("/chart/{habit_id}")
def get_habit_chart(
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

    # Get Logs
    logs = db.query(HabitLog).filter(
        HabitLog.habit_id == habit_id
    ).all()

    # Generate Chart
    chart_path = generate_habit_chart(
        habit.title,
        logs
    )

    return {
        "message": "Chart generated successfully",
        "chart_path": chart_path
    }


@router.get("/profile")
def get_profile_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    habits = db.query(Habit).filter(
        Habit.user_id == current_user.id
    ).all()

    habit_rows = []
    recent_activity = []

    for habit in habits:
        logs = db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id
        ).order_by(HabitLog.date.desc()).all()

        habit_rows.append(_build_habit_summary(habit, logs))

        for log in logs[:3]:
            recent_activity.append(
                {
                    "id": log.id,
                    "date": log.date.isoformat(),
                    "habit_id": habit.id,
                    "habit_title": habit.title,
                    "status": getattr(log, "status", "completed" if log.completed else "missed"),
                    "used_freeze": getattr(log, "used_freeze", False),
                }
            )

    recent_activity.sort(key=lambda item: item["date"], reverse=True)
    recent_activity = recent_activity[:8]

    category_counts = Counter(habit.category for habit in habits)
    total_completed = sum(row["completed_days"] for row in habit_rows)
    total_missed = sum(row["missed_days"] for row in habit_rows)
    total_skipped = sum(row["skipped_days"] for row in habit_rows)
    total_freeze_days = sum(row["freeze_days"] for row in habit_rows)

    return {
        "user": {
            "username": current_user.username,
            "email": current_user.email,
        },
        "summary": {
            "total_habits": len(habits),
            "completed_logs": total_completed,
            "missed_logs": total_missed,
            "skipped_logs": total_skipped,
            "freeze_saves_used": total_freeze_days,
            "freeze_saves_left": sum(habit.freeze_count for habit in habits),
            "best_streak": max((row["longest_streak"] for row in habit_rows), default=0),
            "active_streaks": sum(1 for row in habit_rows if row["current_streak"] > 0),
        },
        "category_breakdown": [
            {"category": category, "count": count}
            for category, count in category_counts.most_common()
        ],
        "habits": habit_rows,
        "recent_activity": recent_activity,
    }


@router.get("/report")
def export_progress_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    habits = db.query(Habit).filter(
        Habit.user_id == current_user.id
    ).all()

    habit_rows = []

    for habit in habits:
        logs = db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id
        ).all()
        habit_rows.append(_build_habit_summary(habit, logs))

    summary = {
        "total_habits": len(habits),
        "completed_logs": sum(row["completed_days"] for row in habit_rows),
        "missed_logs": sum(row["missed_days"] for row in habit_rows),
        "skipped_logs": sum(row["skipped_days"] for row in habit_rows),
        "freeze_saves_used": sum(row["freeze_days"] for row in habit_rows),
        "best_streak": max((row["longest_streak"] for row in habit_rows), default=0),
    }

    report = generate_progress_report(current_user, habit_rows, summary)

    return Response(
        content=report,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="momentum-report.csv"'
        },
    )
