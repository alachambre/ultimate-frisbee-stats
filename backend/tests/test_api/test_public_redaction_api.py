from datetime import datetime, timezone

from app import crud, schemas
from app.auth.permissions import AppRole
from app.auth.settings import AuthSettings, get_auth_settings
from app.auth.types import AuthEnforcementMode, VerifiedTokenClaims
from app.auth.verification import get_token_verifier
from tests.builders import GameScenarioBuilder


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


def test_public_game_reads_redact_comments_and_strategy(client, db_session):
    scenario = _build_redaction_scenario(db_session)
    _configure_shadow_auth(client)

    game_response = client.get(f"/games/{scenario['game'].id}")
    live_state_response = client.get(f"/games/{scenario['game'].id}/live-state")
    points_response = client.get(f"/games/{scenario['game'].id}/points")
    running_point_response = client.get(f"/points/games/{scenario['game'].id}/running")
    point_response = client.get(f"/points/{scenario['running_point'].id}")

    assert game_response.status_code == 200
    game_data = game_response.json()
    completed_point = next(point for point in game_data["points"] if point["status"] == "completed")
    running_point = next(point for point in game_data["points"] if point["status"] == "running")
    assert game_data["comments"] is None
    assert all(point["comments"] is None for point in game_data["points"])
    assert all(point["strategy"] is None for point in game_data["points"])
    assert all(point["strategy_id"] is None for point in game_data["points"])
    assert completed_point["our_turnovers"] == 1
    assert completed_point["opponent_turnovers"] == 0
    assert running_point["our_turnovers"] == 0
    assert running_point["opponent_turnovers"] == 1
    assert game_data["halftime"]["comments"] is None

    assert live_state_response.status_code == 200
    live_state = live_state_response.json()
    assert live_state["active_point"]["comments"] is None
    assert live_state["active_point"]["strategy"] is None
    assert live_state["active_point"]["strategy_id"] is None
    assert live_state["active_point"]["our_turnovers"] == 0
    assert live_state["active_point"]["opponent_turnovers"] == 1
    assert live_state["active_point_stoppages"][0]["comments"] is None
    assert live_state["active_point_turnovers"][0]["comments"] is None

    assert points_response.status_code == 200
    points_data = points_response.json()
    assert all(point["comments"] is None for point in points_data)
    assert all(point["strategy"] is None for point in points_data)
    assert all(point["strategy_id"] is None for point in points_data)

    assert running_point_response.status_code == 200
    assert running_point_response.json()["comments"] is None
    assert running_point_response.json()["strategy"] is None
    assert running_point_response.json()["our_turnovers"] == 0
    assert running_point_response.json()["opponent_turnovers"] == 1

    assert point_response.status_code == 200
    assert point_response.json()["comments"] is None
    assert point_response.json()["strategy"] is None
    assert point_response.json()["our_turnovers"] == 0
    assert point_response.json()["opponent_turnovers"] == 1


def test_public_event_reads_redact_comments(client, db_session):
    scenario = _build_redaction_scenario(db_session)
    _configure_shadow_auth(client)

    stoppage_response = client.get(f"/stoppages/{scenario['stoppage'].id}")
    stoppages_response = client.get(
        f"/stoppages/points/{scenario['running_point'].id}/stoppages"
    )
    turnover_response = client.get(f"/turnovers/{scenario['turnover'].id}")
    turnovers_response = client.get(
        f"/turnovers/points/{scenario['running_point'].id}/turnovers"
    )
    game_turnovers_response = client.get(
        f"/games/{scenario['game'].id}/turnovers"
    )
    halftime_response = client.get(f"/halftimes/games/{scenario['game'].id}/halftime")

    assert stoppage_response.status_code == 200
    assert stoppage_response.json()["comments"] is None
    assert stoppage_response.json()["stoppage_type"] == "timeout"

    assert stoppages_response.status_code == 200
    assert stoppages_response.json()[0]["comments"] is None

    assert turnover_response.status_code == 200
    assert turnover_response.json()["comments"] is None
    assert turnover_response.json()["player_id"] == scenario["players"][0].id
    assert turnover_response.json()["turnover_type"] == "defended_pass"

    assert turnovers_response.status_code == 200
    assert turnovers_response.json()[0]["comments"] is None
    assert turnovers_response.json()[0]["turnover_type"] == "defended_pass"

    assert game_turnovers_response.status_code == 200
    game_turnover = next(
        turnover
        for turnover in game_turnovers_response.json()
        if turnover["id"] == scenario["turnover"].id
    )
    assert game_turnover["comments"] is None
    assert game_turnover["turnover_type"] == "defended_pass"

    assert halftime_response.status_code == 200
    assert halftime_response.json()["comments"] is None


