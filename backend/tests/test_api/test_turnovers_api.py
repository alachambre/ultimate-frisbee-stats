import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import crud, schemas, models


def test_create_turnover_with_player(client: TestClient, sample_point: models.Point, sample_player: models.Player):
    """Test POST /turnovers with player assigned."""
    turnover_data = {
        "point_id": sample_point.id,
        "player_id": sample_player.id,
        "timestamp": "2024-01-15T10:05:00Z",
        "turnover_type": "drop",
        "comments": "Drop"
    }

    response = client.post("/turnovers", json=turnover_data)

    assert response.status_code == 201
    data = response.json()
    assert data["point_id"] == sample_point.id
    assert data["player_id"] == sample_player.id
    assert data["timestamp"] == "2024-01-15T10:05:00Z"
    assert data["turnover_type"] == "drop"
    assert data["comments"] == "Drop"
    assert "id" in data
    assert "created_at" in data
    # Verify player relationship is included
    assert "player" in data


def test_create_turnover_without_player(client: TestClient, sample_point: models.Point):
    """Test POST /turnovers without player (player_id=None)."""
    turnover_data = {
        "point_id": sample_point.id,
        "player_id": None,
        "timestamp": "2024-01-15T10:05:00Z",
        "comments": "Team turnover"
    }

    response = client.post("/turnovers", json=turnover_data)

    assert response.status_code == 201
    data = response.json()
    assert data["player_id"] is None
    assert data["turnover_type"] == "other"
    assert data["comments"] == "Team turnover"


def test_create_turnover_invalid_type(client: TestClient, sample_point: models.Point):
    """Test POST /turnovers with invalid turnover type returns validation error."""
    turnover_data = {
        "point_id": sample_point.id,
        "timestamp": "2024-01-15T10:05:00Z",
        "turnover_type": "banana",
    }

    response = client.post("/turnovers", json=turnover_data)

    assert response.status_code == 422


def test_create_turnover_invalid_point(client: TestClient):
    """Test POST /turnovers with invalid point returns 400."""
    turnover_data = {
        "point_id": 99999,
        "timestamp": "2024-01-15T10:05:00Z"
    }

    response = client.post("/turnovers", json=turnover_data)

    assert response.status_code == 400
    assert "Point with ID 99999 not found" in response.json()["detail"]


def test_create_turnover_invalid_player(client: TestClient, sample_point: models.Point):
    """Test POST /turnovers with invalid player returns 400."""
    turnover_data = {
        "point_id": sample_point.id,
        "player_id": 99999,
        "timestamp": "2024-01-15T10:05:00Z"
    }

    response = client.post("/turnovers", json=turnover_data)

    assert response.status_code == 400
    assert "Player with ID 99999 not found" in response.json()["detail"]


