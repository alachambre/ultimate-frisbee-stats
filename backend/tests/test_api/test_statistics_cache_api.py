from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.statistics_cache import get_statistics_cache_size
from tests.builders import GameScenarioBuilder, PointBuilder


def test_team_statistics_cache_is_invalidated_when_point_finishes(
    client: TestClient,
    db_session: Session,
    monkeypatch,
):
    monkeypatch.setenv("STATISTICS_CACHE_TTL_SECONDS", "300")
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won().complete()

    first_response = client.get(f"/statistics/teams/{scenario.team.id}/team")
    assert first_response.status_code == 200
    assert first_response.json()["total_completed_points"] == 1
    assert get_statistics_cache_size() == 1

    create_response = client.post(
        "/points",
        json={
            "game_id": scenario.game.id,
            "starting_on_offense": False,
            "player_ids": player_ids,
        },
    )
    assert create_response.status_code == 201
    point_id = create_response.json()["id"]

    update_response = client.put(f"/points/{point_id}", json={"status": "running"})
    assert update_response.status_code == 200

    finish_response = client.post(f"/points/{point_id}/finish", json={"won": False})
    assert finish_response.status_code == 200

    second_response = client.get(f"/statistics/teams/{scenario.team.id}/team")
    assert second_response.status_code == 200
    assert second_response.json()["total_completed_points"] == 2
