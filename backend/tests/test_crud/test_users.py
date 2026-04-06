import pytest
from pydantic import ValidationError

from app import crud, schemas
from app.auth.permissions import AppRole


def test_create_user(db_session):
    user = crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="supabase-user-1",
            email="member@example.com",
            role=AppRole.TEAM_MEMBER,
        ),
    )

    assert user.id is not None
    assert user.auth_user_id == "supabase-user-1"
    assert user.email == "member@example.com"
    assert user.role == AppRole.TEAM_MEMBER.value
    assert user.is_active is True


def test_get_user_by_auth_user_id(db_session):
    created = crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="supabase-user-2",
            email="analyst@example.com",
            role=AppRole.TEAM_ANALYST,
        ),
    )

    fetched = crud.get_user_by_auth_user_id(db_session, "supabase-user-2")

    assert fetched is not None
    assert fetched.id == created.id


def test_update_user_role_and_activation(db_session):
    created = crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="supabase-user-3",
            email="editor@example.com",
            role=AppRole.TEAM_MEMBER,
        ),
    )

    updated = crud.update_user(
        db_session,
        created.id,
        schemas.UserUpdate(role=AppRole.ADMIN, is_active=False),
    )

    assert updated is not None
    assert updated.role == AppRole.ADMIN.value
    assert updated.is_active is False


def test_get_users_returns_created_users(db_session):
    crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="supabase-user-4",
            email="first@example.com",
        ),
    )
    crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="supabase-user-5",
            email="second@example.com",
        ),
    )

    users = crud.get_users(db_session)

    assert len(users) == 2


def test_user_schema_rejects_invalid_role():
    with pytest.raises(ValidationError):
        schemas.UserCreate(
            auth_user_id="supabase-user-invalid",
            email="invalid@example.com",
            role="captain",
        )
