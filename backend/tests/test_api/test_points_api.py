import pytest


def test_create_point_api(client, sample_game, sample_players):
    """Test POST /points creates active point"""
    player_ids = [p.id for p in sample_players]
    response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })

    assert response.status_code == 201
    data = response.json()
    assert data["game_id"] == sample_game.id
    assert data["point_number"] == 1
    assert data["starting_on_offense"] is True
    assert data["won"] is None  # Active points have no winner yet
    assert data["status"] == "active"
    assert data["start_datetime"] is not None
    assert data["end_datetime"] is None
    assert len(data["players"]) == 7
    assert "id" in data


def test_create_point_auto_increment_api(client, sample_game, sample_players):
    """Test that point numbers auto-increment via API"""
    player_ids = [p.id for p in sample_players]

    # Create and finish first point
    response1 = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    assert response1.status_code == 201
    assert response1.json()["point_number"] == 1
    point1_id = response1.json()["id"]

    # Finish first point
    client.post(f"/points/{point1_id}/finish", json={"won": True})

    # Create second point
    response2 = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": False,
        "player_ids": player_ids
    })
    assert response2.status_code == 201
    assert response2.json()["point_number"] == 2


def test_create_point_game_not_found_api(client, sample_players):
    """Test POST /points with invalid game_id"""
    player_ids = [p.id for p in sample_players]
    response = client.post("/points", json={
        "game_id": 999,
        "starting_on_offense": True,
        "player_ids": player_ids
    })

    assert response.status_code == 404
    assert "game not found" in response.json()["detail"].lower()


def test_create_point_finished_game_api(client, sample_game, sample_players):
    """Test that you cannot add points to a finished game"""
    player_ids = [p.id for p in sample_players]

    # Finish the game
    client.post(f"/games/{sample_game.id}/finish")

    # Try to add a point
    response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })

    assert response.status_code == 400
    assert "ended game" in response.json()["detail"].lower()


def test_create_point_wrong_player_count_api(client, sample_game, sample_players):
    """Test POST /points with wrong number of players"""
    # Only 5 players instead of 7
    player_ids = [p.id for p in sample_players[:5]]

    response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })

    assert response.status_code == 422  # Pydantic validation error


def test_create_point_invalid_player_ids_api(client, sample_game):
    """Test POST /points with non-existent player IDs"""
    player_ids = [999, 998, 997, 996, 995, 994, 993]

    response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })

    assert response.status_code == 400
    assert "7 players" in response.json()["detail"]


