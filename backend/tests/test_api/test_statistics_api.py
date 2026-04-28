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


def test_get_game_point_timeline_success(
    client: TestClient,
    sample_game: models.Game,
    sample_players: list[models.Player],
    db_session: Session,
):
    """Game timeline should expose completed points with cumulative score and halftime marker."""
    sample_game.players.extend(sample_players)
    db_session.commit()

    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 1, 30, tzinfo=timezone.utc),
        field_side="table_left",
    )
    point1.players.extend(sample_players[:7])
    db_session.add(point1)
    db_session.flush()
    db_session.add(
        models.Turnover(
            point_id=point1.id,
            timestamp=datetime(2024, 1, 1, 10, 0, 45, tzinfo=timezone.utc),
        )
    )

    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 4, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        field_side="table_right",
    )
    point2.players.extend(sample_players[:7])
    db_session.add(point2)
    db_session.flush()
    db_session.add(
        models.Turnover(
            point_id=point2.id,
            timestamp=datetime(2024, 1, 1, 10, 4, 30, tzinfo=timezone.utc),
        )
    )

    point3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 8, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 9, 0, tzinfo=timezone.utc),
        field_side="table_left",
    )
    point3.players.extend(sample_players[:7])
    db_session.add(point3)

    db_session.add(
        models.Halftime(
            game_id=sample_game.id,
            halftime_timestamp=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
        )
    )
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/timeline")

    assert response.status_code == 200
    data = response.json()
    assert data["game_id"] == sample_game.id
    assert data["halftime_after_point_number"] == 1
    assert [point["point_number"] for point in data["points"]] == [1, 2, 3]
    assert data["points"][0]["duration_seconds"] == 90
    assert data["points"][0]["our_turnovers"] == 1
    assert data["points"][0]["opponent_turnovers"] == 0
    assert data["points"][1]["our_turnovers"] == 0
    assert data["points"][1]["opponent_turnovers"] == 1
    assert [(point["our_score_after"], point["opponent_score_after"]) for point in data["points"]] == [
        (1, 0),
        (1, 1),
        (2, 1),
    ]


def test_get_game_point_timeline_filters_visible_points_by_selected_players(
    client: TestClient,
    sample_game: models.Game,
    sample_team: models.Team,
    db_session: Session,
):
    """Filtered timeline should keep only matching points while preserving real game score after each point."""
    players = [
        models.Player(name=f"Player {index}", number=index, gender="M" if index <= 4 else "W", team_id=sample_team.id)
        for index in range(1, 9)
    ]
    db_session.add_all(players)
    db_session.commit()
    sample_game.players.extend(players)
    db_session.commit()

    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc),
    )
    point1.players.extend(players[:7])
    db_session.add(point1)

    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc),
    )
    point2.players.extend([players[0], *players[2:8]])
    db_session.add(point2)

    point3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 4, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
    )
    point3.players.extend([players[0], players[1], *players[3:8]])
    db_session.add(point3)
    db_session.commit()

    response = client.get(
        f"/statistics/games/{sample_game.id}/timeline",
        params=[("player_ids", players[0].id), ("player_ids", players[1].id)],
    )

    assert response.status_code == 200
    data = response.json()
    assert [point["point_number"] for point in data["points"]] == [1, 3]
    assert data["points"][1]["our_score_after"] == 2
    assert data["points"][1]["opponent_score_after"] == 1


