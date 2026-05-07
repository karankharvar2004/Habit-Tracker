from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import engine, Base
from .database_sync import sync_schema

# Import Models
from .models.user import User
from .models.habit import Habit
from .models.log import HabitLog

# Import Routers
from .routes.auth import router as auth_router
from .routes.habits import router as habits_router
from .routes.logs import router as logs_router
from .routes.analytics import router as analytics_router
from .models.refresh_token import RefreshToken

app = FastAPI()

# Create Tables
Base.metadata.create_all(bind=engine)
sync_schema(engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(habits_router)
app.include_router(logs_router)
app.include_router(analytics_router)


@app.get("/")
def root():
    return {"message": "Momentum API Running"}
