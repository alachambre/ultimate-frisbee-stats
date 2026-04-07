from typing import Any

from fastapi.encoders import jsonable_encoder

from app.auth.context import AccessContext
from app.auth.types import AuthEnforcementMode


def serialize_game_with_score(game: Any, access_context: AccessContext) -> dict[str, Any]:
    payload = _to_payload(game)
    _redact_comments(payload, access_context)
    return payload


def serialize_games_with_score(games: list[Any], access_context: AccessContext) -> list[dict[str, Any]]:
    return [serialize_game_with_score(game, access_context) for game in games]


def serialize_game_detail(game_detail: Any, access_context: AccessContext) -> dict[str, Any]:
    payload = serialize_game_with_score(game_detail, access_context)
    payload["points"] = [
        serialize_point(point, access_context)
        for point in _read_field(game_detail, "points", [])
    ]
    payload["halftime"] = serialize_halftime(
        _read_field(game_detail, "halftime"),
        access_context,
    )
    return payload


def serialize_point(point: Any, access_context: AccessContext) -> dict[str, Any]:
    payload = _to_payload(point)
    _redact_comments(payload, access_context)
    if _should_redact_strategies(access_context):
        payload["strategy_id"] = None
        payload["strategy"] = None
    return payload


def serialize_points(points: list[Any], access_context: AccessContext) -> list[dict[str, Any]]:
    return [serialize_point(point, access_context) for point in points]


def serialize_stoppage(stoppage: Any, access_context: AccessContext) -> dict[str, Any] | None:
    if stoppage is None:
        return None
    payload = _to_payload(stoppage)
    _redact_comments(payload, access_context)
    return payload


def serialize_stoppages(stoppages: list[Any], access_context: AccessContext) -> list[dict[str, Any]]:
    return [serialize_stoppage(stoppage, access_context) for stoppage in stoppages]


def serialize_turnover(turnover: Any, access_context: AccessContext) -> dict[str, Any] | None:
    if turnover is None:
        return None
    payload = _to_payload(turnover)
    _redact_comments(payload, access_context)
    return payload


def serialize_turnovers(turnovers: list[Any], access_context: AccessContext) -> list[dict[str, Any]]:
    return [serialize_turnover(turnover, access_context) for turnover in turnovers]


def serialize_halftime(halftime: Any, access_context: AccessContext) -> dict[str, Any] | None:
    if halftime is None:
        return None
    payload = _to_payload(halftime)
    _redact_comments(payload, access_context)
    return payload


def _redact_comments(payload: dict[str, Any], access_context: AccessContext) -> None:
    if _should_redact_comments(access_context):
        payload["comments"] = None


def _should_redact_comments(access_context: AccessContext) -> bool:
    return (
        access_context.enforcement_mode is not AuthEnforcementMode.OFF
        and (
            not access_context.has_app_access
            or not access_context.capabilities.can_view_comments
        )
    )


def _should_redact_strategies(access_context: AccessContext) -> bool:
    return (
        access_context.enforcement_mode is not AuthEnforcementMode.OFF
        and (
            not access_context.has_app_access
            or not access_context.capabilities.can_view_strategies
        )
    )


def _to_payload(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return jsonable_encoder(value, sqlalchemy_safe=True)

    if hasattr(value, "__dict__"):
        return jsonable_encoder(
            {
                key: attribute_value
                for key, attribute_value in vars(value).items()
                if not key.startswith("_")
            },
            sqlalchemy_safe=True,
        )

    return jsonable_encoder(value, sqlalchemy_safe=True)


def _read_field(source: Any, field_name: str, default: Any = None) -> Any:
    if isinstance(source, dict):
        return source.get(field_name, default)
    return getattr(source, field_name, default)