def test_public_game_lists_redact_game_comments(client, db_session):
    scenario = _build_redaction_scenario(db_session)
    _configure_shadow_auth(client)

    games_response = client.get("/games")
    competition_games_response = client.get(
        f"/competitions/{scenario['competition'].id}/games"
    )

    assert games_response.status_code == 200
    games_data = games_response.json()
    assert len(games_data) == 1
    assert games_data[0]["comments"] is None

    assert competition_games_response.status_code == 200
    competition_games_data = competition_games_response.json()
    assert len(competition_games_data) == 1
    assert competition_games_data[0]["comments"] is None


def test_team_member_public_reads_keep_full_payloads(client, db_session):
    scenario = _build_redaction_scenario(db_session)
    tokens_to_claims = _configure_shadow_auth(client)
    crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id="team-member-1",
            email="member@example.com",
            role=AppRole.TEAM_MEMBER,
        ),
    )
    tokens_to_claims["team-member-token"] = VerifiedTokenClaims(
        sub="team-member-1",
        email="member@example.com",
    )
    headers = {"Authorization": "Bearer team-member-token"}

    game_response = client.get(f"/games/{scenario['game'].id}", headers=headers)
    stoppage_response = client.get(f"/stoppages/{scenario['stoppage'].id}", headers=headers)
    turnover_response = client.get(f"/turnovers/{scenario['turnover'].id}", headers=headers)
    game_turnovers_response = client.get(
        f"/games/{scenario['game'].id}/turnovers",
        headers=headers,
    )
    halftime_response = client.get(
        f"/halftimes/games/{scenario['game'].id}/halftime",
        headers=headers,
    )

    assert game_response.status_code == 200
    game_data = game_response.json()
    assert game_data["comments"] == "Internal game notes"
    assert game_data["points"][0]["comments"] == "Live adjustments"
    assert game_data["points"][0]["strategy_id"] == scenario["strategy"].id
    assert game_data["points"][0]["strategy"]["name"] == scenario["strategy"].name
    assert game_data["halftime"]["comments"] == "Discuss matchups"

    assert stoppage_response.status_code == 200
    assert stoppage_response.json()["comments"] == "Timeout details"

    assert turnover_response.status_code == 200
    assert turnover_response.json()["comments"] == "Throwaway"

    assert game_turnovers_response.status_code == 200
    game_turnover = next(
        turnover
        for turnover in game_turnovers_response.json()
        if turnover["id"] == scenario["turnover"].id
    )
    assert game_turnover["comments"] == "Throwaway"

    assert halftime_response.status_code == 200
    assert halftime_response.json()["comments"] == "Discuss matchups"


def test_authenticated_without_app_access_still_gets_redacted_payloads(client, db_session):
    scenario = _build_redaction_scenario(db_session)
    tokens_to_claims = _configure_shadow_auth(client)
    tokens_to_claims["unprovisioned-token"] = VerifiedTokenClaims(
        sub="unprovisioned-user-1",
        email="spectator@example.com",
    )
    headers = {"Authorization": "Bearer unprovisioned-token"}

    game_response = client.get(f"/games/{scenario['game'].id}", headers=headers)
    stoppage_response = client.get(
        f"/stoppages/{scenario['stoppage'].id}",
        headers=headers,
    )
    turnover_response = client.get(
        f"/turnovers/{scenario['turnover'].id}",
        headers=headers,
    )
    halftime_response = client.get(
        f"/halftimes/games/{scenario['game'].id}/halftime",
        headers=headers,
    )

    assert game_response.status_code == 200
    game_data = game_response.json()
    assert game_data["comments"] is None
    assert game_data["points"][0]["comments"] is None
    assert game_data["points"][0]["strategy_id"] is None
    assert game_data["points"][0]["strategy"] is None

    assert stoppage_response.status_code == 200
    assert stoppage_response.json()["comments"] is None

    assert turnover_response.status_code == 200
    assert turnover_response.json()["comments"] is None

    assert halftime_response.status_code == 200
    assert halftime_response.json()["comments"] is None


def _configure_shadow_auth(client):
    tokens_to_claims = {}
    app = client.app
    app.dependency_overrides[get_auth_settings] = lambda: AuthSettings(
        auth_enforcement_mode=AuthEnforcementMode.SHADOW,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="https://example.supabase.co/auth/v1/.well-known/jwks.json",
    )
    app.dependency_overrides[get_token_verifier] = lambda: FakeTokenVerifier(tokens_to_claims)
    return tokens_to_claims


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
        with_turnover=True,
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
            turnover_type=schemas.TurnoverType.defended_pass,
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
        "competition": scenario.competition,
        "game": scenario.game,
        "players": scenario.players,
        "strategy": strategy,
        "running_point": running_point,
        "stoppage": stoppage,
        "turnover": turnover,
        "halftime": halftime,
    }
