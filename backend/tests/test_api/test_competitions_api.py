"""
Tests for Competition API endpoints
"""
import pytest
from datetime import date


def test_create_competition(client, sample_team):
    """Test POST /competitions creates a new competition"""
    response = client.post(
        "/competitions",
        json={
            "team_id": sample_team.id,
            "name": "Spring League 2026",
            "description": "Spring ultimate league",
            "start_date": "2026-04-01",
            "end_date": "2026-06-30",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Spring League 2026"
    assert data["team_id"] == sample_team.id
    assert data["status"] == "ongoing"


def test_create_competition_with_roster(client, sample_team, sample_players):
    """Test creating competition with initial player roster"""
    player_ids = [sample_players[0].id, sample_players[1].id]

    response = client.post(
        "/competitions",
        json={
            "team_id": sample_team.id,
            "name": "Tournament",
            "start_date": "2026-05-01",
            "end_date": "2026-05-02",
            "player_ids": player_ids,
        },
    )

    assert response.status_code == 201


def test_create_competition_invalid_team(client):
    """Test creating competition with non-existent team fails"""
    response = client.post(
        "/competitions",
        json={
            "team_id": 9999,
            "name": "Tournament",
            "start_date": "2026-05-01",
            "end_date": "2026-05-02",
        },
    )

    assert response.status_code == 404
    assert "Team not found" in response.json()["detail"]


def test_list_competitions(client, sample_competition):
    """Test GET /competitions returns all competitions"""
    response = client.get("/competitions")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(c["id"] == sample_competition.id for c in data)


def test_list_competitions_by_team(client, sample_team, sample_competition):
    """Test filtering competitions by team"""
    response = client.get(f"/competitions?team_id={sample_team.id}")

    assert response.status_code == 200
    data = response.json()
    assert all(c["team_id"] == sample_team.id for c in data)


def test_get_competition(client, sample_competition):
    """Test GET /competitions/{id} returns competition with players"""
    response = client.get(f"/competitions/{sample_competition.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_competition.id
    assert data["name"] == sample_competition.name
    assert "players" in data  # Should include roster


def test_get_competition_not_found(client):
    """Test getting non-existent competition returns 404"""
    response = client.get("/competitions/9999")

    assert response.status_code == 404


def test_update_competition(client, sample_competition):
    """Test PUT /competitions/{id} updates competition"""
    response = client.put(
        f"/competitions/{sample_competition.id}",
        json={
            "name": "Updated Name",
            "status": "completed",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["status"] == "completed"


def test_update_competition_not_found(client):
    """Test updating non-existent competition returns 404"""
    response = client.put("/competitions/9999", json={"name": "New Name"})

    assert response.status_code == 404


def test_delete_competition(client, sample_competition):
    """Test DELETE /competitions/{id} deletes competition"""
    comp_id = sample_competition.id

    response = client.delete(f"/competitions/{comp_id}")
    assert response.status_code == 204

    # Verify it's deleted
    response = client.get(f"/competitions/{comp_id}")
    assert response.status_code == 404


def test_delete_competition_not_found(client):
    """Test deleting non-existent competition returns 404"""
    response = client.delete("/competitions/9999")

    assert response.status_code == 404


def test_add_players_to_roster(client, sample_competition, sample_players):
    """Test POST /competitions/{id}/players adds players"""
    player_ids = [sample_players[0].id, sample_players[1].id]

    response = client.post(
        f"/competitions/{sample_competition.id}/players",
        json={"player_ids": player_ids},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["players"]) == 2


def test_add_players_invalid_team(client, sample_competition):
    """Test adding players from wrong team fails"""
    from app.crud import create_team, create_player
    from app.schemas import TeamCreate, PlayerCreate, Gender

    # Create different team with a player
    response = client.post("/teams", json={"name": "Other Team"})
    other_team_id = response.json()["id"]

    response = client.post(
        "/players",
        json={"team_id": other_team_id, "name": "Other Player", "number": 99, "gender": "M"},
    )
    other_player_id = response.json()["id"]

    # Try to add player from other team to competition
    response = client.post(
        f"/competitions/{sample_competition.id}/players",
        json={"player_ids": [other_player_id]},
    )

    assert response.status_code == 400
    assert "not found in team" in response.json()["detail"]


def test_remove_players_from_roster(client, sample_competition, sample_players):
    """Test DELETE /competitions/{id}/players removes players"""
    # First add players
    player_ids = [p.id for p in sample_players[:3]]
    client.post(
        f"/competitions/{sample_competition.id}/players",
        json={"player_ids": player_ids},
    )

    # Remove one player (use request instead of delete for JSON body)
    response = client.request(
        "DELETE",
        f"/competitions/{sample_competition.id}/players",
        json={"player_ids": [sample_players[0].id]},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["players"]) == 2


def test_list_competition_players(client, sample_competition, sample_players):
    """Test GET /competitions/{id}/players lists roster"""
    # Add players to roster
    player_ids = [p.id for p in sample_players[:4]]
    client.post(
        f"/competitions/{sample_competition.id}/players",
        json={"player_ids": player_ids},
    )

    response = client.get(f"/competitions/{sample_competition.id}/players")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4


def test_list_competition_games(client, sample_competition, sample_game):
    """Test GET /competitions/{id}/games lists games in competition"""
    response = client.get(f"/competitions/{sample_competition.id}/games")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(g["id"] == sample_game.id for g in data)
    # Should include computed fields
    assert "our_score" in data[0]
    assert "opponent_score" in data[0]
