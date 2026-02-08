from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import crud, models, schemas


def test_create_stoppage_success(client: TestClient, sample_point: models.Point):
    stoppage_data = {
        "point_id": sample_point.id,
        "call_timestamp": "2024-01-15T10:00:00Z",
        "comments": "Foul discussion",
    }

    response = client.post("/stoppages", json=stoppage_data)

    assert response.status_code == 201
    data = response.json()
    assert data["point_id"] == sample_point.id
    assert data["stoppage_type"] == "call"
    assert data["call_timestamp"] == "2024-01-15T10:00:00Z"
    assert data["resume_timestamp"] is None
    assert data["comments"] == "Foul discussion"
    assert "id" in data
    assert "created_at" in data


def test_create_stoppage_with_type(client: TestClient, sample_point: models.Point):
    stoppage_data = {
        "point_id": sample_point.id,
        "stoppage_type": "timeout",
        "call_timestamp": "2024-01-15T10:00:00Z",
        "comments": "Team timeout",
    }

    response = client.post("/stoppages", json=stoppage_data)

    assert response.status_code == 201
    data = response.json()
    assert data["stoppage_type"] == "timeout"
    assert data["comments"] == "Team timeout"


def test_create_stoppage_with_resume(client: TestClient, sample_point: models.Point):
    stoppage_data = {
        "point_id": sample_point.id,
        "call_timestamp": "2024-01-15T10:00:00Z",
        "resume_timestamp": "2024-01-15T10:01:30Z",
    }

    response = client.post("/stoppages", json=stoppage_data)

    assert response.status_code == 201
    data = response.json()
    assert data["resume_timestamp"] == "2024-01-15T10:01:30Z"


def test_create_stoppage_invalid_point(client: TestClient):
    stoppage_data = {
        "point_id": 99999,
        "call_timestamp": "2024-01-15T10:00:00Z",
    }

    response = client.post("/stoppages", json=stoppage_data)

    assert response.status_code == 400
    assert "Point with ID 99999 not found" in response.json()["detail"]


def test_create_stoppage_invalid_timestamps(client: TestClient, sample_point: models.Point):
    stoppage_data = {
        "point_id": sample_point.id,
        "call_timestamp": "2024-01-15T10:00:00Z",
        "resume_timestamp": "2024-01-15T09:59:00Z",
    }

    response = client.post("/stoppages", json=stoppage_data)

    assert response.status_code == 400
    assert "resume_timestamp must be after call_timestamp" in response.json()["detail"]


def test_get_stoppage_success(client: TestClient, sample_point: models.Point, db_session: Session):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    response = client.get(f"/stoppages/{stoppage.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == stoppage.id
    assert data["point_id"] == sample_point.id


def test_get_stoppage_not_found(client: TestClient):
    response = client.get("/stoppages/99999")

    assert response.status_code == 404
    assert "Stoppage not found" in response.json()["detail"]


def test_update_stoppage_set_resume(client: TestClient, sample_point: models.Point, db_session: Session):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    response = client.put(
        f"/stoppages/{stoppage.id}",
        json={"resume_timestamp": "2024-01-15T10:01:30Z"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["resume_timestamp"] == "2024-01-15T10:01:30Z"


def test_update_stoppage_set_type(client: TestClient, sample_point: models.Point, db_session: Session):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    response = client.put(
        f"/stoppages/{stoppage.id}",
        json={"stoppage_type": "injury"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["stoppage_type"] == "injury"


def test_update_stoppage_set_comments(client: TestClient, sample_point: models.Point, db_session: Session):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="Initial",
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    response = client.put(
        f"/stoppages/{stoppage.id}",
        json={"comments": "Updated comment"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["comments"] == "Updated comment"


def test_update_stoppage_invalid_timestamp(client: TestClient, sample_point: models.Point, db_session: Session):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    response = client.put(
        f"/stoppages/{stoppage.id}",
        json={"resume_timestamp": "2024-01-15T09:59:00Z"},
    )

    assert response.status_code == 400
    assert "resume_timestamp must be after call_timestamp" in response.json()["detail"]


def test_update_stoppage_not_found(client: TestClient):
    response = client.put("/stoppages/99999", json={"comments": "New comment"})

    assert response.status_code == 404
    assert "Stoppage not found" in response.json()["detail"]


def test_delete_stoppage_success(client: TestClient, sample_point: models.Point, db_session: Session):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    response = client.delete(f"/stoppages/{stoppage.id}")

    assert response.status_code == 204

    get_response = client.get(f"/stoppages/{stoppage.id}")
    assert get_response.status_code == 404


def test_delete_stoppage_not_found(client: TestClient):
    response = client.delete("/stoppages/99999")

    assert response.status_code == 404
    assert "Stoppage not found" in response.json()["detail"]


def test_list_point_stoppages(client: TestClient, sample_point: models.Point, db_session: Session):
    stoppage_1_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="First",
    )
    stoppage_2_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        stoppage_type=schemas.StoppageType.timeout,
        call_timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="Second",
    )

    crud.create_stoppage(db_session, stoppage_1_data)
    crud.create_stoppage(db_session, stoppage_2_data)

    response = client.get(f"/stoppages/points/{sample_point.id}/stoppages")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["comments"] == "First"
    assert data[1]["comments"] == "Second"
    assert data[1]["stoppage_type"] == "timeout"


def test_list_point_stoppages_empty(client: TestClient, sample_point: models.Point):
    response = client.get(f"/stoppages/points/{sample_point.id}/stoppages")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
