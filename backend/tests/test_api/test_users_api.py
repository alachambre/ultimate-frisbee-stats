from app import crud, schemas
from app.auth.admin_client import get_supabase_admin_client
from app.auth.permissions import AppRole
from app.auth.settings import AuthSettings, get_auth_settings
from app.auth.types import AuthEnforcementMode, VerifiedTokenClaims
from app.auth.verification import get_token_verifier


class FakeTokenVerifier:
    def __init__(self, tokens_to_claims):
        self.tokens_to_claims = tokens_to_claims

    def verify_access_token(self, token: str) -> VerifiedTokenClaims:
        claims = self.tokens_to_claims.get(token)
        if claims is None:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        return claims


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
        return type("SupabaseAdminUser", (), {"id": "auth-created-1", "email": email})()

    def update_user(self, *, auth_user_id, email=None, password=None, user_metadata=None):
        self.updated_users.append(
            {
                "auth_user_id": auth_user_id,
                "email": email,
                "password": password,
                "user_metadata": user_metadata,
            }
        )
        return type("SupabaseAdminUser", (), {"id": auth_user_id, "email": email})()


def _configure_admin_auth(app, *, db_session):
    crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="admin-user-1",
            email="admin@example.com",
            role=AppRole.ADMIN,
        ),
    )
    app.dependency_overrides[get_auth_settings] = lambda: AuthSettings(
        auth_enforcement_mode=AuthEnforcementMode.SHADOW,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="https://example.supabase.co/auth/v1/.well-known/jwks.json",
        supabase_service_role_key="service-role-key",
    )
    app.dependency_overrides[get_token_verifier] = lambda: FakeTokenVerifier(
        {
            "admin-token": VerifiedTokenClaims(
                sub="admin-user-1",
                email="admin@example.com",
            ),
            "member-token": VerifiedTokenClaims(
                sub="member-user-1",
                email="member@example.com",
            ),
        }
    )


def test_list_users_requires_admin(client, db_session):
    app = client.app
    _configure_admin_auth(app, db_session=db_session)
    crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="member-user-1",
            email="member@example.com",
            role=AppRole.TEAM_MEMBER,
        ),
    )

    response = client.get("/users", headers={"Authorization": "Bearer member-token"})

    assert response.status_code == 403


def test_admin_can_list_users(client, db_session):
    app = client.app
    _configure_admin_auth(app, db_session=db_session)

    response = client.get("/users", headers={"Authorization": "Bearer admin-token"})

    assert response.status_code == 200
    assert response.json()[0]["email"] == "admin@example.com"


def test_admin_can_create_user(client, db_session):
    app = client.app
    _configure_admin_auth(app, db_session=db_session)
    fake_admin_client = FakeAdminClient()
    app.dependency_overrides[get_supabase_admin_client] = lambda: fake_admin_client

    response = client.post(
        "/users",
        headers={"Authorization": "Bearer admin-token"},
        json={
            "email": "analyst@example.com",
            "password": "very-secret",
            "role": "team_analyst",
            "is_active": True,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["email"] == "analyst@example.com"
    assert payload["role"] == "team_analyst"
    assert fake_admin_client.created_users[0]["password"] == "very-secret"


def test_admin_can_update_role_and_activation(client, db_session):
    app = client.app
    _configure_admin_auth(app, db_session=db_session)
    fake_admin_client = FakeAdminClient()
    app.dependency_overrides[get_supabase_admin_client] = lambda: fake_admin_client
    member = crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="member-auth-1",
            email="member@example.com",
            role=AppRole.TEAM_MEMBER,
        ),
    )

    response = client.patch(
        f"/users/{member.id}",
        headers={"Authorization": "Bearer admin-token"},
        json={
            "role": "team_analyst",
            "is_active": False,
            "password": "rotated-secret",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["role"] == "team_analyst"
    assert payload["is_active"] is False
    assert fake_admin_client.updated_users[0]["password"] == "rotated-secret"


def test_admin_cannot_remove_last_active_admin(client, db_session):
    app = client.app
    _configure_admin_auth(app, db_session=db_session)
    app.dependency_overrides[get_supabase_admin_client] = lambda: FakeAdminClient()
    admin = crud.get_user_by_email(db_session, "admin@example.com")

    response = client.patch(
        f"/users/{admin.id}",
        headers={"Authorization": "Bearer admin-token"},
        json={"is_active": False},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Cannot remove or deactivate the last active admin"
