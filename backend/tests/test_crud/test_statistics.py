"""
Tests for statistics CRUD operations
"""
import pytest
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from app.crud import statistics as crud
from app import models


def test_get_live_game_player_stats_no_completed_points(db_session: Session, sample_game: models.Game, sample_player: models.Player):
    """Test stats when no points are completed yet"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 1
    assert stats[0]["player_id"] == sample_player.id
    assert stats[0]["player_name"] == sample_player.name
    assert stats[0]["player_number"] == sample_player.number
    assert stats[0]["points_played"] == 0
    assert stats[0]["effective_time_seconds"] == 0


def test_get_live_game_player_stats_one_completed_point(db_session: Session, sample_game: models.Game, sample_player: models.Player):
    """Test stats with one completed point"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Create a completed point with the player
    start_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
    end_time = datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc)  # 3 minutes (180 seconds)

    point = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=start_time,
        end_datetime=end_time
    )
    point.players.append(sample_player)
    db_session.add(point)
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 1
    assert stats[0]["player_id"] == sample_player.id
    assert stats[0]["points_played"] == 1
    assert stats[0]["effective_time_seconds"] == 180  # 3 minutes


def test_get_live_game_player_stats_with_calls(db_session: Session, sample_game: models.Game, sample_player: models.Player):
    """Test that call durations are subtracted from effective time"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Create a completed point with the player
    start_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
    end_time = datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc)  # 5 minutes (300 seconds)

    point = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=start_time,
        end_datetime=end_time
    )
    point.players.append(sample_player)
    db_session.add(point)
    db_session.flush()

    # Add two calls with dead time
    call1 = models.Call(
        point_id=point.id,
        call_timestamp=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc),
        resume_timestamp=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),  # 1 minute dead time
    )
    call2 = models.Call(
        point_id=point.id,
        call_timestamp=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc),
        resume_timestamp=datetime(2024, 1, 1, 10, 3, 30, tzinfo=timezone.utc),  # 30 seconds dead time
    )
    db_session.add(call1)
    db_session.add(call2)
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 1
    assert stats[0]["points_played"] == 1
    # 300 seconds - 60 seconds (call1) - 30 seconds (call2) = 210 seconds
    assert stats[0]["effective_time_seconds"] == 210


def test_get_live_game_player_stats_pending_call_not_subtracted(db_session: Session, sample_game: models.Game, sample_player: models.Player):
    """Test that pending calls (no resume timestamp) are not subtracted"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Create a completed point
    start_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
    end_time = datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc)  # 5 minutes

    point = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=start_time,
        end_datetime=end_time
    )
    point.players.append(sample_player)
    db_session.add(point)
    db_session.flush()

    # Add a pending call (no resume timestamp)
    call = models.Call(
        point_id=point.id,
        call_timestamp=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc),
        resume_timestamp=None,  # Pending call
    )
    db_session.add(call)
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 1
    assert stats[0]["effective_time_seconds"] == 300  # Full duration, pending call not subtracted


def test_get_live_game_player_stats_multiple_players(db_session: Session, sample_game: models.Game, sample_team: models.Team):
    """Test stats with multiple players having different playing times"""
    # Create 3 players
    player1 = models.Player(name="Player 1", number=1, gender="M", team_id=sample_team.id)
    player2 = models.Player(name="Player 2", number=2, gender="W", team_id=sample_team.id)
    player3 = models.Player(name="Player 3", number=3, gender="M", team_id=sample_team.id)
    db_session.add_all([player1, player2, player3])
    db_session.commit()

    # Add all to game
    sample_game.players.extend([player1, player2, player3])
    db_session.commit()

    # Point 1: Players 1 and 2 play (2 minutes)
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

    # Point 2: Players 1 and 3 play (3 minutes)
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 8, 0, tzinfo=timezone.utc)
    )
    point2.players.extend([player1, player3])
    db_session.add(point2)
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    # Should be sorted by player number
    assert len(stats) == 3

    # Player 1: 2 points, 5 minutes total
    assert stats[0]["player_id"] == player1.id
    assert stats[0]["points_played"] == 2
    assert stats[0]["effective_time_seconds"] == 300  # 120 + 180

    # Player 2: 1 point, 2 minutes
    assert stats[1]["player_id"] == player2.id
    assert stats[1]["points_played"] == 1
    assert stats[1]["effective_time_seconds"] == 120

    # Player 3: 1 point, 3 minutes
    assert stats[2]["player_id"] == player3.id
    assert stats[2]["points_played"] == 1
    assert stats[2]["effective_time_seconds"] == 180


def test_get_live_game_player_stats_ignores_non_completed_points(db_session: Session, sample_game: models.Game, sample_player: models.Player):
    """Test that only completed points are counted"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Create points with different statuses
    base_time = datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)

    # Ready point - should not count
    point_ready = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        status=models.PointStatusEnum.ready,
    )
    point_ready.players.append(sample_player)
    db_session.add(point_ready)

    # Running point - should not count
    point_running = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        status=models.PointStatusEnum.running,
        start_datetime=base_time,
    )
    point_running.players.append(sample_player)
    db_session.add(point_running)

    # Scored point - should not count
    point_scored = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=True,
        status=models.PointStatusEnum.scored,
        start_datetime=base_time,
        end_datetime=base_time + timedelta(minutes=2),
    )
    point_scored.players.append(sample_player)
    db_session.add(point_scored)

    # Completed point - SHOULD count
    point_completed = models.Point(
        game_id=sample_game.id,
        point_number=4,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=base_time,
        end_datetime=base_time + timedelta(minutes=3),
    )
    point_completed.players.append(sample_player)
    db_session.add(point_completed)
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 1
    assert stats[0]["points_played"] == 1  # Only the completed point
    assert stats[0]["effective_time_seconds"] == 180  # Only 3 minutes from completed point


def test_get_live_game_player_stats_game_not_found(db_session: Session):
    """Test with non-existent game ID"""
    stats = crud.get_live_game_player_stats(db_session, 99999)
    assert stats == []


def test_get_live_game_player_stats_sorted_by_number(db_session: Session, sample_game: models.Game, sample_team: models.Team):
    """Test that results are sorted by player number"""
    # Create players with non-sequential numbers
    player_high = models.Player(name="Player High", number=99, gender="M", team_id=sample_team.id)
    player_low = models.Player(name="Player Low", number=1, gender="W", team_id=sample_team.id)
    player_mid = models.Player(name="Player Mid", number=50, gender="M", team_id=sample_team.id)
    db_session.add_all([player_high, player_low, player_mid])
    db_session.commit()

    # Add all to game
    sample_game.players.extend([player_high, player_low, player_mid])
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 3
    assert stats[0]["player_number"] == 1  # player_low
    assert stats[1]["player_number"] == 50  # player_mid
    assert stats[2]["player_number"] == 99  # player_high
