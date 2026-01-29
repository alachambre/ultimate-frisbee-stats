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


def test_get_live_game_player_stats_offense_defense_breakdown(db_session: Session, sample_game: models.Game, sample_team: models.Team):
    """Test offense/defense statistics breakdown"""
    # Create 2 players
    player1 = models.Player(name="Player 1", number=1, gender="M", team_id=sample_team.id)
    player2 = models.Player(name="Player 2", number=2, gender="W", team_id=sample_team.id)
    db_session.add_all([player1, player2])
    db_session.commit()

    # Add to game
    sample_game.players.extend([player1, player2])
    db_session.commit()

    # Point 1: Offense won with player1
    offense_won = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc)
    )
    offense_won.players.append(player1)
    db_session.add(offense_won)

    # Point 2: Offense lost with player1
    offense_lost = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 7, 0, tzinfo=timezone.utc)
    )
    offense_lost.players.append(player1)
    db_session.add(offense_lost)

    # Point 3: Defense won with player2
    defense_won = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 10, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 13, 0, tzinfo=timezone.utc)
    )
    defense_won.players.append(player2)
    db_session.add(defense_won)

    # Point 4: Defense lost with player2
    defense_lost = models.Point(
        game_id=sample_game.id,
        point_number=4,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 15, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 17, 0, tzinfo=timezone.utc)
    )
    defense_lost.players.append(player2)
    db_session.add(defense_lost)

    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    # Player 1: 2 offense points (1 won, 1 lost)
    player1_stats = next(s for s in stats if s["player_id"] == player1.id)
    assert player1_stats["points_played"] == 2
    assert player1_stats["offense"]["points_played"] == 2
    assert player1_stats["offense"]["points_won"] == 1
    assert player1_stats["offense"]["points_lost"] == 1
    assert player1_stats["offense"]["win_rate"] == 0.5
    assert player1_stats["defense"]["points_played"] == 0
    assert player1_stats["defense"]["win_rate"] == 0.0

    # Player 2: 2 defense points (1 won, 1 lost)
    player2_stats = next(s for s in stats if s["player_id"] == player2.id)
    assert player2_stats["points_played"] == 2
    assert player2_stats["defense"]["points_played"] == 2
    assert player2_stats["defense"]["points_won"] == 1
    assert player2_stats["defense"]["points_lost"] == 1
    assert player2_stats["defense"]["win_rate"] == 0.5
    assert player2_stats["offense"]["points_played"] == 0
    assert player2_stats["offense"]["win_rate"] == 0.0


def test_get_live_game_player_stats_offense_clean_points(db_session: Session, sample_game: models.Game, sample_player: models.Player):
    """Test offense clean point tracking (won without turnovers)"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Point 1: Offense won with no turnovers (clean)
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc)
    )
    point1.players.append(sample_player)
    db_session.add(point1)

    # Point 2: Offense won with turnovers (not clean)
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 7, 0, tzinfo=timezone.utc)
    )
    point2.players.append(sample_player)
    db_session.add(point2)
    db_session.flush()

    # Add turnovers to point 2
    turnover1 = models.Turnover(
        point_id=point2.id,
        timestamp=datetime(2024, 1, 1, 10, 6, 0, tzinfo=timezone.utc)
    )
    db_session.add(turnover1)

    # Point 3: Offense won with no turnovers (clean)
    point3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 10, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 12, 0, tzinfo=timezone.utc)
    )
    point3.players.append(sample_player)
    db_session.add(point3)
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 1
    player_stats = stats[0]

    # 3 offense points, all won
    assert player_stats["offense"]["points_played"] == 3
    assert player_stats["offense"]["points_won"] == 3
    assert player_stats["offense"]["points_lost"] == 0
    assert player_stats["offense"]["win_rate"] == 1.0

    # 2 clean points (point 1 and 3)
    assert player_stats["offense"]["points_won_no_turnover"] == 2
    # Clean point rate: 2 out of 3 won points = 0.667
    assert abs(player_stats["offense"]["clean_point_rate"] - 0.667) < 0.01


def test_get_live_game_player_stats_defense_turnover_tracking(db_session: Session, sample_game: models.Game, sample_player: models.Player):
    """Test defense turnover tracking (forced Ds)"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Point 1: Defense won with turnover (we forced a D and scored)
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc)
    )
    point1.players.append(sample_player)
    db_session.add(point1)
    db_session.flush()

    # Add turnover (we forced a D)
    turnover1 = models.Turnover(
        point_id=point1.id,
        timestamp=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc)
    )
    db_session.add(turnover1)

    # Point 2: Defense won with multiple turnovers (we forced a D but turned it back)
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 8, 0, tzinfo=timezone.utc)
    )
    point2.players.append(sample_player)
    db_session.add(point2)
    db_session.flush()

    # Add 2 turnovers (we forced a D, turned it back)
    turnover2_1 = models.Turnover(
        point_id=point2.id,
        timestamp=datetime(2024, 1, 1, 10, 6, 0, tzinfo=timezone.utc)
    )
    turnover2_2 = models.Turnover(
        point_id=point2.id,
        timestamp=datetime(2024, 1, 1, 10, 7, 0, tzinfo=timezone.utc)
    )
    db_session.add_all([turnover2_1, turnover2_2])

    # Point 3: Defense lost without turnover (opponent scored cleanly)
    point3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 10, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 12, 0, tzinfo=timezone.utc)
    )
    point3.players.append(sample_player)
    db_session.add(point3)
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 1
    player_stats = stats[0]

    # 3 defense points
    assert player_stats["defense"]["points_played"] == 3
    assert player_stats["defense"]["points_won"] == 2
    assert player_stats["defense"]["points_lost"] == 1
    assert abs(player_stats["defense"]["win_rate"] - 0.667) < 0.01

    # 2 points with turnovers (we forced Ds on point 1 and 2)
    assert player_stats["defense"]["points_with_turnover"] == 2
    # Turnover rate: 2 out of 3 defense points = 0.667
    assert abs(player_stats["defense"]["turnover_rate"] - 0.667) < 0.01

    # 1 point lost without turnover (point 3)
    assert player_stats["defense"]["points_lost_no_turnover"] == 1


