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


def test_anonymous_users_can_access_public_spectator_routes_in_enforced_mode(client, db_session):
    scenario = _build_authorization_scenario(db_session)
    _configure_auth(client, AuthEnforcementMode.ENFORCED)

    competition_response = client.get(f"/competitions/{scenario['competition'].id}")
    game_response = client.get(f"/games/{scenario['game'].id}")
    points_response = client.get(f"/games/{scenario['game'].id}/points")
    point_response = client.get(f"/points/{scenario['tracked_point'].id}")
    stoppages_response = client.get(
        f"/stoppages/points/{scenario['tracked_point'].id}/stoppages"
    )
    turnovers_response = client.get(
        f"/turnovers/points/{scenario['tracked_point'].id}/turnovers"
    )
    halftime_response = client.get(f"/halftimes/games/{scenario['game'].id}/halftime")

    assert competition_response.status_code == 200
    assert game_response.status_code == 200
    assert points_response.status_code == 200
    assert point_response.status_code == 200
    assert stoppages_response.status_code == 200
    assert turnovers_response.status_code == 200
    assert halftime_response.status_code == 200


def test_anonymous_users_are_blocked_from_protected_routes_in_enforced_mode(client, db_session):
    scenario = _build_authorization_scenario(db_session)
    _configure_auth(client, AuthEnforcementMode.ENFORCED)

    teams_response = client.get("/teams")
    player_response = client.get(f"/players/{scenario['players'][0].id}")
    strategy_response = client.get("/strategies")
    competition_roster_response = client.get(
        f"/competitions/{scenario['competition'].id}/players"
    )
    create_point_response = client.post(
        "/points",
        json={
            "game_id": scenario["game"].id,
            "starting_on_offense": True,
            "player_ids": [player.id for player in scenario["players"][:7]],
        },
    )
    statistics_response = client.get(f"/statistics/games/{scenario['game'].id}/team")
    evolution_response = client.get(
        f"/statistics/teams/{scenario['team'].id}/evolution"
    )
    exports_response = client.get(f"/exports/games/{scenario['game'].id}/csv")

    assert teams_response.status_code == 401
    assert player_response.status_code == 401
    assert strategy_response.status_code == 401
    assert competition_roster_response.status_code == 401
    assert create_point_response.status_code == 401
    assert statistics_response.status_code == 401
    assert evolution_response.status_code == 401
    assert exports_response.status_code == 401


