"""
Tests for CSV export API endpoints.
"""
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import models
from tests.builders import (
    CompetitionBuilder,
    GameBuilder,
    GameScenarioBuilder,
    PointBuilder,
)


def test_export_game_statistics_csv_success(client: TestClient, db_session: Session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .with_offense_strategy("Vertical Stack")
    )
    vertical = scenario.offense_strategies[0]
    scenario.with_completed_point(
        offense=True,
        won=True,
        strategy=vertical,
        with_turnover=True,
        with_call=False,
    ).build()
    point = scenario.points[0]
    start_time = point.start_datetime
    stoppage = models.Stoppage(
        point_id=point.id,
        call_timestamp=start_time + timedelta(seconds=10),
        resume_timestamp=start_time + timedelta(seconds=20),
    )
    db_session.add(stoppage)
    db_session.commit()

    response = client.get(f"/exports/games/{scenario.game.id}/csv")

    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert f'game-{scenario.game.id}-statistics.csv' in response.headers["content-disposition"]

    content = response.text
    assert "GAME INFORMATION" in content
    assert "TEAM STATISTICS" in content
    assert "PLAYER STATISTICS" in content
    assert "STRATEGY STATISTICS" in content
    assert "POINTS SUMMARY" in content
    assert "Point,Type,Status,Result,Score After" in content
    assert "Stoppages,Turnovers,Comments" in content
    assert "Vertical Stack" in content
    assert "POINTS DETAIL" not in content
    assert "Stoppage 1" not in content
    assert "Turnover 1" not in content


def test_export_game_statistics_csv_full_detail(client: TestClient, db_session: Session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .with_offense_strategy("Vertical Stack")
    )
    vertical = scenario.offense_strategies[0]
    scenario.with_completed_point(
        offense=True,
        won=True,
        strategy=vertical,
        with_turnover=True,
        with_call=False,
    ).build()
    point = scenario.points[0]
    start_time = point.start_datetime
    stoppage = models.Stoppage(
        point_id=point.id,
        call_timestamp=start_time + timedelta(seconds=10),
        resume_timestamp=start_time + timedelta(seconds=20),
    )
    db_session.add(stoppage)
    db_session.commit()

    response = client.get(f"/exports/games/{scenario.game.id}/csv?detail=full")

    assert response.status_code == 200
    content = response.text
    assert "POINTS SUMMARY" in content
    assert "POINTS DETAIL" in content
    assert "Point 1" in content
    assert "Stoppages,1" in content
    assert "Turnovers,1" in content


def test_export_game_statistics_csv_not_found(client: TestClient):
    response = client.get("/exports/games/99999/csv")

    assert response.status_code == 404
    assert response.json()["detail"] == "Game not found"


def test_export_competition_statistics_csv_success(client: TestClient, db_session: Session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Spring Cup")
        .with_game("Opponent 1")
        .with_players(7)
        .with_offense_strategy("Vertical Stack")
        .with_defense_strategy("Zone")
    )
    vertical = scenario.offense_strategies[0]
    zone = scenario.defense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vertical).with_completed_point(
        offense=False,
        won=True,
        strategy=zone,
    ).build()

    player_ids = [player.id for player in scenario.players]
    game_2 = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, game_2.id, player_ids).offense().won().complete()

    response = client.get(f"/exports/competitions/{scenario.competition.id}/csv")

    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert f'competition-{scenario.competition.id}-statistics.csv' in response.headers["content-disposition"]

    content = response.text
    assert "COMPETITION INFORMATION" in content
    assert "Spring Cup" in content
    assert "GAMES OVERVIEW" in content
    assert "Opponent 1" in content
    assert "Opponent 2" in content
    assert "TEAM STATISTICS" in content
    assert "PLAYER STATISTICS" in content
    assert "STRATEGY STATISTICS" in content
    assert "POINTS SUMMARY" in content
    assert "Game Date,Opponent,Point,Type,Status,Result,Score After" in content
    assert "POINTS DETAIL" not in content


def test_export_competition_statistics_csv_full_detail(client: TestClient, db_session: Session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Spring Cup")
        .with_game("Opponent 1")
        .with_players(7)
        .with_offense_strategy("Vertical Stack")
    )
    vertical = scenario.offense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vertical).build()

    response = client.get(f"/exports/competitions/{scenario.competition.id}/csv?detail=full")

    assert response.status_code == 200
    content = response.text
    assert "POINTS SUMMARY" in content
    assert "POINTS DETAIL" in content
    assert "vs Opponent 1" in content


def test_export_competition_statistics_csv_not_found(client: TestClient):
    response = client.get("/exports/competitions/99999/csv")

    assert response.status_code == 404
    assert response.json()["detail"] == "Competition not found"


def test_export_team_statistics_csv_success(client: TestClient, db_session: Session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .with_offense_strategy("Vertical Stack")
        .with_defense_strategy("Zone")
    )
    vertical = scenario.offense_strategies[0]
    zone = scenario.defense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vertical).with_completed_point(
        offense=False,
        won=True,
        strategy=zone,
    ).build()

    player_ids = [player.id for player in scenario.players]
    comp_b = CompetitionBuilder(db_session, scenario.team).with_name("Comp B").build()
    game_2 = GameBuilder(db_session, comp_b).with_opponent("Opponent 2").build()
    PointBuilder(db_session, game_2.id, player_ids).offense().lost().complete()

    response = client.get(f"/exports/teams/{scenario.team.id}/csv")

    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert f'team-{scenario.team.id}-statistics.csv' in response.headers["content-disposition"]

    content = response.text
    assert "TEAM INFORMATION" in content
    assert "Team A" in content
    assert "COMPETITIONS OVERVIEW" in content
    assert "Comp A" in content
    assert "Comp B" in content
    assert "GAMES OVERVIEW" in content
    assert "TEAM STATISTICS" in content
    assert "PLAYER STATISTICS" in content
    assert "STRATEGY STATISTICS" in content
    assert "POINTS SUMMARY" in content
    assert "Game Date,Opponent,Point,Type,Status,Result,Score After" in content
    assert "POINTS DETAIL" not in content


def test_export_team_statistics_csv_not_found(client: TestClient):
    response = client.get("/exports/teams/99999/csv")

    assert response.status_code == 404
    assert response.json()["detail"] == "Team not found"


def test_export_statistics_csv_invalid_detail_param(client: TestClient, db_session: Session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
    )
    scenario.with_completed_point(offense=True, won=True).build()

    response = client.get(f"/exports/games/{scenario.game.id}/csv?detail=invalid")

    assert response.status_code == 422
