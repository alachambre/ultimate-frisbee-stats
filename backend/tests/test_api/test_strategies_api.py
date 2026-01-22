"""
Tests for Strategy API endpoints
"""
import pytest


def test_create_strategy_success(client):
    """Test POST /strategies creates a strategy successfully"""
    response = client.post(
        "/strategies",
        json={
            "name": "Vertical Stack",
            "description": "Standard vertical cutting lanes",
            "category": "offense"
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Vertical Stack"
    assert data["description"] == "Standard vertical cutting lanes"
    assert data["category"] == "offense"
    assert "id" in data
    assert "created_at" in data


def test_create_strategy_minimal(client):
    """Test creating strategy with minimal fields"""
    response = client.post(
        "/strategies",
        json={
            "name": "Zone",
            "category": "defense"
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Zone"
    assert data["description"] is None
    assert data["category"] == "defense"


def test_create_strategy_duplicate_name(client, sample_strategy):
    """Test creating strategy with duplicate name fails"""
    response = client.post(
        "/strategies",
        json={
            "name": sample_strategy.name,  # Duplicate
            "category": "offense"
        }
    )

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_list_strategies_all(client, sample_strategy, sample_defense_strategy):
    """Test GET /strategies returns all strategies"""
    response = client.get("/strategies")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert any(s["id"] == sample_strategy.id for s in data)
    assert any(s["id"] == sample_defense_strategy.id for s in data)


def test_list_strategies_empty(client):
    """Test GET /strategies when no strategies exist"""
    response = client.get("/strategies")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0


def test_list_strategies_filter_offense(client, sample_strategy, sample_defense_strategy):
    """Test filtering strategies by offense category"""
    response = client.get("/strategies?category=offense")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == sample_strategy.id
    assert data[0]["category"] == "offense"


def test_list_strategies_filter_defense(client, sample_strategy, sample_defense_strategy):
    """Test filtering strategies by defense category"""
    response = client.get("/strategies?category=defense")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == sample_defense_strategy.id
    assert data[0]["category"] == "defense"


def test_list_strategies_pagination(client):
    """Test pagination for strategies"""
    # Create 5 strategies
    for i in range(5):
        client.post(
            "/strategies",
            json={
                "name": f"Strategy {i}",
                "category": "offense"
            }
        )

    # Get first 2
    response1 = client.get("/strategies?skip=0&limit=2")
    assert response1.status_code == 200
    data1 = response1.json()
    assert len(data1) == 2

    # Get next 2
    response2 = client.get("/strategies?skip=2&limit=2")
    assert response2.status_code == 200
    data2 = response2.json()
    assert len(data2) == 2

    # No overlap
    ids1 = {s["id"] for s in data1}
    ids2 = {s["id"] for s in data2}
    assert len(ids1 & ids2) == 0


def test_get_strategy_success(client, sample_strategy):
    """Test GET /strategies/{id} returns strategy"""
    response = client.get(f"/strategies/{sample_strategy.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_strategy.id
    assert data["name"] == sample_strategy.name


def test_get_strategy_not_found(client):
    """Test GET /strategies/{id} with invalid ID returns 404"""
    response = client.get("/strategies/999")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_update_strategy_full(client, sample_strategy):
    """Test PUT /strategies/{id} updates all fields"""
    response = client.put(
        f"/strategies/{sample_strategy.id}",
        json={
            "name": "Updated Name",
            "description": "Updated description",
            "category": "defense"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_strategy.id
    assert data["name"] == "Updated Name"
    assert data["description"] == "Updated description"
    assert data["category"] == "defense"


def test_update_strategy_partial(client, sample_strategy):
    """Test partially updating a strategy"""
    original_name = sample_strategy.name

    response = client.put(
        f"/strategies/{sample_strategy.id}",
        json={"description": "New description"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == original_name  # Unchanged
    assert data["description"] == "New description"


def test_update_strategy_not_found(client):
    """Test PUT /strategies/{id} with invalid ID returns 404"""
    response = client.put(
        "/strategies/999",
        json={"name": "New Name"}
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_update_strategy_duplicate_name(client, sample_strategy, sample_defense_strategy):
    """Test updating strategy with duplicate name fails"""
    response = client.put(
        f"/strategies/{sample_strategy.id}",
        json={"name": sample_defense_strategy.name}
    )

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_delete_strategy_success(client, sample_strategy):
    """Test DELETE /strategies/{id} deletes strategy"""
    strategy_id = sample_strategy.id

    # Delete
    response = client.delete(f"/strategies/{strategy_id}")
    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(f"/strategies/{strategy_id}")
    assert get_response.status_code == 404


def test_delete_strategy_not_found(client):
    """Test DELETE /strategies/{id} with invalid ID returns 404"""
    response = client.delete("/strategies/999")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]