def test_get_game_point_timeline_game_not_found(client: TestClient):
    response = client.get("/statistics/games/99999/timeline")

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
    """Test that all stoppage types reduce effective time"""
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

    # Add one resolved stoppage of each type (total dead time: 60s)
    stoppages = [
        models.Stoppage(
            point_id=point.id,
            stoppage_type="call",
            call_timestamp=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc),
            resume_timestamp=datetime(2024, 1, 1, 10, 1, 15, tzinfo=timezone.utc),
        ),
        models.Stoppage(
            point_id=point.id,
            stoppage_type="injury",
            call_timestamp=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
            resume_timestamp=datetime(2024, 1, 1, 10, 2, 15, tzinfo=timezone.utc),
        ),
        models.Stoppage(
            point_id=point.id,
            stoppage_type="timeout",
            call_timestamp=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc),
            resume_timestamp=datetime(2024, 1, 1, 10, 3, 15, tzinfo=timezone.utc),
        ),
        models.Stoppage(
            point_id=point.id,
            stoppage_type="other",
            call_timestamp=datetime(2024, 1, 1, 10, 4, 0, tzinfo=timezone.utc),
            resume_timestamp=datetime(2024, 1, 1, 10, 4, 15, tzinfo=timezone.utc),
        ),
    ]
    db_session.add_all(stoppages)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    # 300 seconds - 60 seconds (4 stoppages x 15s) = 240 seconds
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
    assert player_stats["offense"]["our_turnovers"] == 1
    assert player_stats["offense"]["opponent_turnovers"] == 0


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
    assert player_stats["defense"]["our_turnovers"] == 0
    assert player_stats["defense"]["opponent_turnovers"] == 1


def test_get_live_game_statistics_defense_conversion_rates(
    client: TestClient,
    sample_game: models.Game,
    sample_player: models.Player,
    db_session: Session,
):
    """Test that defense conversion metrics use turnovers and breaks as denominators"""
    sample_game.players.append(sample_player)
    db_session.commit()

    point1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc),
    )
    point1.players.append(sample_player)
    db_session.add(point1)
    db_session.flush()
    db_session.add(
        models.Turnover(
            point_id=point1.id,
            timestamp=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc),
        )
    )

    point2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 5, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 8, 0, tzinfo=timezone.utc),
    )
    point2.players.append(sample_player)
    db_session.add(point2)
    db_session.flush()
    db_session.add_all([
        models.Turnover(
            point_id=point2.id,
            timestamp=datetime(2024, 1, 1, 10, 6, 0, tzinfo=timezone.utc),
        ),
        models.Turnover(
            point_id=point2.id,
            timestamp=datetime(2024, 1, 1, 10, 7, 0, tzinfo=timezone.utc),
        ),
    ])

    point3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 10, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 12, 0, tzinfo=timezone.utc),
    )
    point3.players.append(sample_player)
    db_session.add(point3)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/live")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1

    player_stats = data[0]
    assert player_stats["defense"]["points_played"] == 3
    assert player_stats["defense"]["points_with_turnover"] == 2
    assert player_stats["defense"]["points_won"] == 2
    assert player_stats["defense"]["points_won_no_turnover"] == 1
    assert player_stats["defense"]["conversion_rate"] == pytest.approx(1.0, rel=1e-6)
    assert player_stats["defense"]["clean_conversion_rate"] == pytest.approx(0.5, rel=1e-6)


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
    assert data["offense"]["our_turnovers"] == 1
    assert data["offense"]["opponent_turnovers"] == 1
    assert data["offense"]["points_won"] == 2
    assert data["offense"]["points_won_no_turnover"] == 1
    assert data["offense"]["clean_hold_rate"] == 0.5  # 1 out of 2

    # Defense: 1 started, 1 with turnover
    assert data["defense"]["points_started"] == 1
    assert data["defense"]["points_with_turnover"] == 1
    assert data["defense"]["turnover_rate"] == 1.0
    assert data["defense"]["our_turnovers"] == 0
    assert data["defense"]["opponent_turnovers"] == 1


