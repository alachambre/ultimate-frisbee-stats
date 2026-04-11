import pytest
from datetime import datetime, timezone


def test_create_game_api(client, sample_competition):
    """Test POST /games"""
    response = client.post("/games", json={
        "competition_id": sample_competition.id,
        "opponent_name": "Rival Team",
        "date": datetime.now().isoformat()
    })

    assert response.status_code == 201
    data = response.json()
    assert data["opponent_name"] == "Rival Team"
    assert data["competition_id"] == sample_competition.id
    assert data["status"] == "ready"
    assert "id" in data


def test_create_game_competition_not_found_api(client):
    """Test POST /games with invalid competition_id"""
    response = client.post("/games", json={
        "competition_id": 999,
        "opponent_name": "Rival Team",
        "date": datetime.now().isoformat()
    })

    assert response.status_code == 404
    assert "competition not found" in response.json()["detail"].lower()


def test_get_game_api(client, sample_game):
    """Test GET /games/{game_id}"""
    response = client.get(f"/games/{sample_game.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_game.id
    assert "our_score" in data
    assert "opponent_score" in data
    assert "points" in data
    assert isinstance(data["points"], list)


def test_get_game_api_includes_turnover_summary(client, sample_game, db_session):
    from app import models

    point = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
    )
    db_session.add(point)
    db_session.flush()
    db_session.add_all(
        [
            models.Turnover(
                point_id=point.id,
                timestamp=datetime(2024, 1, 1, 10, 0, 30, tzinfo=timezone.utc),
            ),
            models.Turnover(
                point_id=point.id,
                timestamp=datetime(2024, 1, 1, 10, 1, 15, tzinfo=timezone.utc),
            ),
        ]
    )
    db_session.commit()

    response = client.get(f"/games/{sample_game.id}")

    assert response.status_code == 200
    point_data = response.json()["points"][0]
    assert point_data["our_turnovers"] == 1
    assert point_data["opponent_turnovers"] == 1


def test_get_game_api_includes_halftime(client, sample_game):
    """Test GET /games/{game_id} includes halftime when it exists."""
    start_response = client.put(
        f"/games/{sample_game.id}",
        json={"status": "started"},
    )
    assert start_response.status_code == 200

    create_halftime_response = client.post(
        "/halftimes",
        json={"game_id": sample_game.id},
    )
    assert create_halftime_response.status_code == 201
    created_halftime = create_halftime_response.json()

    response = client.get(f"/games/{sample_game.id}")

    assert response.status_code == 200
    data = response.json()
    assert "halftime" in data
    assert data["halftime"] is not None
    assert data["halftime"]["id"] == created_halftime["id"]
    assert data["halftime"]["game_id"] == sample_game.id


def test_get_game_not_found_api(client):
    """Test GET /games/{game_id} with invalid ID"""
    response = client.get("/games/999")

    assert response.status_code == 404


def test_update_game_api(client, sample_game):
    """Test PUT /games/{game_id}"""
    response = client.put(
        f"/games/{sample_game.id}",
        json={"opponent_name": "Updated Opponent"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_game.id
    assert data["opponent_name"] == "Updated Opponent"


def test_update_game_status_api(client, sample_game):
    """Test PUT /games/{game_id} to change status"""
    response = client.put(
        f"/games/{sample_game.id}",
        json={"status": "ended"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ended"


def test_update_game_not_found_api(client):
    """Test PUT /games/{game_id} with invalid ID"""
    response = client.put("/games/999", json={"opponent_name": "Test"})

    assert response.status_code == 404


def test_finish_game_api(client, sample_game):
    """Test POST /games/{game_id}/finish"""
    response = client.post(f"/games/{sample_game.id}/finish")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ended"


def test_finish_game_not_found_api(client):
    """Test POST /games/{game_id}/finish with invalid ID"""
    response = client.post("/games/999/finish")

    assert response.status_code == 404


def test_delete_game_api(client, sample_game):
    """Test DELETE /games/{game_id}"""
    response = client.delete(f"/games/{sample_game.id}")

    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/games/{sample_game.id}")
    assert get_response.status_code == 404


def test_delete_game_not_found_api(client):
    """Test DELETE /games/{game_id} with invalid ID"""
    response = client.delete("/games/999")

    assert response.status_code == 404


def test_get_game_points_api(client, sample_game, sample_players):
    """Test GET /games/{game_id}/points"""
    # Create a point first
    player_ids = [p.id for p in sample_players]
    client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "won": True,
        "player_ids": player_ids
    })

    response = client.get(f"/games/{sample_game.id}/points")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["game_id"] == sample_game.id
    assert "players" in data[0]
    assert data[0]["our_turnovers"] == 0
    assert data[0]["opponent_turnovers"] == 0


def test_get_game_turnovers_api_returns_turnovers_ordered_by_point_and_timestamp(
    client, sample_game, sample_player, db_session
):
    from app import models

    point_one = models.Point(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        won=True,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc),
    )
    point_two = models.Point(
        game_id=sample_game.id,
        point_number=2,
        starting_on_offense=False,
        won=False,
        status=models.PointStatusEnum.completed,
        start_datetime=datetime(2024, 1, 1, 10, 2, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2024, 1, 1, 10, 3, 0, tzinfo=timezone.utc),
    )
    db_session.add_all([point_one, point_two])
    db_session.flush()

    db_session.add_all(
        [
            models.Turnover(
                point_id=point_two.id,
                player_id=sample_player.id,
                timestamp=datetime(2024, 1, 1, 10, 2, 45, tzinfo=timezone.utc),
                turnover_type="drop",
                comments="Second point",
            ),
            models.Turnover(
                point_id=point_one.id,
                player_id=sample_player.id,
                timestamp=datetime(2024, 1, 1, 10, 0, 45, tzinfo=timezone.utc),
                turnover_type="missed_pass",
                comments="Later on point one",
            ),
            models.Turnover(
                point_id=point_one.id,
                player_id=sample_player.id,
                timestamp=datetime(2024, 1, 1, 10, 0, 15, tzinfo=timezone.utc),
                turnover_type="defended_pass",
                comments="Earlier on point one",
            ),
        ]
    )
    db_session.commit()

    response = client.get(f"/games/{sample_game.id}/turnovers")

    assert response.status_code == 200
    data = response.json()
    assert [turnover["point_id"] for turnover in data] == [point_one.id, point_one.id, point_two.id]
    assert [turnover["turnover_type"] for turnover in data] == [
        "defended_pass",
        "missed_pass",
        "drop",
    ]
    assert data[0]["comments"] == "Earlier on point one"


def test_create_game_validation_error_api(client, sample_competition):
    """Test POST /games with invalid data"""
    response = client.post("/games", json={
        "competition_id": sample_competition.id,
        "opponent_name": "",  # Empty name
        "date": datetime.now().isoformat()
    })

    assert response.status_code == 422
