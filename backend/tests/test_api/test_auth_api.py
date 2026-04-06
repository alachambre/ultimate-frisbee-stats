from app import crud, schemas
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


def test_auth_me_returns_public_context_in_off_mode(client):
    app = client.app
    app.dependency_overrides[get_auth_settings] = lambda: AuthSettings(
        auth_enforcement_mode=AuthEnforcementMode.OFF,
    )

    response = client.get("/auth/me")

    assert response.status_code == 200
    assert response.json()["role"] == "public"
    assert response.json()["is_authenticated"] is False
    assert response.json()["enforcement_mode"] == "off"


def test_auth_me_returns_public_context_for_anonymous_shadow_request(client):
    app = client.app
    app.dependency_overrides[get_auth_settings] = lambda: AuthSettings(
        auth_enforcement_mode=AuthEnforcementMode.SHADOW,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="https://example.supabase.co/auth/v1/.well-known/jwks.json",
    )
    app.dependency_overrides[get_token_verifier] = lambda: FakeTokenVerifier({})

    response = client.get("/auth/me")

    assert response.status_code == 200
    assert response.json()["role"] == "public"
    assert response.json()["is_authenticated"] is False
    assert response.json()["enforcement_mode"] == "shadow"


def test_auth_me_returns_provisioned_user_context(client, db_session):
    crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="supabase-user-1",
            email="analyst@example.com",
            role=AppRole.TEAM_ANALYST,
        ),
    )
    app = client.app
    app.dependency_overrides[get_auth_settings] = lambda: AuthSettings(
        auth_enforcement_mode=AuthEnforcementMode.SHADOW,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="https://example.supabase.co/auth/v1/.well-known/jwks.json",
    )
    app.dependency_overrides[get_token_verifier] = lambda: FakeTokenVerifier(
        {
            "valid-token": VerifiedTokenClaims(
                sub="supabase-user-1",
                email="analyst@example.com",
            )
        }
    )

    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "team_analyst"
    assert data["is_authenticated"] is True
    assert data["has_app_access"] is True
    assert data["email"] == "analyst@example.com"


def test_auth_me_returns_authenticated_without_app_access_for_unprovisioned_user(client):
    app = client.app
    app.dependency_overrides[get_auth_settings] = lambda: AuthSettings(
        auth_enforcement_mode=AuthEnforcementMode.SHADOW,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="https://example.supabase.co/auth/v1/.well-known/jwks.json",
    )
    app.dependency_overrides[get_token_verifier] = lambda: FakeTokenVerifier(
        {
            "valid-token": VerifiedTokenClaims(
                sub="supabase-user-2",
                email="member@example.com",
            )
        }
    )

    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "public"
    assert data["is_authenticated"] is True
    assert data["has_app_access"] is False
    assert data["auth_user_id"] == "supabase-user-2"


def test_auth_me_rejects_invalid_tokens(client):
    app = client.app
    app.dependency_overrides[get_auth_settings] = lambda: AuthSettings(
        auth_enforcement_mode=AuthEnforcementMode.SHADOW,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="https://example.supabase.co/auth/v1/.well-known/jwks.json",
    )
    app.dependency_overrides[get_token_verifier] = lambda: FakeTokenVerifier({})

    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401


def test_auth_me_rejects_inactive_users(client, db_session):
    crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="supabase-user-3",
            email="inactive@example.com",
            role=AppRole.TEAM_MEMBER,
            is_active=False,
        ),
    )
    app = client.app
    app.dependency_overrides[get_auth_settings] = lambda: AuthSettings(
        auth_enforcement_mode=AuthEnforcementMode.SHADOW,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="https://example.supabase.co/auth/v1/.well-known/jwks.json",
    )
    app.dependency_overrides[get_token_verifier] = lambda: FakeTokenVerifier(
        {
            "valid-token": VerifiedTokenClaims(
                sub="supabase-user-3",
                email="inactive@example.com",
            )
        }
    )

    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 403
