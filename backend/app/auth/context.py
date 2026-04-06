from dataclasses import dataclass

from app.auth.permissions import AppCapabilities, AppRole, get_capabilities_for_role


@dataclass(frozen=True, slots=True)
class AccessContext:
    role: AppRole
    capabilities: AppCapabilities
    is_authenticated: bool
    email: str | None = None
    auth_user_id: str | None = None


def build_access_context(
    role: AppRole = AppRole.PUBLIC,
    *,
    email: str | None = None,
    auth_user_id: str | None = None,
) -> AccessContext:
    return AccessContext(
        role=role,
        capabilities=get_capabilities_for_role(role),
        is_authenticated=role is not AppRole.PUBLIC,
        email=email,
        auth_user_id=auth_user_id,
    )
