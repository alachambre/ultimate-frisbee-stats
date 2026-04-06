"""
Authentication schemas
"""
from pydantic import BaseModel, ConfigDict

from app.auth.permissions import AppRole
from app.auth.types import AuthEnforcementMode


class CapabilityFlags(BaseModel):
    can_view_public_content: bool
    can_view_comments: bool
    can_view_strategies: bool
    can_edit_data: bool
    can_view_statistics: bool
    can_export_statistics: bool
    can_manage_users: bool

    model_config = ConfigDict(from_attributes=True)


class AuthMe(BaseModel):
    role: AppRole
    capabilities: CapabilityFlags
    is_authenticated: bool
    has_app_access: bool
    enforcement_mode: AuthEnforcementMode
    email: str | None = None
    auth_user_id: str | None = None
