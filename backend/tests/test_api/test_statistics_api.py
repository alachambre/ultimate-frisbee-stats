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
