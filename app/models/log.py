from sqlalchemy import Column, Integer, Boolean, ForeignKey, Date, String
from sqlalchemy.orm import relationship
from datetime import date

from app.database import Base


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)

    completed = Column(Boolean, default=False)

    status = Column(String, nullable=False, default="completed")

    used_freeze = Column(Boolean, nullable=False, default=False)

    date = Column(Date, default=date.today)

    # Foreign Key
    habit_id = Column(Integer, ForeignKey("habits.id"))

    # Relationship
    habit = relationship("Habit", back_populates="logs")
