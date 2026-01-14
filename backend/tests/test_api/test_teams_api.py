import pytest


def test_create_team_api(client):
    """Test POST /teams"""
    response = client.post("/teams", json={"name": "Flying Disc Club"})

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Flying Disc Club"
    assert "id" in data
    assert "created_at" in data


def test_list_teams_api(client, sample_team):
    """Test GET /teams"""
    response = client.get("/teams")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["name"] == sample_team.name


def test_get_team_api(client, sample_team):
    """Test GET /teams/{team_id}"""
    response = client.get(f"/teams/{sample_team.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_team.id
    assert data["name"] == sample_team.name
    assert "players" in data
    assert isinstance(data["players"], list)


def test_get_team_not_found_api(client):
    """Test GET /teams/{team_id} with invalid ID"""
    response = client.get("/teams/999")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_update_team_api(client, sample_team):
    """Test PUT /teams/{team_id}"""
    response = client.put(
        f"/teams/{sample_team.id}",
        json={"name": "Updated Team Name"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_team.id
    assert data["name"] == "Updated Team Name"


def test_update_team_not_found_api(client):
    """Test PUT /teams/{team_id} with invalid ID"""
    response = client.put("/teams/999", json={"name": "Updated"})

    assert response.status_code == 404


def test_delete_team_api(client, sample_team):
    """Test DELETE /teams/{team_id}"""
    response = client.delete(f"/teams/{sample_team.id}")

    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/teams/{sample_team.id}")
    assert get_response.status_code == 404


def test_delete_team_not_found_api(client):
    """Test DELETE /teams/{team_id} with invalid ID"""
    response = client.delete("/teams/999")

    assert response.status_code == 404


def test_get_team_players_api(client, sample_team, sample_players):
    """Test GET /teams/{team_id}/players"""
    response = client.get(f"/teams/{sample_team.id}/players")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 7
    for player in data:
        assert player["team_id"] == sample_team.id


def test_get_team_games_api(client, sample_team, sample_game):
    """Test GET /teams/{team_id}/games"""
    response = client.get(f"/teams/{sample_team.id}/games")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "our_score" in data[0]
    assert "opponent_score" in data[0]


def test_create_team_validation_error(client):
    """Test POST /teams with invalid data"""
    response = client.post("/teams", json={"name": ""})

    assert response.status_code == 422  # Validation error