def test_get_turnover_success(client: TestClient, sample_point: models.Point, sample_player: models.Player, db_session: Session):
    """Test GET /turnovers/{id} returns turnover successfully."""
    # Create a turnover
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc)
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    response = client.get(f"/turnovers/{turnover.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == turnover.id
    assert data["point_id"] == sample_point.id
    assert data["player_id"] == sample_player.id
    assert "player" in data


def test_get_turnover_not_found(client: TestClient):
    """Test GET /turnovers/{id} with non-existent ID returns 404."""
    response = client.get("/turnovers/99999")

    assert response.status_code == 404
    assert "Turnover not found" in response.json()["detail"]


def test_update_turnover_change_player(client: TestClient, sample_point: models.Point, sample_player: models.Player, sample_team: models.Team, db_session: Session):
    """Test PUT /turnovers/{id} to change player."""
    # Create another player
    player2_data = schemas.PlayerCreate(
        team_id=sample_team.id,
        name="Player 2",
        gender=schemas.Gender.M
    )
    player2 = crud.create_player(db_session, player2_data)

    # Create turnover
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc)
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    update_data = {
        "player_id": player2.id
    }

    response = client.put(f"/turnovers/{turnover.id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["player_id"] == player2.id


def test_update_turnover_change_timestamp(client: TestClient, sample_point: models.Point, sample_player: models.Player, db_session: Session):
    """Test PUT /turnovers/{id} to change timestamp."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc)
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    update_data = {
        "timestamp": "2024-01-15T10:06:30Z"
    }

    response = client.put(f"/turnovers/{turnover.id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["timestamp"] == "2024-01-15T10:06:30Z"


def test_update_turnover_change_comments(client: TestClient, sample_point: models.Point, sample_player: models.Player, db_session: Session):
    """Test PUT /turnovers/{id} to update comments."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="Initial"
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    update_data = {
        "comments": "Updated comment"
    }

    response = client.put(f"/turnovers/{turnover.id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["comments"] == "Updated comment"


def test_update_turnover_change_type(client: TestClient, sample_point: models.Point, sample_player: models.Player, db_session: Session):
    """Test PUT /turnovers/{id} to update turnover type."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        turnover_type=schemas.TurnoverType.missed_pass,
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    update_data = {
        "turnover_type": "defended_huck"
    }

    response = client.put(f"/turnovers/{turnover.id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["turnover_type"] == "defended_huck"


def test_update_turnover_invalid_player(client: TestClient, sample_point: models.Point, sample_player: models.Player, db_session: Session):
    """Test PUT /turnovers/{id} with invalid player returns 400."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc)
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    update_data = {
        "player_id": 99999
    }

    response = client.put(f"/turnovers/{turnover.id}", json=update_data)

    assert response.status_code == 400
    assert "Player with ID 99999 not found" in response.json()["detail"]


def test_update_turnover_not_found(client: TestClient):
    """Test PUT /turnovers/{id} with non-existent ID returns 404."""
    update_data = {
        "comments": "New comment"
    }

    response = client.put("/turnovers/99999", json=update_data)

    assert response.status_code == 404
    assert "Turnover not found" in response.json()["detail"]


def test_delete_turnover_success(client: TestClient, sample_point: models.Point, sample_player: models.Player, db_session: Session):
    """Test DELETE /turnovers/{id} deletes turnover successfully."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc)
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    response = client.delete(f"/turnovers/{turnover.id}")

    assert response.status_code == 204

    # Verify it's deleted
    get_response = client.get(f"/turnovers/{turnover.id}")
    assert get_response.status_code == 404


def test_delete_turnover_not_found(client: TestClient):
    """Test DELETE /turnovers/{id} with non-existent ID returns 404."""
    response = client.delete("/turnovers/99999")

    assert response.status_code == 404
    assert "Turnover not found" in response.json()["detail"]


def test_list_point_turnovers(client: TestClient, sample_point: models.Point, sample_player: models.Player, db_session: Session):
    """Test GET /turnovers/points/{point_id}/turnovers returns all turnovers for a point."""
    # Create multiple turnovers
    turnover1_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="First"
    )
    turnover2_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=None,
        timestamp=datetime(2024, 1, 15, 10, 10, 0, tzinfo=timezone.utc),
        comments="Second"
    )

    crud.create_turnover(db_session, turnover1_data)
    crud.create_turnover(db_session, turnover2_data)

    response = client.get(f"/turnovers/points/{sample_point.id}/turnovers")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["comments"] == "First"
    assert data[1]["comments"] == "Second"
    # Verify player relationship is included
    assert "player" in data[0]


def test_list_point_turnovers_empty(client: TestClient, sample_point: models.Point):
    """Test GET /turnovers/points/{point_id}/turnovers with no turnovers returns empty list."""
    response = client.get(f"/turnovers/points/{sample_point.id}/turnovers")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0


def test_list_player_turnovers(client: TestClient, sample_point: models.Point, sample_player: models.Player, sample_team: models.Team, db_session: Session):
    """Test GET /turnovers/players/{player_id}/turnovers returns all turnovers for a player."""
    # Create another player
    player2_data = schemas.PlayerCreate(
        team_id=sample_team.id,
        name="Player 2",
        gender=schemas.Gender.M
    )
    player2 = crud.create_player(db_session, player2_data)

    # Create turnovers for both players
    turnover1_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc)
    )
    turnover2_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=player2.id,
        timestamp=datetime(2024, 1, 15, 10, 10, 0, tzinfo=timezone.utc)
    )
    turnover3_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 15, 0, tzinfo=timezone.utc)
    )

    crud.create_turnover(db_session, turnover1_data)
    crud.create_turnover(db_session, turnover2_data)
    crud.create_turnover(db_session, turnover3_data)

    response = client.get(f"/turnovers/players/{sample_player.id}/turnovers")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(t["player_id"] == sample_player.id for t in data)


def test_list_player_turnovers_empty(client: TestClient, sample_player: models.Player):
    """Test GET /turnovers/players/{player_id}/turnovers with no turnovers returns empty list."""
    response = client.get(f"/turnovers/players/{sample_player.id}/turnovers")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
