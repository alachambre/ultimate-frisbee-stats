from dataclasses import asdict

from fastapi import HTTPException
import pytest

from app.auth.context import build_access_context
from app.auth.dependencies import require_admin, require_team_analyst, require_team_member
from app.auth.permissions import AppRole, get_capabilities_for_role, has_minimum_role
from app.auth.settings import AuthSettings
from app.auth.types import AuthEnforcementMode


@pytest.mark.parametrize(
    ("role", "expected"),
    [
        (
            AppRole.PUBLIC,
            {
                "can_view_public_content": True,
                "can_view_comments": False,
                "can_view_strategies": False,
                "can_edit_data": False,
                "can_view_statistics": False,
                "can_export_statistics": False,
                "can_manage_users": False,
            },
        ),
        (
            AppRole.TEAM_MEMBER,
            {
                "can_view_public_content": True,
                "can_view_comments": True,
                "can_view_strategies": True,
                "can_edit_data": True,
                "can_view_statistics": False,
                "can_export_statistics": False,
                "can_manage_users": False,
            },
        ),
        (
            AppRole.TEAM_ANALYST,
            {
                "can_view_public_content": True,
                "can_view_comments": True,
                "can_view_strategies": True,
                "can_edit_data": True,
                "can_view_statistics": True,
                "can_export_statistics": True,
                "can_manage_users": False,
            },
        ),
        (
            AppRole.ADMIN,
            {
                "can_view_public_content": True,
                "can_view_comments": True,
                "can_view_strategies": True,
                "can_edit_data": True,
                "can_view_statistics": True,
                "can_export_statistics": True,
                "can_manage_users": True,
            },
        ),
    ],
)
def test_get_capabilities_for_role(role, expected):
    capabilities = get_capabilities_for_role(role)

    assert asdict(capabilities) == expected


@pytest.mark.parametrize(
    ("role", "minimum_role", "expected"),
    [
        (AppRole.PUBLIC, AppRole.PUBLIC, True),
        (AppRole.PUBLIC, AppRole.TEAM_MEMBER, False),
        (AppRole.TEAM_MEMBER, AppRole.PUBLIC, True),
        (AppRole.TEAM_MEMBER, AppRole.TEAM_MEMBER, True),
        (AppRole.TEAM_MEMBER, AppRole.TEAM_ANALYST, False),
        (AppRole.TEAM_ANALYST, AppRole.TEAM_MEMBER, True),
        (AppRole.ADMIN, AppRole.TEAM_ANALYST, True),
        (AppRole.ADMIN, AppRole.ADMIN, True),
    ],
)
def test_has_minimum_role(role, minimum_role, expected):
    assert has_minimum_role(role, minimum_role) is expected


def test_build_access_context_marks_public_as_anonymous():
    access_context = build_access_context()

    assert access_context.role == AppRole.PUBLIC
    assert access_context.is_authenticated is False
    assert access_context.capabilities.can_view_public_content is True


def test_build_access_context_marks_non_public_roles_as_authenticated():
    access_context = build_access_context(
        AppRole.TEAM_ANALYST,
        email="analyst@example.com",
        auth_user_id="auth-user-1",
    )

    assert access_context.is_authenticated is True
    assert access_context.email == "analyst@example.com"
    assert access_context.auth_user_id == "auth-user-1"
    assert access_context.capabilities.can_view_statistics is True


def test_require_team_member_rejects_public_requests():
    with pytest.raises(HTTPException) as exc_info:
        require_team_member(
            request=_build_request(),
            access_context=build_access_context(
                enforcement_mode=AuthEnforcementMode.ENFORCED
            ),
            settings=AuthSettings(auth_enforcement_mode=AuthEnforcementMode.ENFORCED),
        )

    assert exc_info.value.status_code == 401


def test_require_team_analyst_rejects_team_members():
    with pytest.raises(HTTPException) as exc_info:
        require_team_analyst(
            request=_build_request(),
            access_context=build_access_context(
                AppRole.TEAM_MEMBER,
                enforcement_mode=AuthEnforcementMode.ENFORCED,
            ),
            settings=AuthSettings(auth_enforcement_mode=AuthEnforcementMode.ENFORCED),
        )

    assert exc_info.value.status_code == 403


def test_require_admin_accepts_admin_users():
    access_context = require_admin(
        request=_build_request(),
        access_context=build_access_context(
            AppRole.ADMIN,
            enforcement_mode=AuthEnforcementMode.ENFORCED,
        ),
        settings=AuthSettings(auth_enforcement_mode=AuthEnforcementMode.ENFORCED),
    )

    assert access_context.role == AppRole.ADMIN


def test_require_team_member_allows_requests_in_shadow_mode():
    access_context = require_team_member(
        request=_build_request(),
        access_context=build_access_context(
            enforcement_mode=AuthEnforcementMode.SHADOW
        ),
        settings=AuthSettings(auth_enforcement_mode=AuthEnforcementMode.SHADOW),
    )

    assert access_context.role == AppRole.PUBLIC


def test_require_team_member_rejects_authenticated_users_without_app_access():
    with pytest.raises(HTTPException) as exc_info:
        require_team_member(
            request=_build_request(),
            access_context=build_access_context(
                AppRole.PUBLIC,
                is_authenticated=True,
                has_app_access=False,
                enforcement_mode=AuthEnforcementMode.ENFORCED,
                email="user@example.com",
                auth_user_id="supabase-user-4",
            ),
            settings=AuthSettings(auth_enforcement_mode=AuthEnforcementMode.ENFORCED),
        )

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "No app access configured"


def _build_request():
    from starlette.requests import Request

    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/protected",
            "headers": [],
            "query_string": b"",
            "server": ("testserver", 80),
            "client": ("testclient", 50000),
            "scheme": "http",
        }
    )
