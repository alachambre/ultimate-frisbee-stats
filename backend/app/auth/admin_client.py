from dataclasses import dataclass

import httpx
from fastapi import Depends, HTTPException, status

from app.auth.settings import AuthSettings, get_auth_settings


@dataclass(frozen=True, slots=True)
class SupabaseAdminUser:
    id: str
    email: str | None


class SupabaseAdminClient:
    def __init__(self, *, supabase_url: str, service_role_key: str):
        self._supabase_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key

    def create_user(
        self,
        *,
        email: str,
        password: str,
        email_confirm: bool = True,
        user_metadata: dict[str, object] | None = None,
    ) -> SupabaseAdminUser:
        payload: dict[str, object] = {
            "email": email,
            "password": password,
            "email_confirm": email_confirm,
        }
        if user_metadata:
            payload["user_metadata"] = user_metadata

        data = self._request(
            "POST",
            "/auth/v1/admin/users",
            json=payload,
            expected_status=status.HTTP_200_OK,
        )
        return SupabaseAdminUser(
            id=str(data["id"]),
            email=data.get("email"),
        )

    def update_user(
        self,
        *,
        auth_user_id: str,
        email: str | None = None,
        password: str | None = None,
        user_metadata: dict[str, object] | None = None,
    ) -> SupabaseAdminUser:
        payload: dict[str, object] = {}
        if email is not None:
            payload["email"] = email
            payload["email_confirm"] = True
        if password is not None:
            payload["password"] = password
        if user_metadata is not None:
            payload["user_metadata"] = user_metadata

        data = self._request(
            "PUT",
            f"/auth/v1/admin/users/{auth_user_id}",
            json=payload,
            expected_status=status.HTTP_200_OK,
        )
        return SupabaseAdminUser(
            id=str(data["id"]),
            email=data.get("email"),
        )

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, object],
        expected_status: int,
    ) -> dict[str, object]:
        headers = {
            "Authorization": f"Bearer {self._service_role_key}",
            "apikey": self._service_role_key,
            "Content-Type": "application/json",
        }

        try:
            response = httpx.request(
                method,
                f"{self._supabase_url}{path}",
                headers=headers,
                json=json,
                timeout=10.0,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Supabase admin API is unavailable",
            ) from exc

        if response.status_code != expected_status:
            detail = _extract_error_detail(response)
            raise HTTPException(
                status_code=_map_supabase_error_status(response.status_code),
                detail=detail,
            )

        data = response.json()
        if not isinstance(data, dict):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unexpected response from Supabase admin API",
            )

        return data


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return "Supabase admin API request failed"

    if isinstance(payload, dict):
        for key in ("msg", "message", "error_description", "error"):
            value = payload.get(key)
            if isinstance(value, str) and value:
                return value

    return "Supabase admin API request failed"


def _map_supabase_error_status(status_code: int) -> int:
    if status_code in {
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
        status.HTTP_404_NOT_FOUND,
        status.HTTP_409_CONFLICT,
        status.HTTP_422_UNPROCESSABLE_ENTITY,
    }:
        return status_code
    return status.HTTP_502_BAD_GATEWAY


def get_supabase_admin_client(
    settings: AuthSettings = Depends(get_auth_settings),
) -> SupabaseAdminClient | None:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None

    return SupabaseAdminClient(
        supabase_url=settings.supabase_url,
        service_role_key=settings.supabase_service_role_key,
    )