def test_authenticated_user_without_app_access_is_forbidden_from_protected_routes(client, db_session):
    scenario = _build_authorization_scenario(db_session)
    tokens_to_claims = _configure_auth(client, AuthEnforcementMode.ENFORCED)
    tokens_to_claims["no-access-token"] = VerifiedTokenClaims(
        sub="supabase-user-no-access",
        email="pending@example.com",
    )

    response = client.get(
        f"/teams/{scenario['team'].id}",
        headers=_auth_header("no-access-token"),
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "No app access configured"


def test_team_member_can_use_operational_routes_and_limited_statistics_but_not_player_stats_or_exports(
    client,
    db_session,
):
    scenario = _build_authorization_scenario(db_session)
    tokens_to_claims = _configure_auth(client, AuthEnforcementMode.ENFORCED)
    _provision_user(
        db_session,
        auth_user_id="team-member-1",
        email="member@example.com",
        role=AppRole.TEAM_MEMBER,
    )
    tokens_to_claims["team-member-token"] = VerifiedTokenClaims(
        sub="team-member-1",
        email="member@example.com",
    )
    headers = _auth_header("team-member-token")

    teams_response = client.get("/teams", headers=headers)
    competition_roster_response = client.get(
        f"/competitions/{scenario['competition'].id}/players",
        headers=headers,
    )
    create_point_response = client.post(
        "/points",
        json={
            "game_id": scenario["game"].id,
            "starting_on_offense": True,
            "player_ids": [player.id for player in scenario["players"][:7]],
        },
        headers=headers,
    )
    team_statistics_response = client.get(
        f"/statistics/games/{scenario['game'].id}/team",
        headers=headers,
    )
    strategy_statistics_response = client.get(
        f"/statistics/games/{scenario['game'].id}/strategies",
        headers=headers,
    )
    timeline_response = client.get(
        f"/statistics/games/{scenario['game'].id}/timeline",
        headers=headers,
    )
    evolution_response = client.get(
        f"/statistics/teams/{scenario['team'].id}/evolution",
        headers=headers,
    )
    player_statistics_response = client.get(
        f"/statistics/games/{scenario['game'].id}/live",
        headers=headers,
    )
    filtered_team_statistics_response = client.get(
        f"/statistics/games/{scenario['game'].id}/team",
        params={"player_ids": scenario["players"][0].id},
        headers=headers,
    )
    filtered_evolution_response = client.get(
        f"/statistics/teams/{scenario['team'].id}/evolution",
        params={"player_ids": scenario["players"][0].id},
        headers=headers,
    )
    exports_response = client.get(
        f"/exports/games/{scenario['game'].id}/csv",
        headers=headers,
    )

    assert teams_response.status_code == 200
    assert competition_roster_response.status_code == 200
    assert create_point_response.status_code == 201
    assert team_statistics_response.status_code == 200
    assert strategy_statistics_response.status_code == 200
    assert timeline_response.status_code == 200
    assert evolution_response.status_code == 200
    assert player_statistics_response.status_code == 403
    assert filtered_team_statistics_response.status_code == 403
    assert filtered_evolution_response.status_code == 403
    assert exports_response.status_code == 403
    assert player_statistics_response.json()["detail"] == "Insufficient permissions"
    assert (
        filtered_team_statistics_response.json()["detail"]
        == "Insufficient permissions"
    )
    assert (
        filtered_evolution_response.json()["detail"]
        == "Insufficient permissions"
    )


def test_team_analyst_can_access_statistics_and_exports(client, db_session):
    scenario = _build_authorization_scenario(db_session)
    tokens_to_claims = _configure_auth(client, AuthEnforcementMode.ENFORCED)
    _provision_user(
        db_session,
        auth_user_id="team-analyst-1",
        email="analyst@example.com",
        role=AppRole.TEAM_ANALYST,
    )
    tokens_to_claims["team-analyst-token"] = VerifiedTokenClaims(
        sub="team-analyst-1",
        email="analyst@example.com",
    )
    headers = _auth_header("team-analyst-token")

    statistics_response = client.get(
        f"/statistics/games/{scenario['game'].id}/team",
        headers=headers,
    )
    filtered_evolution_response = client.get(
        f"/statistics/teams/{scenario['team'].id}/evolution",
        params={"player_ids": scenario["players"][0].id},
        headers=headers,
    )
    exports_response = client.get(
        f"/exports/games/{scenario['game'].id}/csv",
        headers=headers,
    )

    assert statistics_response.status_code == 200
    assert filtered_evolution_response.status_code == 200
    assert exports_response.status_code == 200
    assert exports_response.headers["content-type"].startswith("text/csv")


def test_shadow_mode_keeps_protected_routes_accessible_while_we_roll_out(client, db_session):
    scenario = _build_authorization_scenario(db_session)
    _configure_auth(client, AuthEnforcementMode.SHADOW)

    response = client.get(f"/statistics/games/{scenario['game'].id}/team")

    assert response.status_code == 200


def _configure_auth(client, mode: AuthEnforcementMode):
    tokens_to_claims = {}
    app = client.app
    app.dependency_overrides[get_auth_settings] = lambda: AuthSettings(
        auth_enforcement_mode=mode,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="https://example.supabase.co/auth/v1/.well-known/jwks.json",
    )
    app.dependency_overrides[get_token_verifier] = lambda: FakeTokenVerifier(tokens_to_claims)
    return tokens_to_claims


def _provision_user(db_session, *, auth_user_id: str, email: str, role: AppRole):
    crud.create_user(
        db_session,
        schemas.UserCreate(
            auth_user_id=auth_user_id,
            email=email,
            role=role,
        ),
    )


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _build_authorization_scenario(db_session):
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
        with_turnover=True,
        with_call=True,
    )
    scenario = builder.build()

    crud.update_game(
        db_session,
        scenario.game.id,
        schemas.GameUpdate(status=schemas.GameStatus.started),
    )
    halftime = crud.create_halftime(
        db_session,
        schemas.HalftimeCreate(
            game_id=scenario.game.id,
            halftime_timestamp=datetime(2026, 4, 6, 14, 30, tzinfo=timezone.utc),
            comments="Locker-room notes",
        ),
    )

    return {
        "team": scenario.team,
        "competition": scenario.competition,
        "game": scenario.game,
        "players": scenario.players,
        "tracked_point": scenario.points[0],
        "halftime": halftime,
    }
