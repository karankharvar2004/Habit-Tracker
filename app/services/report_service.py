import csv
import os
from io import StringIO

import matplotlib.pyplot as plt


# =========================
# Generate Habit Chart
# =========================

def generate_habit_chart(
    habit_title,
    logs
):

    # Create Charts Folder
    charts_dir = "app/charts"

    os.makedirs(
        charts_dir,
        exist_ok=True
    )

    # Prepare Data
    dates = []
    completed = []

    for log in logs:
        dates.append(str(log.date))

        completed.append(
            1 if log.completed else 0
        )

    # Create Figure
    plt.figure(figsize=(10, 5))

    # Plot Line
    plt.plot(
        dates,
        completed,
        marker="o"
    )

    # Labels
    plt.title(f"{habit_title} Completion Trend")

    plt.xlabel("Date")

    plt.ylabel("Completed")

    plt.yticks([0, 1], ["Missed", "Done"])

    plt.xticks(rotation=45)

    plt.tight_layout()

    # Save Chart
    filename = f"{habit_title}_chart.png"

    filepath = os.path.join(
        charts_dir,
        filename
    )

    plt.savefig(filepath)

    plt.close()

    return filepath


def generate_progress_report(user, habit_rows, summary):
    output = StringIO()
    writer = csv.writer(output)

    writer.writerow(["Momentum Progress Report"])
    writer.writerow(["Generated for", user.username])
    writer.writerow(["Email", user.email])
    writer.writerow([])
    writer.writerow(["Total Habits", summary["total_habits"]])
    writer.writerow(["Completed Logs", summary["completed_logs"]])
    writer.writerow(["Missed Logs", summary["missed_logs"]])
    writer.writerow(["Skipped Logs", summary["skipped_logs"]])
    writer.writerow(["Freeze Saves Used", summary["freeze_saves_used"]])
    writer.writerow(["Best Streak", summary["best_streak"]])
    writer.writerow([])
    writer.writerow(
        [
            "Habit",
            "Category",
            "Current Streak",
            "Longest Streak",
            "Completed",
            "Missed",
            "Skipped",
            "Freeze Saves Used",
            "Freeze Saves Left",
            "Completion Rate",
        ]
    )

    for row in habit_rows:
        writer.writerow(
            [
                row["title"],
                row["category"],
                row["current_streak"],
                row["longest_streak"],
                row["completed_days"],
                row["missed_days"],
                row["skipped_days"],
                row["freeze_days"],
                row["freeze_count"],
                row["completion_rate"],
            ]
        )

    return output.getvalue()
