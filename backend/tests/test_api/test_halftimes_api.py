from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import crud, models, schemas
from tests.builders import GameScenarioBuilder


def _build_game(db_session: Session) -> models.Game:
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Competition A")
        .with_game("Opponent A")
        .build()
    )
    return scenario.game


def _set_started(db_session: Session, game: models.Game) -> models.Game:
    return crud.update_game(
        db_session,
        game.id,
        schemas.GameUpdate(status=schemas.GameStatus.started),
    )


def test_create_halftime_success(client: TestClient, db_session: Session):
    game = _set_started(db_session, _build_game(db_session))

    response = client.post(
        "/halftimes",
        json={
            "game_id": game.id,
            "halftime_timestamp": "2024-01-15T10:45:00Z",
            "comments": "Halftime break",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["game_id"] == game.id
    assert data["halftime_timestamp"] == "2024-01-15T10:45:00Z"
    assert data["comments"] == "Halftime break"
    assert "id" in data
    assert "created_at" in data


def test_create_halftime_game_not_found(client: TestClient):
    response = client.post(
        "/halftimes",
        json={"game_id": 99999, "halftime_timestamp": "2024-01-15T10:45:00Z"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Game with ID 99999 not found"


def test_create_halftime_requires_started_game(client: TestClient, db_session: Session):
    game = _build_game(db_session)

    response = client.post(
        "/halftimes",
        json={"game_id": game.id, "halftime_timestamp": "2024-01-15T10:45:00Z"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Can only create halftime on a started game"


def test_create_halftime_duplicate_for_same_game(client: TestClient, db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    payload = {"game_id": game.id, "halftime_timestamp": "2024-01-15T10:45:00Z"}

    first_response = client.post("/halftimes", json=payload)
    second_response = client.post("/halftimes", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == f"Halftime already exists for game {game.id}"


def test_get_halftime_by_game_success(client: TestClient, db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    halftime = crud.create_halftime(
        db_session,
        schemas.HalftimeCreate(
            game_id=game.id,
            halftime_timestamp=datetime(2024, 1, 15, 10, 45, 0, tzinfo=timezone.utc),
        ),
    )

    response = client.get(f"/halftimes/games/{game.id}/halftime")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == halftime.id
    assert data["game_id"] == game.id


def test_get_halftime_by_game_not_found(client: TestClient):
    response = client.get("/halftimes/games/99999/halftime")

    assert response.status_code == 404
    assert response.json()["detail"] == "Halftime not found"


def test_update_halftime_success(client: TestClient, db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    halftime = crud.create_halftime(
        db_session,
        schemas.HalftimeCreate(
            game_id=game.id,
            halftime_timestamp=datetime(2024, 1, 15, 10, 45, 0, tzinfo=timezone.utc),
        ),
    )

    response = client.put(
        f"/halftimes/{halftime.id}",
        json={
            "halftime_timestamp": "2024-01-15T10:50:00Z",
            "comments": "Delayed restart",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["halftime_timestamp"] == "2024-01-15T10:50:00Z"
    assert data["comments"] == "Delayed restart"


def test_update_halftime_not_found(client: TestClient):
    response = client.put("/halftimes/99999", json={"comments": "Updated"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Halftime not found"


def test_delete_halftime_success(client: TestClient, db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    halftime = crud.create_halftime(
        db_session,
        schemas.HalftimeCreate(
            game_id=game.id,
            halftime_timestamp=datetime(2024, 1, 15, 10, 45, 0, tzinfo=timezone.utc),
        ),
    )

    response = client.delete(f"/halftimes/{halftime.id}")

    assert response.status_code == 204

    get_response = client.get(f"/halftimes/games/{game.id}/halftime")
    assert get_response.status_code == 404


def test_delete_halftime_not_found(client: TestClient):
    response = client.delete("/halftimes/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Halftime not found"
