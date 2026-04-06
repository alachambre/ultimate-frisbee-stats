from collections.abc import Callable

from fastapi import Depends, HTTPException, status

from app.auth.context import AccessContext, build_access_context
from app.auth.permissions import AppRole, has_minimum_role


def get_request_access_context() -> AccessContext:
    return build_access_context()


def require_minimum_role(minimum_role: AppRole) -> Callable[[AccessContext], AccessContext]:
    def dependency(
        access_context: AccessContext = Depends(get_request_access_context),
    ) -> AccessContext:
        if has_minimum_role(access_context.role, minimum_role):
            return access_context

        if access_context.is_authenticated:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    return dependency


require_team_member = require_minimum_role(AppRole.TEAM_MEMBER)
require_team_analyst = require_minimum_role(AppRole.TEAM_ANALYST)
require_admin = require_minimum_role(AppRole.ADMIN)
