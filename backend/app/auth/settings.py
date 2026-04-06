from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthSettings(BaseSettings):
    supabase_url: str | None = None
    supabase_jwks_url: str | None = None
    supabase_service_role_key: str | None = None
    initial_admin_auth_user_id: str | None = None
    initial_admin_email: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def is_supabase_auth_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_jwks_url)

    @property
    def has_service_role_key(self) -> bool:
        return bool(self.supabase_service_role_key)

    @property
    def is_initial_admin_bootstrap_configured(self) -> bool:
        return bool(self.initial_admin_auth_user_id and self.initial_admin_email)


@lru_cache(maxsize=1)
def get_auth_settings() -> AuthSettings:
    return AuthSettings()
