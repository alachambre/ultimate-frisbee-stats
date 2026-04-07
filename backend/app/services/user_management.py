from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.auth.admin_client import SupabaseAdminClient
from app.auth.permissions import AppRole
from app.logging_config import get_logger


logger = get_logger("services.user_management")


def create_managed_user(
    db: Session,
    user_create: schemas.AdminUserCreate,
    *,
    admin_client: SupabaseAdminClient | None,
) -> models.User:
    if admin_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase admin management is not configured",
        )

    existing_user = crud.get_user_by_email(db, user_create.email)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    supabase_user = admin_client.create_user(
        email=user_create.email,
        password=user_create.password,
        user_metadata={"app_role": user_create.role.value},
    )

    created_user = crud.create_user(
        db,
        schemas.UserCreate(
            auth_user_id=supabase_user.id,
            email=supabase_user.email or user_create.email,
            role=user_create.role,
            is_active=user_create.is_active,
        ),
    )

    logger.info(
        "Admin created user %s with role %s",
        created_user.email,
        created_user.role,
    )
    return created_user


def update_managed_user(
    db: Session,
    user_id: int,
    user_update: schemas.AdminUserUpdate,
    *,
    admin_client: SupabaseAdminClient | None,
) -> models.User:
    db_user = crud.get_user(db, user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    next_email = user_update.email
    if next_email and next_email != db_user.email:
        existing_user = crud.get_user_by_email(db, next_email)
        if existing_user is not None and existing_user.id != db_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists",
            )

    _ensure_last_admin_is_not_removed(db, db_user, user_update)

    should_sync_supabase = bool(
        (user_update.email and user_update.email != db_user.email)
        or user_update.password
        or user_update.role is not None
    )

    if should_sync_supabase and admin_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase admin management is not configured",
        )

    if should_sync_supabase and admin_client is not None:
        admin_client.update_user(
            auth_user_id=db_user.auth_user_id,
            email=user_update.email if user_update.email != db_user.email else None,
            password=user_update.password,
            user_metadata=(
                {"app_role": user_update.role.value}
                if user_update.role is not None
                else None
            ),
        )

    local_update_data: dict[str, object] = {}
    if user_update.email is not None:
        local_update_data["email"] = user_update.email
    if user_update.role is not None:
        local_update_data["role"] = user_update.role
    if user_update.is_active is not None:
        local_update_data["is_active"] = user_update.is_active

    updated_user = crud.update_user(
        db,
        db_user.id,
        schemas.UserUpdate(**local_update_data),
    )
    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    logger.info(
        "Admin updated user %s (role=%s, active=%s)",
        updated_user.email,
        updated_user.role,
        updated_user.is_active,
    )
    return updated_user


def _ensure_last_admin_is_not_removed(
    db: Session,
    db_user: models.User,
    user_update: schemas.AdminUserUpdate,
) -> None:
    is_current_active_admin = (
        db_user.role == AppRole.ADMIN.value and db_user.is_active
    )
    if not is_current_active_admin:
        return

    would_lose_admin_role = (
        user_update.role is not None and user_update.role is not AppRole.ADMIN
    )
    would_be_deactivated = user_update.is_active is False
    if not would_lose_admin_role and not would_be_deactivated:
        return

    if crud.count_active_admin_users(db) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove or deactivate the last active admin",
        )
