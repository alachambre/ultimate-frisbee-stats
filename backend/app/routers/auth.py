from dataclasses import asdict

from fastapi import APIRouter, Depends

from app.auth.context import AccessContext
from app.auth.dependencies import get_request_access_context
from app.schemas.auth import AuthMe

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthMe)
def get_current_user(
    access_context: AccessContext = Depends(get_request_access_context),
):
    return {
        "role": access_context.role,
        "capabilities": asdict(access_context.capabilities),
        "is_authenticated": access_context.is_authenticated,
        "has_app_access": access_context.has_app_access,
        "enforcement_mode": access_context.enforcement_mode,
        "email": access_context.email,
        "auth_user_id": access_context.auth_user_id,
    }
