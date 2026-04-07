"""
User schemas
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.auth.permissions import AppRole


class UserBase(BaseModel):
    email: str = Field(..., min_length=1, max_length=320)
    role: AppRole = AppRole.TEAM_MEMBER
    is_active: bool = True


class UserCreate(UserBase):
    auth_user_id: str = Field(..., min_length=1, max_length=255)


class UserUpdate(BaseModel):
    email: str | None = Field(default=None, min_length=1, max_length=320)
    role: AppRole | None = None
    is_active: bool | None = None


class User(UserBase):
    id: int
    auth_user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminUserCreate(BaseModel):
    email: str = Field(..., min_length=1, max_length=320)
    password: str = Field(..., min_length=8, max_length=128)
    role: AppRole = AppRole.TEAM_MEMBER
    is_active: bool = True


class AdminUserUpdate(BaseModel):
    email: str | None = Field(default=None, min_length=1, max_length=320)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: AppRole | None = None
    is_active: bool | None = None