def test_get_game_team_statistics_defense_conversion_rates(
    client: TestClient,
    sample_game: models.Game,
    db_session: Session,
):
    """Team defense conversion metrics should use turnovers and breaks as denominators"""
    defense1 = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(defense1)
    db_session.flush()
    db_session.add(
        models.Turnover(
            point_id=defense1.id,
            timestamp=datetime(2024, 1, 1, 11, 1, 0, tzinfo=timezone.utc),
        )
    )

    defense2 = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=True,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(defense2)
    db_session.flush()
    db_session.add_all([
        models.Turnover(
            point_id=defense2.id,
            timestamp=datetime(2024, 1, 1, 11, 5, 0, tzinfo=timezone.utc),
        ),
        models.Turnover(
            point_id=defense2.id,
            timestamp=datetime(2024, 1, 1, 11, 6, 0, tzinfo=timezone.utc),
        ),
    ])

    defense3 = models.Point(
        game_id=sample_game.id,
        point_number=3,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
    )
    db_session.add(defense3)
    db_session.commit()

    response = client.get(f"/statistics/games/{sample_game.id}/team")

    assert response.status_code == 200
    data = response.json()
    assert data["defense"]["points_started"] == 3
    assert data["defense"]["points_with_turnover"] == 2
    assert data["defense"]["points_won"] == 2
    assert data["defense"]["points_won_no_turnover"] == 1
    assert data["defense"]["conversion_rate"] == pytest.approx(1.0, rel=1e-6)
    assert data["defense"]["clean_conversion_rate"] == pytest.approx(0.5, rel=1e-6)


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


def test_get_game_team_statistics_field_side_stats(client: TestClient, db_session: Session):
    """Field-side stats should split offense holds and defense breaks by tracked side."""
    from tests.builders import GameScenarioBuilder

    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_completed_point(offense=True, won=True, field_side="table_left") \
        .with_completed_point(offense=True, won=False, field_side="table_left") \
        .with_completed_point(offense=False, won=True, field_side="table_right") \
        .with_completed_point(offense=False, won=False, field_side="table_right") \
        .with_completed_point(offense=True, won=True, field_side=None) \
        .build()

    response = client.get(f"/statistics/games/{scenario.game.id}/team")

    assert response.status_code == 200
    data = response.json()

    field_side_stats = data["field_side_stats"]

    assert field_side_stats["table_left"]["offense"]["points_started"] == 2
    assert field_side_stats["table_left"]["offense"]["points_won"] == 1
    assert field_side_stats["table_left"]["offense"]["hold_rate"] == pytest.approx(0.5, rel=1e-6)
    assert field_side_stats["table_left"]["defense"]["points_started"] == 0
    assert field_side_stats["table_left"]["defense"]["points_won"] == 0
    assert field_side_stats["table_left"]["defense"]["break_rate"] == 0.0

    assert field_side_stats["table_right"]["defense"]["points_started"] == 2
    assert field_side_stats["table_right"]["defense"]["points_won"] == 1
    assert field_side_stats["table_right"]["defense"]["break_rate"] == pytest.approx(0.5, rel=1e-6)
    assert field_side_stats["table_right"]["offense"]["points_started"] == 0
    assert field_side_stats["table_right"]["offense"]["points_won"] == 0
    assert field_side_stats["table_right"]["offense"]["hold_rate"] == 0.0


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


