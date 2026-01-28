"""
Tests for statistics API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app import models


def test_get_live_game_statistics_success(client: TestClient, sample_game: models.Game, sample_player: models.Player, db_session: Session):
    """Test successful retrieval of live game statistics"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Create a completed point
    point = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc)
    )
    point.players.append(sample_player)
    db_session.add(point)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["player_id"] == sample_player.id
    assert data[0]["player_name"] == sample_player.name
    assert data[0]["player_number"] == sample_player.number
    assert data[0]["points_played"] == 1
    assert data[0]["effective_time_seconds"] == 180


def test_get_live_game_statistics_game_not_found(client: TestClient):
    """Test with non-existent game ID"""
    response = client.get("/statistics/games/99999/live")

    assert response.status_code == 404
    assert response.json()["detail"] == "Game not found"


def test_get_live_game_statistics_empty_game(client: TestClient, sample_game: models.Game, sample_player: models.Player, db_session: Session):
    """Test game with players but no completed points"""
    # Add player to game but don't create any points
    sample_game.players.append(sample_player)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["player_id"] == sample_player.id
    assert data[0]["points_played"] == 0
    assert data[0]["effective_time_seconds"] == 0


def test_get_live_game_statistics_multiple_players(client: TestClient, sample_game: models.Game, sample_team: models.Team, db_session: Session):
    """Test with multiple players having different stats"""
    # Create 3 players
    player1 = models.Player(name="Player 1", number=10, gender="M", team_id=sample_team.id)
    player2 = models.Player(name="Player 2", number=20, gender="W", team_id=sample_team.id)
    player3 = models.Player(name="Player 3", number=30, gender="M", team_id=sample_team.id)
    db_session.add_all([player1, player2, player3])
    db_session.commit()

    # Add all to game
    sample_game.players.extend([player1, player2, player3])
    db_session.commit()

    # Point 1: Players 1 and 2 (2 minutes)
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc)
    )
    point1.players.extend([player1, player2])
    db_session.add(point1)

    # Point 2: Player 1 only (3 minutes)
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 8, 0, tzinfo=timezone.utc)
    )
    point2.players.append(player1)
    db_session.add(point2)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    # Results should be sorted by player number
    assert data[0]["player_number"] == 10
    assert data[0]["points_played"] == 2
    assert data[0]["effective_time_seconds"] == 300  # 120 + 180

    assert data[1]["player_number"] == 20
    assert data[1]["points_played"] == 1
    assert data[1]["effective_time_seconds"] == 120

    assert data[2]["player_number"] == 30
    assert data[2]["points_played"] == 0
    assert data[2]["effective_time_seconds"] == 0


def test_get_live_game_statistics_with_calls(client: TestClient, sample_game: models.Game, sample_player: models.Player, db_session: Session):
    """Test that calls reduce effective time"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Create a completed point with 5 minutes duration
    point = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc)
    )
    point.players.append(sample_player)
    db_session.add(point)
    db_session.flush()

    # Add call with 1 minute dead time
    call = models.Call(
        point_id=point.id,
        call_timestamp=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
        resume_timestamp=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc),
    )
    db_session.add(call)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    # 300 seconds - 60 seconds (call) = 240 seconds
    assert data[0]["effective_time_seconds"] == 240


def test_get_live_game_statistics_ignores_non_completed_points(client: TestClient, sample_game: models.Game, sample_player: models.Player, db_session: Session):
    """Test that only completed points are included"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    base_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)

    # Create various point statuses
    point_running = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        status=models.PointStatusEnum.running,
        start_datetime=base_time,
    )
    point_running.players.append(sample_player)
    db_session.add(point_running)

    point_scored = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        status=models.PointStatusEnum.scored,
        start_datetime=base_time,
        end_datetime=base_time,
    )
    point_scored.players.append(sample_player)
    db_session.add(point_scored)

    point_completed = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=base_time,
        end_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
    )
    point_completed.players.append(sample_player)
    db_session.add(point_completed)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["points_played"] == 1  # Only completed point
    assert data[0]["effective_time_seconds"] == 120  # Only from completed point


# Tests for team statistics endpoint


