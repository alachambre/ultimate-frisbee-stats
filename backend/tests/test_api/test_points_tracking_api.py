"""
Test suite for live point tracking workflow.

Tests the complete point tracking lifecycle including:
- Starting and finishing points
- Status transitions (ready → running → scored → completed)
- Getting active/running points
- Canceling points
- Running point validation
"""
import pytest


def test_finish_point_api(client, sample_game, sample_players):
    """Test POST /points/{point_id}/finish"""
    player_ids = [p.id for p in sample_players]

    # Create a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Finish the point
    client.put(f"/points/{point_id}", json={"status": "running"})
    response = client.post(f"/points/{point_id}/finish", json={"won": True})

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == point_id
    assert data["status"] == "completed"
    assert data["won"] is True
    assert data["start_datetime"] is not None
    assert data["end_datetime"] is not None


def test_finish_point_not_active_api(client, sample_game, sample_players):
    """Test finishing an already completed point fails"""
    player_ids = [p.id for p in sample_players]

    # Create and finish a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]
    # Transition to running and finish the point
    client.put(f"/points/{point_id}", json={"status": "running"})
    client.post(f"/points/{point_id}/finish", json={"won": True})

    # Try to finish again (already completed)
    response = client.post(f"/points/{point_id}/finish", json={"won": False})

    assert response.status_code == 400
    assert "cannot be finished" in response.json()["detail"].lower()


def test_finish_point_not_found_api(client):
    """Test finishing a non-existent point"""
    response = client.post("/points/999/finish", json={"won": True})

    assert response.status_code == 404


def test_finish_point_with_comments_api(client, sample_game, sample_players):
    """Test POST /points/{id}/finish with comments"""
    player_ids = [p.id for p in sample_players]

    # Create point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Transition to running
    client.put(f"/points/{point_id}", json={"status": "running"})

    # Finish with comments
    response = client.post(f"/points/{point_id}/finish", json={
        "won": True,
        "comments": "Great teamwork!"
    })

    assert response.status_code == 200
    data = response.json()
    assert data["comments"] == "Great teamwork!"
    assert data["won"] is True
    assert data["status"] == "completed"


def test_get_running_point_game_not_found_api(client):
    """Test getting running point for non-existent game"""
    response = client.get("/points/games/999/running")

    assert response.status_code == 404
    assert "game not found" in response.json()["detail"].lower()


def test_get_running_point_api(client, sample_game, sample_players):
    """Test GET /points/games/{game_id}/running"""
    player_ids = [p.id for p in sample_players]

    # No running point initially
    response = client.get(f"/points/games/{sample_game.id}/running")
    assert response.status_code == 404

    # Create a point (ready status)
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Still no running point
    response = client.get(f"/points/games/{sample_game.id}/running")
    assert response.status_code == 404

    # Transition to running
    client.put(f"/points/{point_id}", json={"status": "running"})

    # Should now return the running point
    response = client.get(f"/points/games/{sample_game.id}/running")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == point_id
    assert data["status"] == "running"

    # Finish the point
    client.put(f"/points/{point_id}", json={"status": "running"})
    client.post(f"/points/{point_id}/finish", json={"won": True})

    # Should return 404 again
    response = client.get(f"/points/games/{sample_game.id}/running")
    assert response.status_code == 404


def test_cannot_create_multiple_active_points_api(client, sample_game, sample_players):
    """Test that only one active point can exist per game"""
    player_ids = [p.id for p in sample_players]

    # Create first point
    response1 = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    assert response1.status_code == 201
    point1_id = response1.json()["id"]
    # Transition first point to running
    client.put(f"/points/{point1_id}", json={"status": "running"})


    # Try to create another point without finishing the first
    response2 = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": False,
        "player_ids": player_ids
    })
    assert response2.status_code == 400
    assert "already has a running point" in response2.json()["detail"].lower()


def test_cancel_point_api(client, sample_game, sample_players):
    """Test DELETE /points/{point_id}/cancel"""
    player_ids = [p.id for p in sample_players]

    # Create a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Cancel the point
    response = client.delete(f"/points/{point_id}/cancel")

    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/points/{point_id}")
    assert get_response.status_code == 404


def test_cancel_point_completed_fails_api(client, sample_game, sample_players):
    """Test that canceling a completed point fails"""
    player_ids = [p.id for p in sample_players]

    # Create and finish a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]
    client.put(f"/points/{point_id}", json={"status": "running"})
    client.post(f"/points/{point_id}/finish", json={"won": True})

    # Try to cancel completed point
    response = client.delete(f"/points/{point_id}/cancel")

    assert response.status_code == 400
    assert "can only cancel ready or running" in response.json()["detail"].lower()


def test_cancel_point_not_found_api(client):
    """Test canceling a non-existent point"""
    response = client.delete("/points/999/cancel")

    assert response.status_code == 404


def test_point_status_transitions_api(client, sample_game, sample_players):
    """Test 4-status lifecycle via API"""
    player_ids = [p.id for p in sample_players]

    # Create point (ready status)
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]
    assert create_response.json()["status"] == "ready"

    # Transition to running
    response = client.put(f"/points/{point_id}", json={"status": "running"})
    assert response.status_code == 200
    assert response.json()["status"] == "running"

    # Transition to scored
    response = client.put(f"/points/{point_id}", json={"status": "scored"})
    assert response.status_code == 200
    assert response.json()["status"] == "scored"

    # Finish to completed
    response = client.post(f"/points/{point_id}/finish", json={"won": True})
    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_cannot_create_point_when_running_point_exists_api(client, sample_game, sample_players):
    """Test that no new points can be created when a running point exists"""
    player_ids = [p.id for p in sample_players]

    # Create first point and transition to running
    response1 = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point1_id = response1.json()["id"]
    client.put(f"/points/{point1_id}", json={"status": "running"})

    # Try to create second point (should fail - running point exists)
    response2 = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": False,
        "player_ids": player_ids
    })
    assert response2.status_code == 400
    assert "already has a running point" in response2.json()["detail"].lower()