def test_get_team_team_statistics_filters_points_by_selected_players(client: TestClient, db_session: Session):
    """Team stats should only include points where all selected players played together."""
    from tests.builders import GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(8)
        .build()
    )
    selected_ids = [scenario.players[0].id, scenario.players[1].id]

    PointBuilder(db_session, scenario.game.id, [player.id for player in scenario.players[:7]]) \
        .number(1).offense().won().complete()
    PointBuilder(db_session, scenario.game.id, [scenario.players[0].id] + [player.id for player in scenario.players[2:]]) \
        .number(2).offense().lost().complete()
    PointBuilder(db_session, scenario.game.id, [scenario.players[0].id, scenario.players[1].id] + [player.id for player in scenario.players[3:]]) \
        .number(3).defense().won().complete()

    response = client.get(
        f"/statistics/teams/{scenario.team.id}/team",
        params=[("player_ids", selected_ids[0]), ("player_ids", selected_ids[1])],
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_completed_points"] == 2
    assert data["offense"]["points_started"] == 1
    assert data["offense"]["points_won"] == 1
    assert data["defense"]["points_started"] == 1
    assert data["defense"]["points_won"] == 1


def test_get_team_team_statistics_filters_dataset_by_competition_ids(
    client: TestClient,
    db_session: Session,
):
    """Team stats should aggregate only the selected competitions when requested."""
    from tests.builders import CompetitionBuilder, GameBuilder, GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids).number(1).offense().won().complete()

    other_competition = CompetitionBuilder(db_session, scenario.team).with_name("Comp B").build()
    other_game = GameBuilder(db_session, other_competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, other_game.id, player_ids).number(1).defense().won().complete()

    response = client.get(
        f"/statistics/teams/{scenario.team.id}/team",
        params=[("competition_ids", scenario.competition.id)],
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_completed_points"] == 1
    assert data["offense"]["points_started"] == 1
    assert data["offense"]["points_won"] == 1
    assert data["defense"]["points_started"] == 0


def test_get_team_evolution_statistics_success(client: TestClient, db_session: Session):
    """Team evolution should return chronological chart-ready rows and omit empty games."""
    dataset = _build_team_evolution_api_dataset(db_session)

    response = client.get(f"/statistics/teams/{dataset['team'].id}/evolution")

    assert response.status_code == 200
    data = response.json()
    assert data["team_id"] == dataset["team"].id
    assert data["filters"] == {
        "competition_ids": [],
        "game_ids": [],
        "player_ids": [],
    }
    assert data["default_preset_id"] == "turnover_battle"
    assert data["omitted_games_count"] == 1
    assert {metric["id"] for metric in data["metrics"]} >= {
        "total_our_turnovers",
        "total_opponent_turnovers",
    }
    assert data["presets"][0]["metric_ids"] == [
        "total_our_turnovers",
        "total_opponent_turnovers",
    ]

    games = data["games"]
    assert [game["game_id"] for game in games] == [
        dataset["early_game"].id,
        dataset["late_game"].id,
    ]
    assert games[0]["date"] == "2026-01-01T09:00:00Z"
    assert games[0]["competition_name"] == "Spring Cup"
    assert games[0]["our_score"] == 2
    assert games[0]["opponent_score"] == 0
    assert games[0]["completed_points"] == 2
    assert games[0]["metrics"]["total_opponent_turnovers"] == 1
    assert games[0]["metrics"]["defense_break_rate"] == 1.0
    assert games[1]["metrics"]["total_our_turnovers"] == 1


def test_get_team_evolution_statistics_filters_dataset(
    client: TestClient,
    db_session: Session,
):
    """Competition and game filters should restrict the evolution series."""
    dataset = _build_team_evolution_api_dataset(db_session)

    competition_response = client.get(
        f"/statistics/teams/{dataset['team'].id}/evolution",
        params=[("competition_ids", dataset["spring_competition"].id)],
    )
    game_response = client.get(
        f"/statistics/teams/{dataset['team'].id}/evolution",
        params=[("game_ids", dataset["late_game"].id)],
    )

    assert competition_response.status_code == 200
    competition_data = competition_response.json()
    assert competition_data["filters"]["competition_ids"] == [
        dataset["spring_competition"].id
    ]
    assert competition_data["omitted_games_count"] == 1
    assert [game["game_id"] for game in competition_data["games"]] == [
        dataset["early_game"].id
    ]

    assert game_response.status_code == 200
    game_data = game_response.json()
    assert game_data["filters"]["game_ids"] == [dataset["late_game"].id]
    assert game_data["omitted_games_count"] == 0
    assert [game["game_id"] for game in game_data["games"]] == [
        dataset["late_game"].id
    ]


def test_get_team_evolution_statistics_filters_points_by_selected_players(
    client: TestClient,
    db_session: Session,
):
    """Player cohort filters should omit games with no matching completed points."""
    from tests.builders import GameBuilder, GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1", date=datetime(2026, 1, 1, 9, tzinfo=timezone.utc))
        .with_players(8)
        .build()
    )
    selected_ids = [scenario.players[0].id, scenario.players[1].id]
    second_game = (
        GameBuilder(db_session, scenario.competition)
        .with_opponent("Opponent 2")
        .with_date(datetime(2026, 1, 2, 9, tzinfo=timezone.utc))
        .build()
    )

    PointBuilder(db_session, scenario.game.id, [player.id for player in scenario.players[:7]]) \
        .number(1).offense().won().complete()
    PointBuilder(
        db_session,
        second_game.id,
        [scenario.players[0].id] + [player.id for player in scenario.players[2:]],
    ).number(1).defense().won().complete()

    response = client.get(
        f"/statistics/teams/{scenario.team.id}/evolution",
        params=[("player_ids", selected_ids[0]), ("player_ids", selected_ids[1])],
    )

    assert response.status_code == 200
    data = response.json()
    assert data["filters"]["player_ids"] == selected_ids
    assert data["omitted_games_count"] == 1
    assert [game["game_id"] for game in data["games"]] == [scenario.game.id]


