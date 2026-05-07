import pandas as pd
import numpy as np


# =========================
# Habit Analytics Function
# =========================

def generate_habit_analytics(logs):

    # No Logs
    if not logs:
        return {
            "total_logs": 0,
            "completed_days": 0,
            "missed_days": 0,
            "skipped_days": 0,
            "freeze_days": 0,
            "completion_rate": 0,
        }

    # Convert Logs To Dictionary
    data = []

    for log in logs:
        data.append({
            "date": log.date,
            "completed": log.completed,
            "status": getattr(log, "status", "completed" if log.completed else "missed"),
            "used_freeze": getattr(log, "used_freeze", False),
        })

    # Create DataFrame
    df = pd.DataFrame(data)

    # Total Logs
    total_logs = len(df)

    completed_days = int((df["status"] == "completed").sum())
    missed_days = int((df["status"] == "missed").sum())
    skipped_days = int((df["status"] == "skipped").sum())
    freeze_days = int(df["used_freeze"].sum())

    # Completion Rate
    completion_rate = np.round(
        (completed_days / total_logs) * 100,
        2
    )

    return {
        "total_logs": int(total_logs),
        "completed_days": completed_days,
        "missed_days": missed_days,
        "skipped_days": skipped_days,
        "freeze_days": freeze_days,
        "completion_rate": float(completion_rate),
    }