def test_get_game_team_statistics_success(client: TestClient, sample_game: models.Game, db_session: Session):
    """Test successful retrieval of team statistics"""
    # Create some completed points
    # 2 offense: 1 won, 1 lost
    offense1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    offense2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        won=False,
        status=models.PointStatusEnum.completed,
    )

    # 2 defense: 1 won, 1 lost
    defense1 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    defense2 = models.Point(
        game_id=sample_game.id,
        point_number=4,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
    )

    db_session.add_all([offense1, offense2, defense1, defense2])
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/team")

    assert response.status_code == 200
    data = response.json()

    assert data["game_id"] == sample_game.id
    assert data["total_completed_points"] == 4

    # Offense
    assert data["offense"]["points_started"] == 2
    assert data["offense"]["points_won"] == 1
    assert data["offense"]["points_lost"] == 1
    assert data["offense"]["win_rate"] == 0.5

    # Defense
    assert data["defense"]["points_started"] == 2
    assert data["defense"]["points_won"] == 1
    assert data["defense"]["points_lost"] == 1
    assert data["defense"]["win_rate"] == 0.5


def test_get_game_team_statistics_game_not_found(client: TestClient):
    """Test with non-existent game ID"""
    response = client.get("/statistics/games/99999/team")

    assert response.status_code == 404
    assert response.json()["detail"] == "Game not found"


def test_get_game_team_statistics_no_completed_points(client: TestClient, sample_game: models.Game, db_session: Session):
    """Test team stats with no completed points"""
    response = client.get(f"/statistics/games/{sample_game.id}/team")

    assert response.status_code == 200
    data = response.json()

    assert data["game_id"] == sample_game.id
    assert data["total_completed_points"] == 0

    # All stats should be zero or 0.0
    assert data["offense"]["points_started"] == 0
    assert data["offense"]["win_rate"] == 0.0
    assert data["defense"]["points_started"] == 0
    assert data["defense"]["win_rate"] == 0.0


def test_get_game_team_statistics_with_turnovers(client: TestClient, sample_game: models.Game, db_session: Session):
    """Test team stats with turnovers"""
    # Offense point won without turnovers (clean)
    offense1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(offense1)
    db_session.flush()

    # Offense point won with turnovers (not clean)
    offense2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(offense2)
    db_session.flush()

    # Add turnovers to offense2
    turnover1 = models.Turnover(
        point_id=offense2.id,
        timestamp=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc),
    )
    turnover2 = models.Turnover(
        point_id=offense2.id,
        timestamp=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
    )
    db_session.add_all([turnover1, turnover2])

    # Defense point with turnover
    defense1 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(defense1)
    db_session.flush()

    turnover3 = models.Turnover(
        point_id=defense1.id,
        timestamp=datetime(2024, 1, 1, 11, 1, 0, tzinfo=timezone.utc),
    )
    db_session.add(turnover3)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/team")

    assert response.status_code == 200
    data = response.json()

    # Offense: 2 won, 1 clean (offense1)
    assert data["offense"]["points_started"] == 2
    assert data["offense"]["points_won"] == 2
    assert data["offense"]["points_won_no_turnover"] == 1
    assert data["offense"]["clean_point_rate"] == 0.5  # 1 out of 2

    # Defense: 1 started, 1 with turnover
    assert data["defense"]["points_started"] == 1
    assert data["defense"]["points_with_turnover"] == 1
    assert data["defense"]["turnover_rate"] == 1.0


def test_get_game_team_statistics_ignores_non_completed(client: TestClient, sample_game: models.Game, db_session: Session):
    """Test that only completed points are counted"""
    # Create points with different statuses
    ready = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        status=models.PointStatusEnum.ready,
    )
    running = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        status=models.PointStatusEnum.running,
    )
    scored = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=True,
        status=models.PointStatusEnum.scored,
    )
    completed = models.Point(
        game_id=sample_game.id,
        point_number=4,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )

    db_session.add_all([ready, running, scored, completed])
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/team")

    assert response.status_code == 200
    data = response.json()

    # Only 1 completed point should be counted
    assert data["total_completed_points"] == 1
    assert data["offense"]["points_started"] == 1
