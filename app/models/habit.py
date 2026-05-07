from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    description = Column(String)

    category = Column(String, nullable=False, default="General")

    freeze_count = Column(Integer, nullable=False, default=2)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Foreign Key
    user_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    user = relationship("User", back_populates="habits")

    logs = relationship("HabitLog", back_populates="habit")