def test_get_team_evolution_statistics_not_found(client: TestClient):
    response = client.get("/statistics/teams/99999/evolution")
    assert response.status_code == 404
    assert response.json()["detail"] == "Team not found"


def _build_team_evolution_api_dataset(db_session: Session):
    from tests.builders import CompetitionBuilder, GameBuilder, GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Spring Cup")
        .with_game("Early Opponent", date=datetime(2026, 1, 1, 9, tzinfo=timezone.utc))
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won().complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().won().with_pull(True).with_turnover(10).complete()

    empty_game = (
        GameBuilder(db_session, scenario.competition)
        .with_opponent("Empty Opponent")
        .with_date(datetime(2026, 1, 2, 9, tzinfo=timezone.utc))
        .build()
    )
    autumn_competition = (
        CompetitionBuilder(db_session, scenario.team)
        .with_name("Autumn Cup")
        .build()
    )
    late_game = (
        GameBuilder(db_session, autumn_competition)
        .with_opponent("Late Opponent")
        .with_date(datetime(2026, 1, 3, 9, tzinfo=timezone.utc))
        .build()
    )
    PointBuilder(db_session, late_game.id, player_ids) \
        .number(1).offense().lost().with_turnover(10).complete()

    return {
        "team": scenario.team,
        "spring_competition": scenario.competition,
        "autumn_competition": autumn_competition,
        "early_game": scenario.game,
        "empty_game": empty_game,
        "late_game": late_game,
    }


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


def test_get_team_player_statistics_filters_points_by_selected_players(client: TestClient, db_session: Session):
    """Player stats should be computed from points where all selected players were present."""
    from tests.builders import GameScenarioBuilder, PlayerBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(8)
        .build()
    )
    selected_ids = [scenario.players[0].id, scenario.players[1].id]

    PointBuilder(db_session, scenario.game.id, [player.id for player in scenario.players[:7]]) \
        .number(1).offense().won().complete()
    PointBuilder(db_session, scenario.game.id, [scenario.players[0].id] + [player.id for player in scenario.players[2:]]) \
        .number(2).offense().lost().complete()
    PointBuilder(db_session, scenario.game.id, [scenario.players[0].id, scenario.players[1].id] + [player.id for player in scenario.players[3:]]) \
        .number(3).defense().won().complete()

    bench_player = (
        PlayerBuilder(db_session, scenario.team)
        .with_name("Bench Player")
        .with_number(99)
        .male()
        .build()
    )

    response = client.get(
        f"/statistics/teams/{scenario.team.id}/players",
        params=[("player_ids", selected_ids[0]), ("player_ids", selected_ids[1])],
    )

    assert response.status_code == 200
    data = response.json()

    selected_stats = [player for player in data if player["player_id"] in selected_ids]
    assert len(selected_stats) == 2
    assert all(player["points_played"] == 2 for player in selected_stats)

    filtered_out_player = next(player for player in data if player["player_id"] == scenario.players[7].id)
    assert filtered_out_player["points_played"] == 1

    bench_stats = next(player for player in data if player["player_id"] == bench_player.id)
    assert bench_stats["points_played"] == 0


