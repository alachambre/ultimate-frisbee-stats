from app import crud, schemas
from app.auth.admin_client import SupabaseAdminUser
from app.auth.permissions import AppRole
from app.services.user_management import create_managed_user, update_managed_user


class FakeAdminClient:
    def __init__(self):
        self.created_users = []
        self.updated_users = []

    def create_user(self, *, email, password, email_confirm=True, user_metadata=None):
        self.created_users.append(
            {
                "email": email,
                "password": password,
                "email_confirm": email_confirm,
                "user_metadata": user_metadata,
            }
        )
        return SupabaseAdminUser(
            id=f"auth-{len(self.created_users)}",
            email=email,
        )

    def update_user(self, *, auth_user_id, email=None, password=None, user_metadata=None):
        self.updated_users.append(
            {
                "auth_user_id": auth_user_id,
                "email": email,
                "password": password,
                "user_metadata": user_metadata,
            }
        )
        return SupabaseAdminUser(
            id=auth_user_id,
            email=email,
        )


def test_create_managed_user_creates_supabase_and_local_user(db_session):
    admin_client = FakeAdminClient()

    created_user = create_managed_user(
        db_session,
        schemas.AdminUserCreate(
            email="member@example.com",
            password="supersecret",
            role=AppRole.TEAM_MEMBER,
        ),
        admin_client=admin_client,
    )

    assert created_user.email == "member@example.com"
    assert created_user.auth_user_id == "auth-1"
    assert created_user.role == AppRole.TEAM_MEMBER.value
    assert admin_client.created_users[0]["user_metadata"] == {"app_role": "team_member"}


def test_update_managed_user_updates_local_role_and_supabase_metadata(db_session):
    admin_client = FakeAdminClient()
    created_user = crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="auth-user-1",
            email="member@example.com",
            role=AppRole.TEAM_MEMBER,
        ),
    )

    updated_user = update_managed_user(
        db_session,
        created_user.id,
        schemas.AdminUserUpdate(
            role=AppRole.TEAM_ANALYST,
            password="new-password",
        ),
        admin_client=admin_client,
    )

    assert updated_user.role == AppRole.TEAM_ANALYST.value
    assert admin_client.updated_users[0]["auth_user_id"] == "auth-user-1"
    assert admin_client.updated_users[0]["password"] == "new-password"
    assert admin_client.updated_users[0]["user_metadata"] == {"app_role": "team_analyst"}


def test_update_managed_user_prevents_removing_last_active_admin(db_session):
    admin_client = FakeAdminClient()
    created_user = crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="admin-user-1",
            email="admin@example.com",
            role=AppRole.ADMIN,
        ),
    )

    try:
        update_managed_user(
            db_session,
            created_user.id,
            schemas.AdminUserUpdate(role=AppRole.TEAM_ANALYST),
            admin_client=admin_client,
        )
    except Exception as exc:
        from fastapi import HTTPException

        assert isinstance(exc, HTTPException)
        assert exc.status_code == 400
        assert exc.detail == "Cannot remove or deactivate the last active admin"
    else:
        raise AssertionError("Expected update_managed_user to reject removing last admin")
