"""
Tests for Line API endpoints
"""
import pytest
from app.schemas import Gender


# ===== POST /lines =====


def test_create_line(client, sample_team):
    """Test POST /lines creates a new line"""
    response = client.post(
        "/lines",
        json={
            "team_id": sample_team.id,
            "name": "O-Line",
            "description": "Primary offensive line",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "O-Line"
    assert data["description"] == "Primary offensive line"
    assert data["team_id"] == sample_team.id


def test_create_line_with_players(client, sample_team, sample_players):
    """Test creating line with initial players"""
    player_ids = [sample_players[0].id, sample_players[1].id, sample_players[2].id]

    response = client.post(
        "/lines",
        json={
            "team_id": sample_team.id,
            "name": "D-Line",
            "player_ids": player_ids,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "D-Line"
    # Note: POST returns Line (not LineWithPlayers), so no players field
    assert data["team_id"] == sample_team.id

    # Verify players were added by fetching the line
    response = client.get(f"/lines/{data['id']}")
    assert response.status_code == 200
    line_data = response.json()
    assert len(line_data["players"]) == 3


def test_create_line_invalid_team(client):
    """Test creating line with non-existent team fails"""
    response = client.post(
        "/lines",
        json={
            "team_id": 9999,
            "name": "O-Line",
        },
    )

    assert response.status_code == 404
    assert "Team not found" in response.json()["detail"]


def test_create_line_invalid_players(client, sample_team):
    """Test creating line with non-existent players fails"""
    response = client.post(
        "/lines",
        json={
            "team_id": sample_team.id,
            "name": "O-Line",
            "player_ids": [9999, 8888],
        },
    )

    assert response.status_code == 400
    assert "not found in team" in response.json()["detail"]


def test_create_line_duplicate_name(client, sample_team):
    """Test creating line with duplicate name fails"""
    # Create first line
    client.post(
        "/lines",
        json={
            "team_id": sample_team.id,
            "name": "O-Line",
        },
    )

    # Try to create another line with same name
    response = client.post(
        "/lines",
        json={
            "team_id": sample_team.id,
            "name": "O-Line",
        },
    )

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


# ===== GET /lines =====


def test_list_lines(client, sample_line):
    """Test GET /lines returns all lines"""
    response = client.get("/lines")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(line["id"] == sample_line.id for line in data)


def test_list_lines_by_team(client, sample_team, sample_line):
    """Test filtering lines by team"""
    # Create another team with a line
    response = client.post("/teams", json={"name": "Other Team"})
    other_team_id = response.json()["id"]
    client.post(
        "/lines",
        json={
            "team_id": other_team_id,
            "name": "Other Line",
        },
    )

    # Filter by original team
    response = client.get(f"/lines?team_id={sample_team.id}")

    assert response.status_code == 200
    data = response.json()
    assert all(line["team_id"] == sample_team.id for line in data)
    assert any(line["id"] == sample_line.id for line in data)


def test_list_lines_empty(client):
    """Test GET /lines returns empty list when no lines exist"""
    response = client.get("/lines")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_lines_includes_players(client, sample_line, sample_players):
    """Test GET /lines includes players in response"""
    # sample_line already has 3 players from fixture
    response = client.get("/lines")

    assert response.status_code == 200
    data = response.json()
    line = next(line for line in data if line["id"] == sample_line.id)
    assert "players" in line
    assert len(line["players"]) == 3  # fixture adds 3 players


# ===== GET /lines/{id} =====


def test_get_line(client, sample_line, sample_players):
    """Test GET /lines/{id} returns line with players"""
    # sample_line already has 3 players from fixture
    response = client.get(f"/lines/{sample_line.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_line.id
    assert data["name"] == sample_line.name
    assert "players" in data
    assert len(data["players"]) == 3  # fixture adds 3 players


def test_get_line_not_found(client):
    """Test getting non-existent line returns 404"""
    response = client.get("/lines/9999")

    assert response.status_code == 404


# ===== PUT /lines/{id} =====


def test_update_line_full(client, sample_line):
    """Test PUT /lines/{id} updates all fields"""
    response = client.put(
        f"/lines/{sample_line.id}",
        json={
            "name": "Updated Line",
            "description": "New description",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Line"
    assert data["description"] == "New description"


def test_update_line_partial(client, sample_line):
    """Test PUT /lines/{id} allows partial updates"""
    original_name = sample_line.name

    response = client.put(
        f"/lines/{sample_line.id}",
        json={
            "description": "Only updating description",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == original_name  # Unchanged
    assert data["description"] == "Only updating description"


def test_update_line_not_found(client):
    """Test updating non-existent line returns 404"""
    response = client.put("/lines/9999", json={"name": "New Name"})

    assert response.status_code == 404


def test_update_line_duplicate_name(client, sample_team):
    """Test updating line to duplicate name fails"""
    # Create two lines
    response1 = client.post(
        "/lines",
        json={
            "team_id": sample_team.id,
            "name": "O-Line",
        },
    )
    line1_id = response1.json()["id"]

    response2 = client.post(
        "/lines",
        json={
            "team_id": sample_team.id,
            "name": "D-Line",
        },
    )
    line2_id = response2.json()["id"]

    # Try to update line2 to have same name as line1
    response = client.put(
        f"/lines/{line2_id}",
        json={"name": "O-Line"},
    )

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


# ===== DELETE /lines/{id} =====


def test_delete_line(client, sample_line):
    """Test DELETE /lines/{id} deletes line"""
    line_id = sample_line.id

    response = client.delete(f"/lines/{line_id}")
    assert response.status_code == 204

    # Verify it's deleted
    response = client.get(f"/lines/{line_id}")
    assert response.status_code == 404


def test_delete_line_not_found(client):
    """Test deleting non-existent line returns 404"""
    response = client.delete("/lines/9999")

    assert response.status_code == 404


# ===== GET /lines/{id}/players =====


def test_list_line_players(client, sample_line, sample_players):
    """Test GET /lines/{id}/players lists players in line"""
    # sample_line already has 3 players from fixture
    response = client.get(f"/lines/{sample_line.id}/players")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3  # fixture adds 3 players
    assert all("id" in player for player in data)
    assert all("name" in player for player in data)


def test_list_line_players_not_found(client):
    """Test listing players for non-existent line returns 404"""
    response = client.get("/lines/9999/players")

    assert response.status_code == 404


# ===== POST /lines/{id}/players =====


def test_add_players_to_line(client, sample_line, sample_players):
    """Test POST /lines/{id}/players adds multiple players"""
    # sample_line already has first 3 players, add players 4-6
    player_ids = [sample_players[3].id, sample_players[4].id, sample_players[5].id]

    response = client.post(
        f"/lines/{sample_line.id}/players",
        json={"player_ids": player_ids},
    )

    assert response.status_code == 200
    data = response.json()
    assert "players" in data
    assert len(data["players"]) == 6  # 3 from fixture + 3 added


def test_add_players_line_not_found(client):
    """Test adding players to non-existent line fails"""
    response = client.post(
        "/lines/9999/players",
        json={"player_ids": [1, 2]},
    )

    assert response.status_code == 404


def test_add_players_invalid_players(client, sample_line):
    """Test adding non-existent players fails"""
    response = client.post(
        f"/lines/{sample_line.id}/players",
        json={"player_ids": [9999, 8888]},
    )

    assert response.status_code == 400
    assert "not found in team" in response.json()["detail"]


def test_add_players_duplicate_handled(client, sample_line, sample_players):
    """Test adding duplicate players is handled gracefully"""
    # sample_line already has first 3 players from fixture
    player_id = sample_players[0].id  # This player is already in the line

    # Try to add same player again - should not error
    response = client.post(
        f"/lines/{sample_line.id}/players",
        json={"player_ids": [player_id]},
    )
    assert response.status_code == 200
    data = response.json()
    # Should still have only 3 players (no duplicate)
    assert len(data["players"]) == 3


def test_add_players_empty_list(client, sample_line):
    """Test adding empty player list succeeds silently"""
    response = client.post(
        f"/lines/{sample_line.id}/players",
        json={"player_ids": []},
    )

    assert response.status_code == 200
    data = response.json()
    assert "players" in data
    # Should still have 3 players from fixture
    assert len(data["players"]) == 3


# ===== DELETE /lines/{id}/players =====


def test_remove_players_from_line(client, sample_line, sample_players):
    """Test DELETE /lines/{id}/players removes multiple players"""
    # sample_line already has first 3 players from fixture
    # Remove two of them
    remove_ids = [sample_players[0].id, sample_players[1].id]
    response = client.request(
        "DELETE",
        f"/lines/{sample_line.id}/players",
        json={"player_ids": remove_ids},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["players"]) == 1  # 3 - 2 = 1
    remaining_ids = [p["id"] for p in data["players"]]
    assert sample_players[0].id not in remaining_ids
    assert sample_players[1].id not in remaining_ids
    assert sample_players[2].id in remaining_ids


def test_remove_players_line_not_found(client):
    """Test removing players from non-existent line fails"""
    response = client.request(
        "DELETE",
        "/lines/9999/players",
        json={"player_ids": [1, 2]},
    )

    assert response.status_code == 404


def test_remove_players_non_existent_players(client, sample_line, sample_players):
    """Test removing non-existent players succeeds silently"""
    # sample_line already has first 3 players from fixture
    # Try to remove player that's not in line
    response = client.request(
        "DELETE",
        f"/lines/{sample_line.id}/players",
        json={"player_ids": [9999]},
    )

    assert response.status_code == 200
    data = response.json()
    # Original 3 players should still be there
    assert len(data["players"]) == 3
