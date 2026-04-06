from dataclasses import dataclass

from app.auth.permissions import AppCapabilities, AppRole, get_capabilities_for_role
from app.auth.types import AuthEnforcementMode


@dataclass(frozen=True, slots=True)
class AccessContext:
    role: AppRole
    capabilities: AppCapabilities
    is_authenticated: bool
    has_app_access: bool
    enforcement_mode: AuthEnforcementMode
    email: str | None = None
    auth_user_id: str | None = None


def build_access_context(
    role: AppRole = AppRole.PUBLIC,
    *,
    is_authenticated: bool | None = None,
    has_app_access: bool | None = None,
    enforcement_mode: AuthEnforcementMode = AuthEnforcementMode.OFF,
    email: str | None = None,
    auth_user_id: str | None = None,
) -> AccessContext:
    resolved_is_authenticated = (
        role is not AppRole.PUBLIC if is_authenticated is None else is_authenticated
    )
    resolved_has_app_access = (
        role is not AppRole.PUBLIC if has_app_access is None else has_app_access
    )
    return AccessContext(
        role=role,
        capabilities=get_capabilities_for_role(role),
        is_authenticated=resolved_is_authenticated,
        has_app_access=resolved_has_app_access,
        enforcement_mode=enforcement_mode,
        email=email,
        auth_user_id=auth_user_id,
    )
