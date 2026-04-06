from app.auth.settings import get_auth_settings


def test_get_auth_settings_reads_environment(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_JWKS_URL", "https://example.supabase.co/auth/v1/.well-known/jwks.json")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
    monkeypatch.setenv("INITIAL_ADMIN_AUTH_USER_ID", "supabase-admin-1")
    monkeypatch.setenv("INITIAL_ADMIN_EMAIL", "admin@example.com")
    get_auth_settings.cache_clear()

    settings = get_auth_settings()

    assert settings.supabase_url == "https://example.supabase.co"
    assert settings.supabase_jwks_url.endswith("/jwks.json")
    assert settings.has_service_role_key is True
    assert settings.is_supabase_auth_configured is True
    assert settings.initial_admin_auth_user_id == "supabase-admin-1"
    assert settings.initial_admin_email == "admin@example.com"
    assert settings.is_initial_admin_bootstrap_configured is True

    get_auth_settings.cache_clear()


def test_root_endpoint_still_available(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "Ultimate Frisbee Stats API"