def test_get_live_game_player_stats_defense_lost_no_turnover(db_session: Session, sample_game: models.Game, sample_player: models.Player):
    """Test tracking when opponent scores cleanly (no Ds forced)"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Point 1: Defense lost without turnover (opponent marched it down)
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc)
    )
    point1.players.append(sample_player)
    db_session.add(point1)

    # Point 2: Defense lost with turnover (we forced a D but turned it back)
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 7, 0, tzinfo=timezone.utc)
    )
    point2.players.append(sample_player)
    db_session.add(point2)
    db_session.flush()

    # Add turnover to point 2
    turnover = models.Turnover(
        point_id=point2.id,
        timestamp=datetime(2024, 1, 1, 10, 6, 0, tzinfo=timezone.utc)
    )
    db_session.add(turnover)
    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 1
    player_stats = stats[0]

    # 2 defense points, both lost
    assert player_stats["defense"]["points_played"] == 2
    assert player_stats["defense"]["points_won"] == 0
    assert player_stats["defense"]["points_lost"] == 2

    # 1 point with turnover
    assert player_stats["defense"]["points_with_turnover"] == 1

    # 1 point lost without turnover (point 1 - opponent scored cleanly)
    assert player_stats["defense"]["points_lost_no_turnover"] == 1


def test_get_live_game_player_stats_mixed_offense_defense(db_session: Session, sample_game: models.Game, sample_player: models.Player):
    """Test player who plays both offense and defense"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Point 1: Offense won (player played)
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc)
    )
    point1.players.append(sample_player)
    db_session.add(point1)

    # Point 2: Offense lost (player played)
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 7, 0, tzinfo=timezone.utc)
    )
    point2.players.append(sample_player)
    db_session.add(point2)

    # Point 3: Defense won (player played)
    point3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 10, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 13, 0, tzinfo=timezone.utc)
    )
    point3.players.append(sample_player)
    db_session.add(point3)

    # Point 4: Defense won (player played)
    point4 = models.Point(
        game_id=sample_game.id,
        point_number=4,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 15, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 18, 0, tzinfo=timezone.utc)
    )
    point4.players.append(sample_player)
    db_session.add(point4)

    # Point 5: Defense lost (player played)
    point5 = models.Point(
        game_id=sample_game.id,
        point_number=5,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 20, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 22, 0, tzinfo=timezone.utc)
    )
    point5.players.append(sample_player)
    db_session.add(point5)

    db_session.commit()

    stats = crud.get_live_game_player_stats(db_session, sample_game.id)

    assert len(stats) == 1
    player_stats = stats[0]

    # Overall: 5 points played
    assert player_stats["points_played"] == 5

    # Offense: 2 points (1 won, 1 lost)
    assert player_stats["offense"]["points_played"] == 2
    assert player_stats["offense"]["points_won"] == 1
    assert player_stats["offense"]["points_lost"] == 1
    assert player_stats["offense"]["win_rate"] == 0.5

    # Defense: 3 points (2 won, 1 lost)
    assert player_stats["defense"]["points_played"] == 3
    assert player_stats["defense"]["points_won"] == 2
    assert player_stats["defense"]["points_lost"] == 1
    assert abs(player_stats["defense"]["win_rate"] - 0.667) < 0.01


# Tests for get_game_team_stats


