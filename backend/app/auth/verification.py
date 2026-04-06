from fastapi import Depends, HTTPException, status
import httpx
from functools import lru_cache

import jwt
from jwt import InvalidTokenError, PyJWKClient

from app.auth.settings import AuthSettings, get_auth_settings
from app.auth.types import VerifiedTokenClaims


def parse_bearer_token(authorization_header: str | None) -> str | None:
    if authorization_header is None:
        return None

    parts = authorization_header.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )

    return parts[1]


class SupabaseTokenVerifier:
    def __init__(
        self,
        *,
        jwks_url: str,
        issuer: str,
        audience: str,
        supabase_url: str,
        service_role_key: str | None,
    ):
        self._audience = audience
        self._issuer = issuer
        self._jwk_client = PyJWKClient(jwks_url)
        self._service_role_key = service_role_key
        self._supabase_url = supabase_url.rstrip("/")

    def verify_access_token(self, token: str) -> VerifiedTokenClaims:
        algorithm = self._get_token_algorithm(token)
        if algorithm == "HS256":
            return self._verify_access_token_via_auth_server(token)

        if algorithm not in {"RS256", "ES256"}:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unsupported authentication token algorithm",
            )

        try:
            signing_key = self._jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[algorithm],
                audience=self._audience,
                issuer=self._issuer,
            )
        except InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            ) from exc

        subject = payload.get("sub")
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token is missing subject",
            )

        return VerifiedTokenClaims(
            sub=subject,
            email=payload.get("email"),
        )

    def _get_token_algorithm(self, token: str) -> str:
        try:
            header = jwt.get_unverified_header(token)
        except InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            ) from exc

        algorithm = header.get("alg")
        if not algorithm:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token is missing algorithm",
            )
        return algorithm

    def _verify_access_token_via_auth_server(self, token: str) -> VerifiedTokenClaims:
        if not self._service_role_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "HS256 token verification requires SUPABASE_SERVICE_ROLE_KEY "
                    "or migrating Supabase Auth to asymmetric signing keys"
                ),
            )

        try:
            response = httpx.get(
                f"{self._supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": self._service_role_key,
                },
                timeout=5.0,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Supabase Auth verification is unavailable",
            ) from exc

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        user_data = response.json()
        subject = user_data.get("id")
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token is missing subject",
            )

        return VerifiedTokenClaims(
            sub=subject,
            email=user_data.get("email"),
        )


@lru_cache(maxsize=4)
def _build_token_verifier(
    jwks_url: str,
    issuer: str,
    audience: str,
    supabase_url: str,
    service_role_key: str | None,
) -> SupabaseTokenVerifier:
    return SupabaseTokenVerifier(
        jwks_url=jwks_url,
        issuer=issuer,
        audience=audience,
        supabase_url=supabase_url,
        service_role_key=service_role_key,
    )


def get_token_verifier(
    settings: AuthSettings = Depends(get_auth_settings),
) -> SupabaseTokenVerifier | None:
    if not settings.is_supabase_auth_configured:
        return None

    return _build_token_verifier(
        settings.supabase_jwks_url,
        settings.supabase_jwt_issuer,
        settings.supabase_jwt_audience,
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
