import pytest

from app import crud, schemas
from app.auth.bootstrap import bootstrap_initial_admin
from app.auth.permissions import AppRole
from app.auth.settings import AuthSettings


def test_bootstrap_initial_admin_noops_without_configuration(db_session):
    settings = AuthSettings()

    result = bootstrap_initial_admin(db_session, settings)

    assert result is None
    assert crud.get_users(db_session) == []


def test_bootstrap_initial_admin_creates_admin_user(db_session):
    settings = AuthSettings(
        initial_admin_auth_user_id="supabase-admin-1",
        initial_admin_email="admin@example.com",
    )

    result = bootstrap_initial_admin(db_session, settings)

    assert result is not None
    assert result.role == AppRole.ADMIN.value
    assert result.email == "admin@example.com"
    assert result.is_active is True
    assert crud.get_user_by_auth_user_id(db_session, "supabase-admin-1") is not None


def test_bootstrap_initial_admin_is_idempotent(db_session):
    settings = AuthSettings(
        initial_admin_auth_user_id="supabase-admin-2",
        initial_admin_email="repeat@example.com",
    )

    first = bootstrap_initial_admin(db_session, settings)
    second = bootstrap_initial_admin(db_session, settings)

    assert first is not None
    assert second is not None
    assert first.id == second.id
    assert len(crud.get_users(db_session)) == 1


def test_bootstrap_initial_admin_upgrades_existing_user(db_session):
    existing = crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="supabase-admin-3",
            email="member@example.com",
            role=AppRole.TEAM_MEMBER,
            is_active=False,
        ),
    )
    settings = AuthSettings(
        initial_admin_auth_user_id="supabase-admin-3",
        initial_admin_email="admin-updated@example.com",
    )

    result = bootstrap_initial_admin(db_session, settings)

    assert result is not None
    assert result.id == existing.id
    assert result.role == AppRole.ADMIN.value
    assert result.email == "admin-updated@example.com"
    assert result.is_active is True


def test_bootstrap_initial_admin_rejects_email_conflict(db_session):
    crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="supabase-member-1",
            email="conflict@example.com",
            role=AppRole.TEAM_MEMBER,
        ),
    )
    settings = AuthSettings(
        initial_admin_auth_user_id="supabase-admin-4",
        initial_admin_email="conflict@example.com",
    )

    with pytest.raises(ValueError):
        bootstrap_initial_admin(db_session, settings)