def test_get_game_team_stats_no_completed_points(db_session: Session, sample_game: models.Game):
    """Test team stats when no points are completed"""
    stats = crud.get_game_team_stats(db_session, sample_game.id)

    assert stats is not None
    assert stats["game_id"] == sample_game.id
    assert stats["total_completed_points"] == 0

    # Offense should be all zeros
    assert stats["offense"]["points_started"] == 0
    assert stats["offense"]["points_won"] == 0
    assert stats["offense"]["points_lost"] == 0
    assert stats["offense"]["win_rate"] == 0.0
    assert stats["offense"]["points_won_no_turnover"] == 0
    assert stats["offense"]["clean_point_rate"] == 0.0
    assert stats["offense"]["break_rate"] == 0.0

    # Defense should be all zeros
    assert stats["defense"]["points_started"] == 0
    assert stats["defense"]["points_won"] == 0
    assert stats["defense"]["points_lost"] == 0
    assert stats["defense"]["win_rate"] == 0.0
    assert stats["defense"]["points_with_turnover"] == 0
    assert stats["defense"]["turnover_rate"] == 0.0
    assert stats["defense"]["points_won_no_turnover"] == 0
    assert stats["defense"]["clean_break_rate"] == 0.0
    assert stats["defense"]["points_lost_no_turnover"] == 0
    assert stats["defense"]["hold_rate"] == 0.0


def test_get_game_team_stats_game_not_found(db_session: Session):
    """Test with non-existent game ID"""
    stats = crud.get_game_team_stats(db_session, 99999)
    assert stats is None


def test_get_game_team_stats_only_offense_points(db_session: Session, sample_game: models.Game):
    """Test with only offensive points"""
    # Create 3 offense points: 2 won, 1 lost
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    point3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=True,
        won=False,
        status=models.PointStatusEnum.completed,
    )
    db_session.add_all([point1, point2, point3])
    db_session.commit()

    stats = crud.get_game_team_stats(db_session, sample_game.id)

    assert stats["total_completed_points"] == 3

    # Offense: 3 started, 2 won, 1 lost
    assert stats["offense"]["points_started"] == 3
    assert stats["offense"]["points_won"] == 2
    assert stats["offense"]["points_lost"] == 1
    assert abs(stats["offense"]["win_rate"] - 0.667) < 0.01
    assert abs(stats["offense"]["break_rate"] - 0.333) < 0.01

    # Defense: 0 started
    assert stats["defense"]["points_started"] == 0
    assert stats["defense"]["win_rate"] == 0.0


def test_get_game_team_stats_only_defense_points(db_session: Session, sample_game: models.Game):
    """Test with only defensive points"""
    # Create 4 defense points: 3 won, 1 lost
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    point3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    point4 = models.Point(
        game_id=sample_game.id,
        point_number=4,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
    )
    db_session.add_all([point1, point2, point3, point4])
    db_session.commit()

    stats = crud.get_game_team_stats(db_session, sample_game.id)

    assert stats["total_completed_points"] == 4

    # Offense: 0 started
    assert stats["offense"]["points_started"] == 0

    # Defense: 4 started, 3 won, 1 lost
    assert stats["defense"]["points_started"] == 4
    assert stats["defense"]["points_won"] == 3
    assert stats["defense"]["points_lost"] == 1
    assert abs(stats["defense"]["win_rate"] - 0.75) < 0.01
    assert abs(stats["defense"]["hold_rate"] - 0.75) < 0.01


def test_get_game_team_stats_offense_with_no_turnovers(db_session: Session, sample_game: models.Game):
    """Test offense clean points (no turnovers)"""
    # Create 3 offense points won, all without turnovers
    for i in range(3):
        point = models.Point(
            game_id=sample_game.id,
            point_number=i + 1,
            starting_on_offense=True,
            won=True,
            status=models.PointStatusEnum.completed,
        )
        db_session.add(point)
    db_session.commit()

    stats = crud.get_game_team_stats(db_session, sample_game.id)

    assert stats["offense"]["points_started"] == 3
    assert stats["offense"]["points_won"] == 3
    assert stats["offense"]["points_won_no_turnover"] == 3
    assert stats["offense"]["clean_point_rate"] == 1.0  # 100% clean


def test_get_game_team_stats_offense_with_turnovers(db_session: Session, sample_game: models.Game):
    """Test offense with turnovers - verify our/their attribution"""
    # Point 1: offense won with 2 turnovers (1 ours, 1 theirs) - not clean
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(point1)
    db_session.flush()

    # First turnover (odd) = ours
    turnover1_1 = models.Turnover(
        point_id=point1.id,
        timestamp=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc),
    )
    # Second turnover (even) = theirs
    turnover1_2 = models.Turnover(
        point_id=point1.id,
        timestamp=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
    )
    db_session.add_all([turnover1_1, turnover1_2])

    # Point 2: offense won with no turnovers - clean
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(point2)
    db_session.commit()

    stats = crud.get_game_team_stats(db_session, sample_game.id)

    assert stats["offense"]["points_started"] == 2
    assert stats["offense"]["points_won"] == 2
    assert stats["offense"]["points_won_no_turnover"] == 1  # Only point 2
    assert stats["offense"]["clean_point_rate"] == 0.5  # 1 out of 2 won


