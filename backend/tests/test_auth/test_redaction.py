from datetime import datetime, timezone

from app import crud, schemas
from app.auth.context import build_access_context
from app.auth.permissions import AppRole
from app.auth.redaction import (
    serialize_game_detail,
    serialize_halftime,
    serialize_point,
    serialize_stoppage,
    serialize_turnover,
)
from app.auth.types import AuthEnforcementMode
from tests.builders import GameScenarioBuilder


def test_public_redaction_strips_sensitive_fields_from_spectator_payloads(db_session):
    scenario = _build_redaction_scenario(db_session)
    access_context = build_access_context(
        AppRole.PUBLIC,
        enforcement_mode=AuthEnforcementMode.SHADOW,
    )

    game_detail_payload = serialize_game_detail(
        crud.get_game_detail(db_session, scenario["game"].id),
        access_context,
    )
    point_payload = serialize_point(
        crud.get_point(db_session, scenario["running_point"].id),
        access_context,
    )
    stoppage_payload = serialize_stoppage(
        crud.get_stoppage(db_session, scenario["stoppage"].id),
        access_context,
    )
    turnover_payload = serialize_turnover(
        crud.get_turnover(db_session, scenario["turnover"].id),
        access_context,
    )
    halftime_payload = serialize_halftime(
        crud.get_halftime(db_session, scenario["halftime"].id),
        access_context,
    )

    assert game_detail_payload["comments"] is None
    assert all(point["comments"] is None for point in game_detail_payload["points"])
    assert all(point["strategy"] is None for point in game_detail_payload["points"])
    assert all(point["strategy_id"] is None for point in game_detail_payload["points"])
    assert game_detail_payload["halftime"]["comments"] is None
    assert point_payload["comments"] is None
    assert point_payload["strategy"] is None
    assert point_payload["strategy_id"] is None
    assert stoppage_payload["comments"] is None
    assert turnover_payload["comments"] is None
    assert halftime_payload["comments"] is None
    assert game_detail_payload["points"][0]["point_number"] == scenario["running_point"].point_number
    assert stoppage_payload["stoppage_type"] == "timeout"
    assert turnover_payload["player_id"] == scenario["players"][0].id


def test_full_access_serializers_preserve_comments_and_strategy(db_session):
    scenario = _build_redaction_scenario(db_session)
    access_context = build_access_context(
        AppRole.TEAM_MEMBER,
        enforcement_mode=AuthEnforcementMode.SHADOW,
    )

    game_detail_payload = serialize_game_detail(
        crud.get_game_detail(db_session, scenario["game"].id),
        access_context,
    )
    point_payload = serialize_point(
        crud.get_point(db_session, scenario["running_point"].id),
        access_context,
    )
    stoppage_payload = serialize_stoppage(
        crud.get_stoppage(db_session, scenario["stoppage"].id),
        access_context,
    )
    turnover_payload = serialize_turnover(
        crud.get_turnover(db_session, scenario["turnover"].id),
        access_context,
    )
    halftime_payload = serialize_halftime(
        crud.get_halftime(db_session, scenario["halftime"].id),
        access_context,
    )

    assert game_detail_payload["comments"] == "Internal game notes"
    assert game_detail_payload["points"][0]["comments"] == "Live adjustments"
    assert game_detail_payload["points"][0]["strategy_id"] == scenario["strategy"].id
    assert game_detail_payload["points"][0]["strategy"]["name"] == scenario["strategy"].name
    assert game_detail_payload["halftime"]["comments"] == "Discuss matchups"
    assert point_payload["comments"] == "Live adjustments"
    assert point_payload["strategy_id"] == scenario["strategy"].id
    assert stoppage_payload["comments"] == "Timeout details"
    assert turnover_payload["comments"] == "Throwaway"
    assert halftime_payload["comments"] == "Discuss matchups"


def _build_redaction_scenario(db_session):
    builder = (
        GameScenarioBuilder(db_session)
        .with_team("Monkey")
        .with_competition("Tour Finals")
        .with_game("Rivals")
        .with_players(7)
        .with_offense_strategy("Vertical Stack")
    )
    strategy = builder.offense_strategies[0]
    builder.with_completed_point(
        offense=True,
        won=True,
        strategy=strategy,
        field_side="home",
    )
    scenario = builder.build()

    player_ids = [player.id for player in scenario.players[:7]]
    crud.update_game(
        db_session,
        scenario.game.id,
        schemas.GameUpdate(
            status=schemas.GameStatus.started,
            comments="Internal game notes",
        ),
    )
    crud.update_point(
        db_session,
        scenario.points[0].id,
        schemas.PointUpdate(
            comments="Opening point notes",
            strategy_id=strategy.id,
        ),
    )

    running_point = crud.create_point(
        db_session,
        schemas.PointCreate(
            game_id=scenario.game.id,
            starting_on_offense=False,
            player_ids=player_ids,
            strategy_id=strategy.id,
            comments="Live adjustments",
        ),
    )
    running_point = crud.update_point(
        db_session,
        running_point.id,
        schemas.PointUpdate(
            status="running",
            player_ids=player_ids,
            strategy_id=strategy.id,
            comments="Live adjustments",
        ),
    )

    stoppage = crud.create_stoppage(
        db_session,
        schemas.StoppageCreate(
            point_id=running_point.id,
            stoppage_type=schemas.StoppageType.timeout,
            call_timestamp=datetime(2026, 4, 6, 15, 0, tzinfo=timezone.utc),
            comments="Timeout details",
        ),
    )
    turnover = crud.create_turnover(
        db_session,
        schemas.TurnoverCreate(
            point_id=running_point.id,
            player_id=scenario.players[0].id,
            timestamp=datetime(2026, 4, 6, 15, 1, tzinfo=timezone.utc),
            comments="Throwaway",
        ),
    )
    halftime = crud.create_halftime(
        db_session,
        schemas.HalftimeCreate(
            game_id=scenario.game.id,
            halftime_timestamp=datetime(2026, 4, 6, 14, 30, tzinfo=timezone.utc),
            comments="Discuss matchups",
        ),
    )

    return {
        "game": scenario.game,
        "players": scenario.players,
        "strategy": strategy,
        "running_point": running_point,
        "stoppage": stoppage,
        "turnover": turnover,
        "halftime": halftime,
    }
