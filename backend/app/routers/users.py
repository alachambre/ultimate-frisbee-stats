from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth.admin_client import SupabaseAdminClient, get_supabase_admin_client
from app.auth.context import AccessContext
from app.auth.dependencies import require_admin_strict
from app.database import get_db
from app.services.user_management import create_managed_user, update_managed_user


router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[schemas.User])
def list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    _: AccessContext = Depends(require_admin_strict),
    db: Session = Depends(get_db),
):
    return crud.get_users(db, skip=skip, limit=limit)


@router.post(
    "",
    response_model=schemas.User,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_create: schemas.AdminUserCreate,
    _: AccessContext = Depends(require_admin_strict),
    db: Session = Depends(get_db),
    admin_client: SupabaseAdminClient | None = Depends(get_supabase_admin_client),
):
    return create_managed_user(
        db,
        user_create,
        admin_client=admin_client,
    )


@router.patch("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.AdminUserUpdate,
    _: AccessContext = Depends(require_admin_strict),
    db: Session = Depends(get_db),
    admin_client: SupabaseAdminClient | None = Depends(get_supabase_admin_client),
):
    return update_managed_user(
        db,
        user_id,
        user_update,
        admin_client=admin_client,
    )