def test_get_point_api(client, sample_game, sample_players):
    """Test GET /points/{point_id}"""
    player_ids = [p.id for p in sample_players]

    # Create a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Get the point
    response = client.get(f"/points/{point_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == point_id
    assert len(data["players"]) == 7


def test_get_point_not_found_api(client):
    """Test GET /points/{point_id} with invalid ID"""
    response = client.get("/points/999")

    assert response.status_code == 404


def test_update_point_api(client, sample_game, sample_players):
    """Test PUT /points/{point_id}"""
    player_ids = [p.id for p in sample_players]

    # Create a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Finish it first
    client.post(f"/points/{point_id}/finish", json={"won": True})

    # Update the point
    response = client.put(f"/points/{point_id}", json={
        "starting_on_offense": False,
        "won": False
    })

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == point_id
    assert data["starting_on_offense"] is False
    assert data["won"] is False


def test_update_point_change_players_api(client, sample_game, sample_players):
    """Test PUT /points/{point_id} to change player lineup"""
    player_ids = [p.id for p in sample_players]

    # Create a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Update with different player order (can change lineup while active)
    new_player_ids = list(reversed(player_ids))
    response = client.put(f"/points/{point_id}", json={
        "starting_on_offense": True,
        "player_ids": new_player_ids
    })

    assert response.status_code == 200
    data = response.json()
    returned_player_ids = sorted([p["id"] for p in data["players"]])
    assert returned_player_ids == sorted(new_player_ids)


def test_update_point_wrong_player_count_api(client, sample_game, sample_players):
    """Test PUT /points/{point_id} with wrong player count"""
    player_ids = [p.id for p in sample_players]

    # Create a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Try to update with only 5 players
    response = client.put(f"/points/{point_id}", json={
        "starting_on_offense": True,
        "player_ids": player_ids[:5]
    })

    assert response.status_code == 422


def test_update_point_not_found_api(client):
    """Test PUT /points/{point_id} with invalid ID"""
    response = client.put("/points/999", json={
        "starting_on_offense": False,
        "won": False
    })

    assert response.status_code == 404


def test_delete_point_api(client, sample_game, sample_players):
    """Test DELETE /points/{point_id}"""
    player_ids = [p.id for p in sample_players]

    # Create a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Delete the point
    response = client.delete(f"/points/{point_id}")

    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/points/{point_id}")
    assert get_response.status_code == 404


def test_delete_point_not_found_api(client):
    """Test DELETE /points/{point_id} with invalid ID"""
    response = client.delete("/points/999")

    assert response.status_code == 404


def test_game_score_updates_with_points_api(client, sample_game, sample_players):
    """Test that game score reflects finished points"""
    player_ids = [p.id for p in sample_players]

    # Create and finish 3 points we won
    for _ in range(3):
        response = client.post("/points", json={
            "game_id": sample_game.id,
            "starting_on_offense": True,
            "player_ids": player_ids
        })
        point_id = response.json()["id"]
        client.post(f"/points/{point_id}/finish", json={"won": True})

    # Create and finish 2 points opponent won
    for _ in range(2):
        response = client.post("/points", json={
            "game_id": sample_game.id,
            "starting_on_offense": False,
            "player_ids": player_ids
        })
        point_id = response.json()["id"]
        client.post(f"/points/{point_id}/finish", json={"won": False})

    # Check game score
    response = client.get(f"/games/{sample_game.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["our_score"] == 3
    assert data["opponent_score"] == 2
    assert len(data["points"]) == 5


# ============================================
# Phase 3: Live Point Tracking API Tests
# ============================================

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
    client.post(f"/points/{point_id}/finish", json={"won": True})

    # Try to finish again
    response = client.post(f"/points/{point_id}/finish", json={"won": False})

    assert response.status_code == 400
    assert "not active" in response.json()["detail"].lower()


def test_finish_point_not_found_api(client):
    """Test finishing a non-existent point"""
    response = client.post("/points/999/finish", json={"won": True})

    assert response.status_code == 404


def test_get_active_point_api(client, sample_game, sample_players):
    """Test GET /points/games/{game_id}/active"""
    player_ids = [p.id for p in sample_players]

    # No active point initially
    response = client.get(f"/points/games/{sample_game.id}/active")
    assert response.status_code == 404

    # Create a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Should now return the active point
    response = client.get(f"/points/games/{sample_game.id}/active")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == point_id
    assert data["status"] == "active"

    # Finish the point
    client.post(f"/points/{point_id}/finish", json={"won": True})

    # Should now return 404
    response = client.get(f"/points/games/{sample_game.id}/active")
    assert response.status_code == 404


def test_get_active_point_game_not_found_api(client):
    """Test getting active point for non-existent game"""
    response = client.get("/points/games/999/active")

    assert response.status_code == 404
    assert "game not found" in response.json()["detail"].lower()


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

    # Try to create another point without finishing the first
    response2 = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": False,
        "player_ids": player_ids
    })
    assert response2.status_code == 400
    assert "already has an active point" in response2.json()["detail"].lower()


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
    client.post(f"/points/{point_id}/finish", json={"won": True})

    # Try to cancel completed point
    response = client.delete(f"/points/{point_id}/cancel")

    assert response.status_code == 400
    assert "can only cancel active points" in response.json()["detail"].lower()


def test_cancel_point_not_found_api(client):
    """Test canceling a non-existent point"""
    response = client.delete("/points/999/cancel")

    assert response.status_code == 404