def test_get_team_player_statistics_limits_roster_to_selected_games(
    client: TestClient,
    db_session: Session,
):
    """Filtered team player stats should use the selected game roster instead of the full team."""
    from tests.builders import GameBuilder, GameScenarioBuilder, PlayerBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]
    PointBuilder(db_session, scenario.game.id, player_ids).number(1).offense().won().complete()

    bench_player = (
        PlayerBuilder(db_session, scenario.team)
        .with_name("Bench Player")
        .with_number(99)
        .male()
        .build()
    )
    other_game = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    other_game.players.extend([bench_player, *scenario.players[:6]])
    db_session.commit()
    PointBuilder(
        db_session,
        other_game.id,
        [bench_player.id] + [player.id for player in scenario.players[:6]],
    ).number(1).offense().won().complete()

    response = client.get(
        f"/statistics/teams/{scenario.team.id}/players",
        params=[("game_ids", scenario.game.id)],
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 7
    assert all(player["player_id"] != bench_player.id for player in data)
    assert all(player["points_played"] == 1 for player in data)


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


def test_get_team_strategy_statistics_filters_points_by_selected_players(
    client: TestClient,
    db_session: Session,
):
    """Strategy stats should include only points where selected players were together."""
    from tests.builders import GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(8)
        .with_offense_strategy("Vertical Stack")
        .with_defense_strategy("Zone")
        .build()
    )

    selected_ids = [scenario.players[0].id, scenario.players[1].id]
    offense_strategy_id = scenario.offense_strategies[0].id
    defense_strategy_id = scenario.defense_strategies[0].id

    PointBuilder(db_session, scenario.game.id, [player.id for player in scenario.players[:7]]) \
        .number(1).offense().with_strategy(offense_strategy_id).won().complete()
    PointBuilder(db_session, scenario.game.id, [scenario.players[0].id] + [player.id for player in scenario.players[2:]]) \
        .number(2).offense().with_strategy(offense_strategy_id).lost().complete()
    PointBuilder(db_session, scenario.game.id, [scenario.players[0].id, scenario.players[1].id] + [player.id for player in scenario.players[3:]]) \
        .number(3).defense().with_strategy(defense_strategy_id).won().complete()

    response = client.get(
        f"/statistics/teams/{scenario.team.id}/strategies",
        params=[("player_ids", selected_ids[0]), ("player_ids", selected_ids[1])],
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["offense_strategies"]) == 1
    assert len(data["defense_strategies"]) == 1
    assert data["offense_strategies"][0]["points_played"] == 1
    assert data["defense_strategies"][0]["points_played"] == 1


def test_get_team_strategy_statistics_filters_dataset_by_game_ids(
    client: TestClient,
    db_session: Session,
):
    """Strategy stats should aggregate only the selected games when requested."""
    from tests.builders import GameBuilder, GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .with_offense_strategy("Vertical Stack")
        .build()
    )

    strategy_id = scenario.offense_strategies[0].id
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids).number(1).offense().with_strategy(strategy_id).won().complete()

    other_game = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, other_game.id, player_ids).number(1).offense().with_strategy(strategy_id).lost().complete()

    response = client.get(
        f"/statistics/teams/{scenario.team.id}/strategies",
        params=[("game_ids", scenario.game.id)],
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["offense_strategies"]) == 1
    assert data["offense_strategies"][0]["points_played"] == 1
    assert data["offense_strategies"][0]["points_won"] == 1


