from sqlalchemy.orm import Session

from app import models, schemas
from app.auth.permissions import AppRole


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        auth_user_id=user.auth_user_id,
        email=user.email,
        role=user.role.value,
        is_active=user.is_active,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_auth_user_id(db: Session, auth_user_id: str) -> models.User | None:
    return db.query(models.User).filter(models.User.auth_user_id == auth_user_id).first()


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[models.User]:
    return (
        db.query(models.User)
        .order_by(models.User.email.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_active_admin_users(db: Session) -> int:
    return (
        db.query(models.User)
        .filter(
            models.User.role == AppRole.ADMIN.value,
            models.User.is_active.is_(True),
        )
        .count()
    )


def update_user(
    db: Session,
    user_id: int,
    user_update: schemas.UserUpdate,
) -> models.User | None:
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "role" and value is not None:
            setattr(db_user, field, value.value)
        else:
            setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user
