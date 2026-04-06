from dataclasses import dataclass
from enum import Enum


class AppRole(str, Enum):
    PUBLIC = "public"
    TEAM_MEMBER = "team_member"
    TEAM_ANALYST = "team_analyst"
    ADMIN = "admin"


ROLE_HIERARCHY = (
    AppRole.PUBLIC,
    AppRole.TEAM_MEMBER,
    AppRole.TEAM_ANALYST,
    AppRole.ADMIN,
)

_ROLE_RANK = {role: index for index, role in enumerate(ROLE_HIERARCHY)}


@dataclass(frozen=True, slots=True)
class AppCapabilities:
    can_view_public_content: bool
    can_view_comments: bool
    can_view_strategies: bool
    can_edit_data: bool
    can_view_statistics: bool
    can_export_statistics: bool
    can_manage_users: bool


_CAPABILITY_MATRIX = {
    AppRole.PUBLIC: AppCapabilities(
        can_view_public_content=True,
        can_view_comments=False,
        can_view_strategies=False,
        can_edit_data=False,
        can_view_statistics=False,
        can_export_statistics=False,
        can_manage_users=False,
    ),
    AppRole.TEAM_MEMBER: AppCapabilities(
        can_view_public_content=True,
        can_view_comments=True,
        can_view_strategies=True,
        can_edit_data=True,
        can_view_statistics=False,
        can_export_statistics=False,
        can_manage_users=False,
    ),
    AppRole.TEAM_ANALYST: AppCapabilities(
        can_view_public_content=True,
        can_view_comments=True,
        can_view_strategies=True,
        can_edit_data=True,
        can_view_statistics=True,
        can_export_statistics=True,
        can_manage_users=False,
    ),
    AppRole.ADMIN: AppCapabilities(
        can_view_public_content=True,
        can_view_comments=True,
        can_view_strategies=True,
        can_edit_data=True,
        can_view_statistics=True,
        can_export_statistics=True,
        can_manage_users=True,
    ),
}


def get_capabilities_for_role(role: AppRole) -> AppCapabilities:
    return _CAPABILITY_MATRIX[role]


def has_minimum_role(role: AppRole, minimum_role: AppRole) -> bool:
    return _ROLE_RANK[role] >= _ROLE_RANK[minimum_role]
