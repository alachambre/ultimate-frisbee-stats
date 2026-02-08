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


def test_get_live_game_statistics_with_stoppages(client: TestClient, sample_game: models.Game, sample_player: models.Player, db_session: Session):
    """Test that stoppages reduce effective time"""
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

    # Add stoppage with 1 minute dead time
    stoppage = models.Stoppage(
        point_id=point.id,
        call_timestamp=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
        resume_timestamp=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc),
    )
    db_session.add(stoppage)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    # 300 seconds - 60 seconds (stoppage) = 240 seconds
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


def test_get_live_game_statistics_offense_defense_breakdown(client: TestClient, sample_game: models.Game, sample_team: models.Team, db_session: Session):
    """Test that offense/defense stats are returned correctly"""
    # Create player
    player = models.Player(name="Test Player", number=10, gender="M", team_id=sample_team.id)
    db_session.add(player)
    db_session.commit()

    # Add to game
    sample_game.players.append(player)
    db_session.commit()

    # Create 2 offense points (1 won, 1 lost)
    offense_won = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc)
    )
    offense_won.players.append(player)
    db_session.add(offense_won)

    offense_lost = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=True,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 7, 0, tzinfo=timezone.utc)
    )
    offense_lost.players.append(player)
    db_session.add(offense_lost)

    # Create 1 defense point (won)
    defense_won = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 10, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 13, 0, tzinfo=timezone.utc)
    )
    defense_won.players.append(player)
    db_session.add(defense_won)

    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

    player_stats = data[0]
    assert player_stats["points_played"] == 3

    # Verify offense stats
    assert player_stats["offense"]["points_played"] == 2
    assert player_stats["offense"]["points_won"] == 1
    assert player_stats["offense"]["points_lost"] == 1
    assert player_stats["offense"]["hold_rate"] == 0.5

    # Verify defense stats
    assert player_stats["defense"]["points_played"] == 1
    assert player_stats["defense"]["points_won"] == 1
    assert player_stats["defense"]["points_lost"] == 0
    assert player_stats["defense"]["break_rate"] == 1.0


