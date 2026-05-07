from datetime import timedelta, date

COMPLETED_STATUS = "completed"
SKIPPED_STATUS = "skipped"
MISSED_STATUS = "missed"


# =========================
# Calculate Current Streak
# =========================

def _get_log_status(log):
    if getattr(log, "status", None):
        return log.status

    return COMPLETED_STATUS if getattr(log, "completed", False) else MISSED_STATUS


def calculate_current_streak(logs):

    if not logs:
        return 0

    # Sort Logs By Date Descending
    logs = sorted(
        logs,
        key=lambda log: log.date,
        reverse=True
    )

    expected_date = date.today()
    streak = 0

    for log in logs:
        status = _get_log_status(log)

        if log.date > expected_date:
            continue

        if log.date != expected_date:
            break

        if status == COMPLETED_STATUS:
            streak += 1
        elif status == SKIPPED_STATUS:
            pass
        elif getattr(log, "used_freeze", False):
            pass
        else:
            break

        expected_date -= timedelta(days=1)

    return streak


# =========================
# Calculate Longest Streak
# =========================

def calculate_longest_streak(logs):

    if not logs:
        return 0

    # Sort Logs By Date Ascending
    logs = sorted(
        logs,
        key=lambda log: log.date
    )

    longest_streak = 0
    current_streak = 0
    previous_date = None

    for log in logs:
        status = _get_log_status(log)

        if previous_date and log.date != previous_date + timedelta(days=1):
            current_streak = 0

        if status == COMPLETED_STATUS:
            current_streak += 1
        elif status == SKIPPED_STATUS:
            pass
        elif getattr(log, "used_freeze", False):
            pass
        else:
            current_streak = 0

        longest_streak = max(longest_streak, current_streak)
        previous_date = log.date

    return longest_streak
