from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database import Base


class RefreshToken(Base):

    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True)

    token = Column(String, nullable=False)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    expires_at = Column(DateTime)

    is_revoked = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # Relationship
    user = relationship("User")