from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import crud
from app.auth.context import AccessContext, build_access_context
from app.auth.permissions import AppRole, has_minimum_role
from app.auth.settings import AuthSettings, get_auth_settings
from app.auth.types import AuthEnforcementMode
from app.auth.verification import SupabaseTokenVerifier, get_token_verifier, parse_bearer_token
from app.database import get_db
from app.logging_config import get_logger


logger = get_logger("auth.dependencies")


def get_request_access_context(
    request: Request,
    db: Session = Depends(get_db),
    settings: AuthSettings = Depends(get_auth_settings),
    token_verifier: SupabaseTokenVerifier | None = Depends(get_token_verifier),
) -> AccessContext:
    if settings.auth_enforcement_mode is AuthEnforcementMode.OFF:
        return build_access_context(
            enforcement_mode=settings.auth_enforcement_mode,
        )

    token = parse_bearer_token(request.headers.get("Authorization"))
    if token is None:
        return build_access_context(
            enforcement_mode=settings.auth_enforcement_mode,
        )

    if token_verifier is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication is not configured",
        )

    claims = token_verifier.verify_access_token(token)
    user = crud.get_user_by_auth_user_id(db, claims.sub)
    if user is not None and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if user is None:
        return build_access_context(
            AppRole.PUBLIC,
            is_authenticated=True,
            has_app_access=False,
            enforcement_mode=settings.auth_enforcement_mode,
            email=claims.email,
            auth_user_id=claims.sub,
        )

    return build_access_context(
        AppRole(user.role),
        is_authenticated=True,
        has_app_access=True,
        enforcement_mode=settings.auth_enforcement_mode,
        email=user.email,
        auth_user_id=user.auth_user_id,
    )


def require_minimum_role(minimum_role: AppRole) -> Callable[[AccessContext], AccessContext]:
    def dependency(
        request: Request,
        access_context: AccessContext = Depends(get_request_access_context),
        settings: AuthSettings = Depends(get_auth_settings),
    ) -> AccessContext:
        if settings.auth_enforcement_mode is not AuthEnforcementMode.ENFORCED:
            if (
                settings.auth_enforcement_mode is AuthEnforcementMode.SHADOW
                and not has_minimum_role(access_context.role, minimum_role)
            ):
                logger.info(
                    "Shadow auth would reject %s %s for role %s (requires %s)",
                    request.method,
                    request.url.path,
                    access_context.role.value,
                    minimum_role.value,
                )
            return access_context

        if has_minimum_role(access_context.role, minimum_role):
            return access_context

        if access_context.is_authenticated and not access_context.has_app_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No app access configured",
            )

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
