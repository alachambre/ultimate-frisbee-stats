from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth.permissions import AppRole
from app.auth.settings import AuthSettings


def bootstrap_initial_admin(
    db: Session,
    settings: AuthSettings,
):
    if not settings.is_initial_admin_bootstrap_configured:
        return None

    auth_user_id = settings.initial_admin_auth_user_id
    email = settings.initial_admin_email
    assert auth_user_id is not None
    assert email is not None

    existing_by_auth = crud.get_user_by_auth_user_id(db, auth_user_id)
    if existing_by_auth:
        changed = False
        if existing_by_auth.email != email:
            existing_by_auth.email = email
            changed = True
        if existing_by_auth.role != AppRole.ADMIN.value:
            existing_by_auth.role = AppRole.ADMIN.value
            changed = True
        if not existing_by_auth.is_active:
            existing_by_auth.is_active = True
            changed = True
        if changed:
            db.commit()
            db.refresh(existing_by_auth)
        return existing_by_auth

    existing_by_email = crud.get_user_by_email(db, email)
    if existing_by_email and existing_by_email.auth_user_id != auth_user_id:
        raise ValueError(
            "Initial admin email is already assigned to a different auth user id"
        )

    if existing_by_email:
        existing_by_email.auth_user_id = auth_user_id
        existing_by_email.role = AppRole.ADMIN.value
        existing_by_email.is_active = True
        db.commit()
        db.refresh(existing_by_email)
        return existing_by_email

    return crud.create_user(
        db,
        schemas.UserCreate(
            auth_user_id=auth_user_id,
            email=email,
            role=AppRole.ADMIN,
            is_active=True,
        ),
    )