def test_get_game_team_statistics_exposes_turnover_type_stats(
    client: TestClient,
    db_session: Session,
):
    from tests.builders import GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won() \
        .with_turnover_type(10, "defended_pass") \
        .with_turnover_type(20, "drop") \
        .complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().won() \
        .with_turnover_type(10, "miscommunication") \
        .complete()

    response = client.get(f"/statistics/games/{scenario.game.id}/team")

    assert response.status_code == 200
    data = response.json()
    assert data["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["total_turnovers"] == 1
    assert data["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["by_type"]["defended_pass"]["count"] == 1
    assert data["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["total_turnovers"] == 2
    assert data["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["drop"]["count"] == 1
    assert data["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["miscommunication"]["count"] == 1


def test_get_competition_team_statistics_aggregates_turnover_type_stats_across_games(
    client: TestClient,
    db_session: Session,
):
    from tests.builders import GameBuilder, GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won() \
        .with_turnover_type(10, "defended_huck") \
        .complete()

    second_game = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, second_game.id, player_ids) \
        .number(1).defense().lost() \
        .with_turnover_type(10, "missed_pass") \
        .with_turnover_type(20, "stall_out") \
        .complete()

    response = client.get(f"/statistics/competitions/{scenario.competition.id}/team")

    assert response.status_code == 200
    data = response.json()
    assert data["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["total_turnovers"] == 2
    assert data["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["by_type"]["defended_huck"]["count"] == 1
    assert data["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["by_type"]["stall_out"]["count"] == 1
    assert data["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["total_turnovers"] == 1
    assert data["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["missed_pass"]["count"] == 1


def test_get_team_team_statistics_filters_turnover_type_stats_by_selected_games(
    client: TestClient,
    db_session: Session,
):
    from tests.builders import GameBuilder, GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won() \
        .with_turnover_type(10, "defended_pass") \
        .complete()

    other_game = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, other_game.id, player_ids) \
        .number(1).defense().won() \
        .with_turnover_type(10, "drop") \
        .complete()

    response = client.get(
        f"/statistics/teams/{scenario.team.id}/team",
        params=[("game_ids", scenario.game.id)],
    )

    assert response.status_code == 200
    data = response.json()
    assert data["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["total_turnovers"] == 1
    assert data["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["by_type"]["defended_pass"]["count"] == 1
    assert data["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["total_turnovers"] == 0


def test_get_team_player_statistics_exposes_turnover_type_stats(
    client: TestClient,
    db_session: Session,
):
    from tests.builders import GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).defense().won() \
        .with_turnover_type(10, "missed_pass") \
        .with_turnover_type(20, "drop") \
        .complete()

    response = client.get(f"/statistics/teams/{scenario.team.id}/players")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 7
    assert data[0]["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["by_type"]["drop"]["count"] == 1
    assert data[0]["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["missed_pass"]["count"] == 1


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
    assert data["defense_strategies"][0]["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["other"]["count"] == 1


def test_get_strategy_stats_exposes_defense_turnover_type_breakdown(client: TestClient, db_session: Session):
    """Defense strategy stats should expose turnover-type distribution for the selected strategy."""
    from tests.builders import GameScenarioBuilder, PointBuilder

    scenario = (
        GameScenarioBuilder(db_session)
        .with_team()
        .with_competition()
        .with_game()
        .with_players(7)
        .with_defense_strategy("Zone")
        .build()
    )

    zone = scenario.defense_strategies[0]
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).defense().won().with_strategy(zone.id) \
        .with_turnover_type(10, "defended_pass") \
        .complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().lost().with_strategy(zone.id) \
        .with_turnover_type(10, "missed_huck") \
        .with_turnover_type(20, "drop") \
        .complete()

    response = client.get(f"/statistics/games/{scenario.game.id}/strategies")

    assert response.status_code == 200
    data = response.json()
    zone_stats = data["defense_strategies"][0]

    assert zone_stats["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["total_turnovers"] == 2
    assert zone_stats["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["defended_pass"]["count"] == 1
    assert zone_stats["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["missed_huck"]["count"] == 1
    assert zone_stats["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["by_type"]["drop"]["count"] == 1


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
