import pytest


def test_create_player_api(client, sample_team):
    """Test POST /players"""
    response = client.post("/players", json={
        "team_id": sample_team.id,
        "name": "Alice",
        "number": 7,
        "gender": "W"
    })

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice"
    assert data["number"] == 7
    assert data["gender"] == "W"
    assert data["team_id"] == sample_team.id
    assert "id" in data


def test_create_player_without_number_api(client, sample_team):
    """Test POST /players without jersey number"""
    response = client.post("/players", json={
        "team_id": sample_team.id,
        "name": "Bob",
        "number": None,
        "gender": "M"
    })

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Bob"
    assert data["number"] is None
    assert data["gender"] == "M"


def test_create_player_team_not_found_api(client):
    """Test POST /players with invalid team_id"""
    response = client.post("/players", json={
        "team_id": 999,
        "name": "Alice",
        "number": 7,
        "gender": "W"
    })

    assert response.status_code == 404
    assert "team not found" in response.json()["detail"].lower()


def test_get_player_api(client, sample_players):
    """Test GET /players/{player_id}"""
    player = sample_players[0]
    response = client.get(f"/players/{player.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == player.id
    assert data["name"] == player.name


def test_get_player_not_found_api(client):
    """Test GET /players/{player_id} with invalid ID"""
    response = client.get("/players/999")

    assert response.status_code == 404


def test_update_player_api(client, sample_players):
    """Test PUT /players/{player_id}"""
    player = sample_players[0]
    response = client.put(
        f"/players/{player.id}",
        json={"name": "Updated Name", "number": 99}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == player.id
    assert data["name"] == "Updated Name"
    assert data["number"] == 99


def test_update_player_clear_number_api(client, sample_players):
    """Test PUT /players/{player_id} can clear jersey number with null."""
    player = sample_players[0]
    assert player.number is not None

    response = client.put(
        f"/players/{player.id}",
        json={"number": None}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == player.id
    assert data["number"] is None


def test_update_player_not_found_api(client):
    """Test PUT /players/{player_id} with invalid ID"""
    response = client.put("/players/999", json={"name": "Test", "number": 1})

    assert response.status_code == 404


def test_delete_player_api(client, sample_players):
    """Test DELETE /players/{player_id}"""
    player = sample_players[0]
    response = client.delete(f"/players/{player.id}")

    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/players/{player.id}")
    assert get_response.status_code == 404


def test_delete_player_not_found_api(client):
    """Test DELETE /players/{player_id} with invalid ID"""
    response = client.delete("/players/999")

    assert response.status_code == 404


def test_create_player_validation_error_api(client, sample_team):
    """Test POST /players with invalid data"""
    # Empty name
    response = client.post("/players", json={
        "team_id": sample_team.id,
        "name": "",
        "number": 7
    })

    assert response.status_code == 422


def test_create_player_invalid_number_api(client, sample_team):
    """Test POST /players with number out of range"""
    response = client.post("/players", json={
        "team_id": sample_team.id,
        "name": "Test Player",
        "number": 100  # Max is 99
    })

    assert response.status_code == 422
