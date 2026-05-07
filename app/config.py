import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"


def load_env_file():
    if not ENV_PATH.exists():
        return

    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file()


def get_env(key, default=None):
    return os.getenv(key, default)


DATABASE_URL = get_env(
    "DATABASE_URL",
    "postgresql://postgres:7006@localhost/HabitTracker_DB",
)
SECRET_KEY = get_env("SECRET_KEY", "mysecretkey")
ALGORITHM = get_env("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(get_env("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(get_env("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
CORS_ORIGINS = [
    origin.strip()
    for origin in get_env("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
