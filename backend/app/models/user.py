"""
User model for application-level roles and account activation.
"""
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.auth.permissions import AppRole
from .base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(320), unique=True, nullable=False, index=True)
    role = Column(String(50), nullable=False, default=AppRole.TEAM_MEMBER.value)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