def test_get_live_game_statistics_clean_points(client: TestClient, sample_game: models.Game, sample_player: models.Player, db_session: Session):
    """Test that clean points and rates are calculated correctly"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Point 1: Offense won without turnovers (clean)
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

    # Add turnover to point 2
    turnover = models.Turnover(
        point_id=point2.id,
        timestamp=datetime(2024, 1, 1, 10, 6, 0, tzinfo=timezone.utc)
    )
    db_session.add(turnover)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

    player_stats = data[0]
    assert player_stats["offense"]["points_won"] == 2
    assert player_stats["offense"]["points_won_no_turnover"] == 1
    assert player_stats["offense"]["clean_hold_rate"] == 0.5


def test_get_live_game_statistics_defense_turnovers(client: TestClient, sample_game: models.Game, sample_player: models.Player, db_session: Session):
    """Test that defense turnover tracking works correctly"""
    # Add player to game
    sample_game.players.append(sample_player)
    db_session.commit()

    # Point 1: Defense with turnover (forced a D)
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

    turnover1 = models.Turnover(
        point_id=point1.id,
        timestamp=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc)
    )
    db_session.add(turnover1)

    # Point 2: Defense lost without turnover (opponent scored cleanly)
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
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

    player_stats = data[0]
    assert player_stats["defense"]["points_played"] == 2
    assert player_stats["defense"]["points_with_turnover"] == 1
    assert player_stats["defense"]["turnover_rate"] == 0.5
    assert player_stats["defense"]["points_lost_no_turnover"] == 1


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
    assert data["offense"]["hold_rate"] == 0.5

    # Defense
    assert data["defense"]["points_started"] == 2
    assert data["defense"]["points_won"] == 1
    assert data["defense"]["points_lost"] == 1
    assert data["defense"]["break_rate"] == 0.5


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
    assert data["offense"]["hold_rate"] == 0.0
    assert data["defense"]["points_started"] == 0
    assert data["defense"]["break_rate"] == 0.0


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
    assert data["offense"]["clean_hold_rate"] == 0.5  # 1 out of 2

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


def test_get_game_team_statistics_pull_stats(client: TestClient, db_session: Session):
    """Test pull statistics calculation in team stats"""
    from tests.builders import GameScenarioBuilder

    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_completed_point(offense=False, won=True, pull=True) \
        .with_completed_point(offense=False, won=False, pull=False) \
        .with_completed_point(offense=False, won=True, pull=True) \
        .with_completed_point(offense=False, won=True, pull=None) \
        .build()

    response = client.get(f"/statistics/games/{scenario.game.id}/team")

    assert response.status_code == 200
    data = response.json()

    # Pull stats should be in defense section
    pull_stats = data["defense"]["pull_stats"]
    assert pull_stats["total_pulls"] == 3  # Only points with pull tracked
    assert pull_stats["inbound_pulls"] == 2
    assert pull_stats["out_of_bounds_pulls"] == 1
    assert pull_stats["inbound_rate"] == pytest.approx(2/3, rel=1e-6)


def test_get_game_team_statistics_pull_stats_defense_only(client: TestClient, db_session: Session):
    """Test that pull stats only count defense points"""
    from tests.builders import GameScenarioBuilder

    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_completed_point(offense=True, won=True, pull=True) \
        .with_completed_point(offense=False, won=True, pull=True) \
        .build()

    response = client.get(f"/statistics/games/{scenario.game.id}/team")

    assert response.status_code == 200
    data = response.json()

    # Only defense point should be counted
    pull_stats = data["defense"]["pull_stats"]
    assert pull_stats["total_pulls"] == 1
    assert pull_stats["inbound_pulls"] == 1


# Competition and Team Statistics API Tests


def test_get_competition_team_statistics_success(client: TestClient, db_session: Session):
    """Competition stats should aggregate all games from that competition only"""
    from tests.builders import GameScenarioBuilder, CompetitionBuilder, GameBuilder, PointBuilder

    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .with_completed_point(offense=False, won=False, pull=False, with_turnover=True) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Another game in same competition -> should be included
    game_in_same_comp = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, game_in_same_comp.id, player_ids).offense().won().complete()

    # Different competition for same team -> should be excluded
    other_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp B").build()
    other_game = GameBuilder(db_session, other_comp).with_opponent("Opponent 3").build()
    PointBuilder(db_session, other_game.id, player_ids).offense().lost().complete()

    response = client.get(f"/statistics/competitions/{scenario.competition.id}/team")

    assert response.status_code == 200
    data = response.json()

    assert data["competition_id"] == scenario.competition.id
    assert data["total_completed_points"] == 3

    assert data["offense"]["points_started"] == 2
    assert data["offense"]["points_won"] == 2
    assert data["offense"]["points_lost"] == 0
    assert data["offense"]["hold_rate"] == 1.0

    assert data["defense"]["points_started"] == 1
    assert data["defense"]["points_won"] == 0
    assert data["defense"]["points_lost"] == 1
    assert data["defense"]["break_rate"] == 0.0

    pull_stats = data["defense"]["pull_stats"]
    assert pull_stats["total_pulls"] == 1
    assert pull_stats["inbound_pulls"] == 0
    assert pull_stats["out_of_bounds_pulls"] == 1


def test_get_competition_team_statistics_not_found(client: TestClient):
    response = client.get("/statistics/competitions/99999/team")
    assert response.status_code == 404
    assert response.json()["detail"] == "Competition not found"


def test_get_team_team_statistics_success(client: TestClient, db_session: Session):
    """Team stats should aggregate across all competitions for a team"""
    from tests.builders import GameScenarioBuilder, CompetitionBuilder, GameBuilder, PointBuilder

    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .with_completed_point(offense=False, won=True, pull=True) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Another competition for same team -> should be included
    second_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp A2").build()
    second_game = GameBuilder(db_session, second_comp).with_opponent("Opponent 2").build()
    PointBuilder(db_session, second_game.id, player_ids).offense().lost().complete()

    # Another team -> should be excluded
    other_team_scenario = GameScenarioBuilder(db_session) \
        .with_team("Team B") \
        .with_competition("Comp B") \
        .with_game("Opponent X") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .build()
    assert other_team_scenario.team.id != scenario.team.id

    response = client.get(f"/statistics/teams/{scenario.team.id}/team")

    assert response.status_code == 200
    data = response.json()

    assert data["team_id"] == scenario.team.id
    assert data["total_completed_points"] == 3

    assert data["offense"]["points_started"] == 2
    assert data["offense"]["points_won"] == 1
    assert data["offense"]["points_lost"] == 1
    assert data["offense"]["hold_rate"] == pytest.approx(0.5, rel=1e-6)

    assert data["defense"]["points_started"] == 1
    assert data["defense"]["points_won"] == 1
    assert data["defense"]["points_lost"] == 0
    assert data["defense"]["break_rate"] == 1.0

    pull_stats = data["defense"]["pull_stats"]
    assert pull_stats["total_pulls"] == 1
    assert pull_stats["inbound_pulls"] == 1


def test_get_team_team_statistics_not_found(client: TestClient):
    response = client.get("/statistics/teams/99999/team")
    assert response.status_code == 404
    assert response.json()["detail"] == "Team not found"


# Competition and Team Player Statistics API Tests


def test_get_competition_player_statistics_success(client: TestClient, db_session: Session):
    """Competition player stats should aggregate all games from that competition only"""
    from tests.builders import GameScenarioBuilder, CompetitionBuilder, GameBuilder, PointBuilder

    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .with_completed_point(offense=False, won=False) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Another game in same competition -> should be included
    same_comp_game = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, same_comp_game.id, player_ids).offense().won().complete()

    # Different competition -> should be excluded
    other_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp B").build()
    other_game = GameBuilder(db_session, other_comp).with_opponent("Opponent 3").build()
    PointBuilder(db_session, other_game.id, player_ids).offense().lost().complete()

    response = client.get(f"/statistics/competitions/{scenario.competition.id}/players")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 7
    assert all(player["points_played"] == 3 for player in data)


def test_get_competition_player_statistics_not_found(client: TestClient):
    response = client.get("/statistics/competitions/99999/players")
    assert response.status_code == 404
    assert response.json()["detail"] == "Competition not found"


def test_get_team_player_statistics_success(client: TestClient, db_session: Session):
    """Team player stats should aggregate all competitions for that team only"""
    from tests.builders import GameScenarioBuilder, CompetitionBuilder, GameBuilder, PointBuilder, PlayerBuilder

    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .with_completed_point(offense=False, won=False) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Another competition for same team -> should be included
    same_team_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp A2").build()
    same_team_game = GameBuilder(db_session, same_team_comp).with_opponent("Opponent 2").build()
    PointBuilder(db_session, same_team_game.id, player_ids).offense().won().complete()

    # Add bench player with no points -> should still appear
    PlayerBuilder(db_session, scenario.team).with_name("Bench Player").with_number(99).male().build()

    # Different team -> should be excluded
    other_team = GameScenarioBuilder(db_session) \
        .with_team("Team B") \
        .with_competition("Comp B") \
        .with_game("Opponent X") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .build()
    assert other_team.team.id != scenario.team.id

    response = client.get(f"/statistics/teams/{scenario.team.id}/players")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8

    active_players = [player for player in data if player["player_number"] != 99]
    bench_player = next(player for player in data if player["player_number"] == 99)

    assert all(player["points_played"] == 3 for player in active_players)
    assert bench_player["points_played"] == 0
    assert bench_player["effective_time_seconds"] == 0


def test_get_team_player_statistics_not_found(client: TestClient):
    response = client.get("/statistics/teams/99999/players")
    assert response.status_code == 404
    assert response.json()["detail"] == "Team not found"


# Competition and Team Strategy Statistics API Tests


def test_get_competition_strategy_statistics_success(client: TestClient, db_session: Session):
    """Competition strategy stats should aggregate all games from that competition only"""
    from tests.builders import GameScenarioBuilder, CompetitionBuilder, GameBuilder, PointBuilder

    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_offense_strategy("Vertical Stack") \
        .with_defense_strategy("Zone")

    vert = scenario.offense_strategies[0]
    zone = scenario.defense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vert) \
        .with_completed_point(offense=False, won=True, strategy=zone) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Another game in same competition -> should be included
    same_comp_game = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, same_comp_game.id, player_ids).offense().with_strategy(vert.id).won().complete()

    # Different competition -> should be excluded
    other_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp B").build()
    other_game = GameBuilder(db_session, other_comp).with_opponent("Opponent 3").build()
    PointBuilder(db_session, other_game.id, player_ids).offense().with_strategy(vert.id).won().complete()

    response = client.get(f"/statistics/competitions/{scenario.competition.id}/strategies")

    assert response.status_code == 200
    data = response.json()
    assert data["competition_id"] == scenario.competition.id
    assert len(data["offense_strategies"]) == 1
    assert len(data["defense_strategies"]) == 1
    assert data["offense_strategies"][0]["strategy_name"] == "Vertical Stack"
    assert data["offense_strategies"][0]["points_played"] == 2
    assert data["defense_strategies"][0]["strategy_name"] == "Zone"
    assert data["defense_strategies"][0]["points_played"] == 1


def test_get_competition_strategy_statistics_not_found(client: TestClient):
    response = client.get("/statistics/competitions/99999/strategies")
    assert response.status_code == 404
    assert response.json()["detail"] == "Competition not found"


def test_get_team_strategy_statistics_success(client: TestClient, db_session: Session):
    """Team strategy stats should aggregate all competitions for that team only"""
    from tests.builders import GameScenarioBuilder, CompetitionBuilder, GameBuilder, PointBuilder

    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_offense_strategy("Vertical Stack") \
        .with_defense_strategy("Zone")

    vert = scenario.offense_strategies[0]
    zone = scenario.defense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vert) \
        .with_completed_point(offense=False, won=True, strategy=zone) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Another competition for same team -> should be included
    same_team_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp A2").build()
    same_team_game = GameBuilder(db_session, same_team_comp).with_opponent("Opponent 2").build()
    PointBuilder(db_session, same_team_game.id, player_ids).offense().with_strategy(vert.id).won().complete()

    # Different team -> should be excluded
    other_team = GameScenarioBuilder(db_session) \
        .with_team("Team B") \
        .with_competition("Comp B") \
        .with_game("Opponent X") \
        .with_players(7) \
        .with_offense_strategy("Other O") \
        .with_defense_strategy("Other D")
    other_o = other_team.offense_strategies[0]
    other_d = other_team.defense_strategies[0]
    other_team.with_completed_point(offense=True, won=True, strategy=other_o) \
        .with_completed_point(offense=False, won=True, strategy=other_d) \
        .build()

    response = client.get(f"/statistics/teams/{scenario.team.id}/strategies")

    assert response.status_code == 200
    data = response.json()
    assert data["team_id"] == scenario.team.id
    assert len(data["offense_strategies"]) == 1
    assert len(data["defense_strategies"]) == 1
    assert data["offense_strategies"][0]["strategy_name"] == "Vertical Stack"
    assert data["offense_strategies"][0]["points_played"] == 2
    assert data["defense_strategies"][0]["strategy_name"] == "Zone"
    assert data["defense_strategies"][0]["points_played"] == 1


def test_get_team_strategy_statistics_not_found(client: TestClient):
    response = client.get("/statistics/teams/99999/strategies")
    assert response.status_code == 404
    assert response.json()["detail"] == "Team not found"


# Strategy Statistics API Tests

def test_get_strategy_stats_success(client: TestClient, db_session: Session):
    """Test successful retrieval of strategy statistics"""
    from tests.builders import GameScenarioBuilder
    
    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_offense_strategy("Vertical Stack") \
        .with_defense_strategy("Zone")
    
    # Create offense and defense points with strategies
    vert = scenario.offense_strategies[0]
    zone = scenario.defense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vert, duration_seconds=30) \
        .with_completed_point(offense=False, won=True, strategy=zone, pull=True, with_turnover=True) \
        .build()
    
    response = client.get(f"/statistics/games/{scenario.game.id}/strategies")
    
    assert response.status_code == 200
    data = response.json()

    assert data["game_id"] == scenario.game.id

    # Offense strategies
    assert len(data["offense_strategies"]) == 1
    assert data["offense_strategies"][0]["strategy_name"] == "Vertical Stack"
    assert data["offense_strategies"][0]["points_played"] == 1
    assert data["offense_strategies"][0]["hold_rate"] == 1.0
    assert data["offense_strategies"][0]["quick_scores"] == 1
    
    # Defense strategies
    assert len(data["defense_strategies"]) == 1
    assert data["defense_strategies"][0]["strategy_name"] == "Zone"
    assert data["defense_strategies"][0]["points_played"] == 1
    assert data["defense_strategies"][0]["break_rate"] == 1.0
    assert data["defense_strategies"][0]["turnover_rate"] == 1.0


def test_get_strategy_stats_game_not_found(client: TestClient):
    """Test strategy stats with non-existent game ID"""
    response = client.get("/statistics/games/99999/strategies")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Game not found"


def test_get_strategy_stats_no_completed_points(client: TestClient, db_session: Session):
    """Test strategy stats with no completed points"""
    from tests.builders import GameScenarioBuilder
    
    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .build()
    
    response = client.get(f"/statistics/games/{scenario.game.id}/strategies")
    
    assert response.status_code == 200
    data = response.json()

    assert data["game_id"] == scenario.game.id
    assert len(data["offense_strategies"]) == 0
    assert len(data["defense_strategies"]) == 0


def test_get_strategy_stats_multiple_strategies(client: TestClient, db_session: Session):
    """Test strategy stats with multiple strategies per type"""
    from tests.builders import GameScenarioBuilder
    
    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_offense_strategy("Vertical Stack") \
        .with_offense_strategy("Horizontal Stack") \
        .with_defense_strategy("Zone") \
        .with_defense_strategy("Man-to-Man")
    
    # Vertical: 2 points (1 win, 1 loss)
    vert = scenario.offense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vert, duration_seconds=30) \
        .with_completed_point(offense=True, won=False, strategy=vert, duration_seconds=120)
    
    # Horizontal: 1 point (win)
    horiz = scenario.offense_strategies[1]
    scenario.with_completed_point(offense=True, won=True, strategy=horiz, duration_seconds=100)
    
    # Zone: 2 points (1 break, 1 loss)
    zone = scenario.defense_strategies[0]
    scenario.with_completed_point(offense=False, won=True, strategy=zone, with_turnover=True) \
        .with_completed_point(offense=False, won=False, strategy=zone, with_turnover=False)
    
    # Man: 1 point (loss with turnover)
    man = scenario.defense_strategies[1]
    scenario.with_completed_point(offense=False, won=False, strategy=man, with_turnover=True) \
        .build()
    
    response = client.get(f"/statistics/games/{scenario.game.id}/strategies")
    
    assert response.status_code == 200
    data = response.json()
    
    # Should have 2 offense and 2 defense strategies
    assert len(data["offense_strategies"]) == 2
    assert len(data["defense_strategies"]) == 2
    
    # Verify sorted by name
    assert data["offense_strategies"][0]["strategy_name"] == "Horizontal Stack"
    assert data["offense_strategies"][1]["strategy_name"] == "Vertical Stack"
    assert data["defense_strategies"][0]["strategy_name"] == "Man-to-Man"
    assert data["defense_strategies"][1]["strategy_name"] == "Zone"