def test_get_game_team_stats_defense_with_turnovers(db_session: Session, sample_game: models.Game):
    """Test defense turnover tracking"""
    # Point 1: defense won with 1 turnover (theirs)
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(point1)
    db_session.flush()

    # When starting_on_offense=False, first turnover is theirs (odd)
    turnover1 = models.Turnover(
        point_id=point1.id,
        timestamp=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc),
    )
    db_session.add(turnover1)

    # Point 2: defense won with no turnovers (clean break)
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(point2)

    # Point 3: defense lost with no turnovers
    point3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(point3)
    db_session.commit()

    stats = crud.get_game_team_stats(db_session, sample_game.id)

    assert stats["defense"]["points_started"] == 3
    assert stats["defense"]["points_won"] == 2
    assert stats["defense"]["points_lost"] == 1
    assert stats["defense"]["points_with_turnover"] == 1  # Only point 1 had a turnover
    assert abs(stats["defense"]["turnover_rate"] - 0.333) < 0.01  # 1/3
    assert stats["defense"]["points_won_no_turnover"] == 2  # Both Point 1 and 2 (no OUR turnovers)
    assert abs(stats["defense"]["clean_break_rate"] - 0.667) < 0.01  # 2/3
    assert stats["defense"]["points_lost_no_turnover"] == 1  # Point 3


def test_get_game_team_stats_mixed_offense_defense(db_session: Session, sample_game: models.Game):
    """Test with mixed offense and defense points"""
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

    stats = crud.get_game_team_stats(db_session, sample_game.id)

    assert stats["total_completed_points"] == 4

    # Offense
    assert stats["offense"]["points_started"] == 2
    assert stats["offense"]["points_won"] == 1
    assert stats["offense"]["points_lost"] == 1
    assert stats["offense"]["win_rate"] == 0.5
    assert stats["offense"]["break_rate"] == 0.5

    # Defense
    assert stats["defense"]["points_started"] == 2
    assert stats["defense"]["points_won"] == 1
    assert stats["defense"]["points_lost"] == 1
    assert stats["defense"]["win_rate"] == 0.5
    assert stats["defense"]["hold_rate"] == 0.5


def test_get_game_team_stats_turnover_attribution_logic(db_session: Session, sample_game: models.Game):
    """Test the possession alternation logic for turnover attribution"""
    # Point 1: Start on OFFENSE with 3 turnovers
    # Turnovers: 1st=ours(odd), 2nd=theirs(even), 3rd=ours(odd)
    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(point1)
    db_session.flush()

    for i in range(3):
        turnover = models.Turnover(
            point_id=point1.id,
            timestamp=datetime(2024, 1, 1, 10, i, 0, tzinfo=timezone.utc),
        )
        db_session.add(turnover)

    # Point 2: Start on DEFENSE with 3 turnovers
    # Turnovers: 1st=theirs(odd), 2nd=ours(even), 3rd=theirs(odd)
    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(point2)
    db_session.flush()

    for i in range(3):
        turnover = models.Turnover(
            point_id=point2.id,
            timestamp=datetime(2024, 1, 1, 11, i, 0, tzinfo=timezone.utc),
        )
        db_session.add(turnover)

    db_session.commit()

    stats = crud.get_game_team_stats(db_session, sample_game.id)

    # Point 1 (offense): 2 our turnovers (1st, 3rd) - not clean
    assert stats["offense"]["points_won_no_turnover"] == 0

    # Point 2 (defense): 1 our turnover (2nd) - not clean break
    assert stats["defense"]["points_won_no_turnover"] == 0
    assert stats["defense"]["points_with_turnover"] == 1


def test_get_game_team_stats_ignores_non_completed_points(db_session: Session, sample_game: models.Game):
    """Test that only completed points are counted"""
    # Create points with different statuses
    ready_point = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        status=models.PointStatusEnum.ready,
    )
    running_point = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        status=models.PointStatusEnum.running,
    )
    scored_point = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=True,
        status=models.PointStatusEnum.scored,
    )
    completed_point = models.Point(
        game_id=sample_game.id,
        point_number=4,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
    )

    db_session.add_all([ready_point, running_point, scored_point, completed_point])
    db_session.commit()

    stats = crud.get_game_team_stats(db_session, sample_game.id)

    # Only the completed point should be counted
    assert stats["total_completed_points"] == 1
    assert stats["offense"]["points_started"] == 1
