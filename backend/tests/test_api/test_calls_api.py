import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import crud, schemas, models


def test_create_call_success(client: TestClient, sample_point: models.Point):
    """Test POST /calls creates a call successfully."""
    call_data = {
        "point_id": sample_point.id,
        "call_timestamp": "2024-01-15T10:00:00Z",
        "comments": "Foul discussion"
    }

    response = client.post("/calls", json=call_data)

    assert response.status_code == 201
    data = response.json()
    assert data["point_id"] == sample_point.id
    assert data["call_timestamp"] == "2024-01-15T10:00:00Z"
    assert data["resume_timestamp"] is None
    assert data["comments"] == "Foul discussion"
    assert "id" in data
    assert "created_at" in data


def test_create_call_with_resume(client: TestClient, sample_point: models.Point):
    """Test POST /calls with both call and resume timestamps."""
    call_data = {
        "point_id": sample_point.id,
        "call_timestamp": "2024-01-15T10:00:00Z",
        "resume_timestamp": "2024-01-15T10:01:30Z"
    }

    response = client.post("/calls", json=call_data)

    assert response.status_code == 201
    data = response.json()
    assert data["resume_timestamp"] == "2024-01-15T10:01:30Z"


def test_create_call_invalid_point(client: TestClient):
    """Test POST /calls with invalid point returns 400."""
    call_data = {
        "point_id": 99999,
        "call_timestamp": "2024-01-15T10:00:00Z"
    }

    response = client.post("/calls", json=call_data)

    assert response.status_code == 400
    assert "Point with ID 99999 not found" in response.json()["detail"]


def test_create_call_invalid_timestamps(client: TestClient, sample_point: models.Point):
    """Test POST /calls with resume before call returns 400."""
    call_data = {
        "point_id": sample_point.id,
        "call_timestamp": "2024-01-15T10:00:00Z",
        "resume_timestamp": "2024-01-15T09:59:00Z"
    }

    response = client.post("/calls", json=call_data)

    assert response.status_code == 400
    assert "resume_timestamp must be after call_timestamp" in response.json()["detail"]


def test_get_call_success(client: TestClient, sample_point: models.Point, db_session: Session):
    """Test GET /calls/{id} returns call successfully."""
    # Create a call
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
    )
    call = crud.create_call(db_session, call_data)

    response = client.get(f"/calls/{call.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == call.id
    assert data["point_id"] == sample_point.id


def test_get_call_not_found(client: TestClient):
    """Test GET /calls/{id} with non-existent ID returns 404."""
    response = client.get("/calls/99999")

    assert response.status_code == 404
    assert "Call not found" in response.json()["detail"]


def test_update_call_set_resume(client: TestClient, sample_point: models.Point, db_session: Session):
    """Test PUT /calls/{id} to set resume_timestamp."""
    # Create a call without resume
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
    )
    call = crud.create_call(db_session, call_data)

    update_data = {
        "resume_timestamp": "2024-01-15T10:01:30Z"
    }

    response = client.put(f"/calls/{call.id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["resume_timestamp"] == "2024-01-15T10:01:30Z"


def test_update_call_set_comments(client: TestClient, sample_point: models.Point, db_session: Session):
    """Test PUT /calls/{id} to update comments."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="Initial"
    )
    call = crud.create_call(db_session, call_data)

    update_data = {
        "comments": "Updated comment"
    }

    response = client.put(f"/calls/{call.id}", json=update_data)

    assert response.status_code == 200
    data = response.json()
    assert data["comments"] == "Updated comment"


def test_update_call_invalid_timestamp(client: TestClient, sample_point: models.Point, db_session: Session):
    """Test PUT /calls/{id} with invalid timestamp returns 400."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
    )
    call = crud.create_call(db_session, call_data)

    update_data = {
        "resume_timestamp": "2024-01-15T09:59:00Z"  # Before call
    }

    response = client.put(f"/calls/{call.id}", json=update_data)

    assert response.status_code == 400
    assert "resume_timestamp must be after call_timestamp" in response.json()["detail"]


def test_update_call_not_found(client: TestClient):
    """Test PUT /calls/{id} with non-existent ID returns 404."""
    update_data = {
        "comments": "New comment"
    }

    response = client.put("/calls/99999", json=update_data)

    assert response.status_code == 404
    assert "Call not found" in response.json()["detail"]


def test_delete_call_success(client: TestClient, sample_point: models.Point, db_session: Session):
    """Test DELETE /calls/{id} deletes call successfully."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
    )
    call = crud.create_call(db_session, call_data)

    response = client.delete(f"/calls/{call.id}")

    assert response.status_code == 204

    # Verify it's deleted
    get_response = client.get(f"/calls/{call.id}")
    assert get_response.status_code == 404


def test_delete_call_not_found(client: TestClient):
    """Test DELETE /calls/{id} with non-existent ID returns 404."""
    response = client.delete("/calls/99999")

    assert response.status_code == 404
    assert "Call not found" in response.json()["detail"]


def test_list_point_calls(client: TestClient, sample_point: models.Point, db_session: Session):
    """Test GET /calls/points/{point_id}/calls returns all calls for a point."""
    # Create multiple calls
    call1_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="First"
    )
    call2_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="Second"
    )

    crud.create_call(db_session, call1_data)
    crud.create_call(db_session, call2_data)

    response = client.get(f"/calls/points/{sample_point.id}/calls")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["comments"] == "First"
    assert data[1]["comments"] == "Second"


def test_list_point_calls_empty(client: TestClient, sample_point: models.Point):
    """Test GET /calls/points/{point_id}/calls with no calls returns empty list."""
    response = client.get(f"/calls/points/{sample_point.id}/calls")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
