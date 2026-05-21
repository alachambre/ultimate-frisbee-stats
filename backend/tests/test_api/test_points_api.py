import pytest


def test_create_point_api(client, sample_game, sample_players):
    """Test POST /points creates ready point"""
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
    assert data["won"] is None  # Non-completed points have no winner yet
    assert data["status"] == "ready"
    assert data["start_datetime"] is None  # Not set until transitioning to 'running'
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

    # Transition to running, then finish first point
    client.put(f"/points/{point1_id}", json={"status": "running"})
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
    """Test POST /points with wrong number of players is now allowed"""
    # Only 5 players instead of 7 - now allowed during creation
    player_ids = [p.id for p in sample_players[:5]]

    response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })

    assert response.status_code == 201  # Allowed - validation happens at completion
    data = response.json()
    assert len(data["players"]) == 5


def test_create_point_invalid_player_ids_api(client, sample_game):
    """Test POST /points with non-existent player IDs"""
    player_ids = [999, 998, 997, 996, 995, 994, 993]

    response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })

    assert response.status_code == 400
    assert "player IDs not found" in response.json()["detail"]


def test_create_point_with_strategy_api(client, sample_game, sample_players, sample_strategy):
    """Test POST /points with strategy_id"""
    player_ids = [p.id for p in sample_players]
    response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "strategy_id": sample_strategy.id,
        "player_ids": player_ids
    })

    assert response.status_code == 201
    data = response.json()
    assert data["strategy_id"] == sample_strategy.id


def test_create_point_with_optional_field_metadata_api(client, sample_game, sample_players, sample_strategy):
    """Test POST /points with optional field metadata (field_side, pull, strategy, comments)"""
    player_ids = [p.id for p in sample_players]
    response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "field_side": "home",
        "pull": True,
        "strategy_id": sample_strategy.id,
        "comments": "Opening point",
        "player_ids": player_ids
    })

    assert response.status_code == 201
    data = response.json()
    assert data["field_side"] == "home"
    assert data["pull"] is True
    assert data["strategy_id"] == sample_strategy.id
    assert data["comments"] == "Opening point"


def test_create_point_invalid_strategy_api(client, sample_game, sample_players):
    """Test POST /points with invalid strategy_id"""
    player_ids = [p.id for p in sample_players]
    response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "strategy_id": 999,  # Non-existent
        "player_ids": player_ids
    })

    assert response.status_code == 404
    assert "strategy not found" in response.json()["detail"].lower()


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
    assert data["our_turnovers"] == 0
    assert data["opponent_turnovers"] == 0


def test_get_point_api_includes_turnover_summary(client, sample_game, sample_players, db_session):
    from datetime import datetime, timezone
    from app import models

    player_ids = [p.id for p in sample_players]

    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": False,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    client.put(f"/points/{point_id}", json={"status": "running"})
    client.post(f"/points/{point_id}/finish", json={"won": True})

    db_session.add_all(
        [
            models.Turnover(
                point_id=point_id,
                timestamp=datetime(2024, 1, 1, 10, 1, 0, tzinfo=timezone.utc),
            ),
            models.Turnover(
                point_id=point_id,
                timestamp=datetime(2024, 1, 1, 10, 1, 30, tzinfo=timezone.utc),
            ),
        ]
    )
    db_session.commit()

    response = client.get(f"/points/{point_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["our_turnovers"] == 1
    assert data["opponent_turnovers"] == 1


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
    client.put(f"/points/{point_id}", json={"status": "running"})
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


def test_update_point_allows_partial_line_before_completion_api(
    client,
    sample_game,
    sample_players,
):
    """Test PUT /points/{point_id} can edit a line before completion."""
    player_ids = [p.id for p in sample_players]

    # Create a point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Update with only 5 players while the point is still editable.
    response = client.put(f"/points/{point_id}", json={
        "starting_on_offense": True,
        "player_ids": player_ids[:5]
    })

    assert response.status_code == 200
    data = response.json()
    assert len(data["players"]) == 5


def test_update_point_not_found_api(client):
    """Test PUT /points/{point_id} with invalid ID"""
    response = client.put("/points/999", json={
        "starting_on_offense": False,
        "won": False
    })

    assert response.status_code == 404


def test_update_point_optional_field_metadata_api(client, sample_game, sample_players, sample_strategy):
    """Test PUT /points/{id} with optional field metadata (field_side, pull, strategy, comments)"""
    player_ids = [p.id for p in sample_players]

    # Create point
    create_response = client.post("/points", json={
        "game_id": sample_game.id,
        "starting_on_offense": True,
        "player_ids": player_ids
    })
    point_id = create_response.json()["id"]

    # Update with new fields
    response = client.put(f"/points/{point_id}", json={
        "field_side": "away",
        "pull": False,
        "strategy_id": sample_strategy.id,
        "comments": "Changed strategy"
    })

    assert response.status_code == 200
    data = response.json()
    assert data["field_side"] == "away"
    assert data["pull"] is False
    assert data["strategy_id"] == sample_strategy.id
    assert data["comments"] == "Changed strategy"


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
        client.put(f"/points/{point_id}", json={"status": "running"})
        client.post(f"/points/{point_id}/finish", json={"won": True})

    # Create and finish 2 points opponent won
    for _ in range(2):
        response = client.post("/points", json={
            "game_id": sample_game.id,
            "starting_on_offense": False,
            "player_ids": player_ids
        })
        point_id = response.json()["id"]
        client.put(f"/points/{point_id}", json={"status": "running"})
        client.post(f"/points/{point_id}/finish", json={"won": False})

    # Check game score
    response = client.get(f"/games/{sample_game.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["our_score"] == 3
    assert data["opponent_score"] == 2
    assert len(data["points"]) == 5
