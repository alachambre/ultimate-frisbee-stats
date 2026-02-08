from datetime import datetime, timezone

import pytest
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


def test_create_halftime_valid(db_session: Session):
    game = _set_started(db_session, _build_game(db_session))

    halftime_data = schemas.HalftimeCreate(
        game_id=game.id,
        halftime_timestamp=datetime(2024, 1, 15, 10, 45, 0, tzinfo=timezone.utc),
        comments="Halftime break",
    )
    halftime = crud.create_halftime(db_session, halftime_data)

    assert halftime.id is not None
    assert halftime.game_id == game.id
    assert halftime.halftime_timestamp.replace(tzinfo=timezone.utc) == halftime_data.halftime_timestamp
    assert halftime.comments == "Halftime break"
    assert halftime.created_at is not None


def test_create_halftime_game_not_found(db_session: Session):
    halftime_data = schemas.HalftimeCreate(game_id=99999)

    with pytest.raises(ValueError, match="Game with ID 99999 not found"):
        crud.create_halftime(db_session, halftime_data)


def test_create_halftime_requires_started_game(db_session: Session):
    game = _build_game(db_session)
    halftime_data = schemas.HalftimeCreate(game_id=game.id)

    with pytest.raises(ValueError, match="Can only create halftime on a started game"):
        crud.create_halftime(db_session, halftime_data)


def test_create_halftime_unique_per_game(db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    halftime_data = schemas.HalftimeCreate(game_id=game.id)

    crud.create_halftime(db_session, halftime_data)
    with pytest.raises(ValueError, match=f"Halftime already exists for game {game.id}"):
        crud.create_halftime(db_session, halftime_data)


def test_get_halftime(db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    created_halftime = crud.create_halftime(db_session, schemas.HalftimeCreate(game_id=game.id))

    retrieved_halftime = crud.get_halftime(db_session, created_halftime.id)

    assert retrieved_halftime is not None
    assert retrieved_halftime.id == created_halftime.id
    assert retrieved_halftime.game_id == game.id


def test_get_halftime_not_found(db_session: Session):
    halftime = crud.get_halftime(db_session, 99999)
    assert halftime is None


def test_get_halftime_by_game(db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    created_halftime = crud.create_halftime(db_session, schemas.HalftimeCreate(game_id=game.id))

    retrieved_halftime = crud.get_halftime_by_game(db_session, game.id)

    assert retrieved_halftime is not None
    assert retrieved_halftime.id == created_halftime.id
    assert retrieved_halftime.game_id == game.id


def test_get_halftime_by_game_not_found(db_session: Session):
    halftime = crud.get_halftime_by_game(db_session, 99999)
    assert halftime is None


def test_update_halftime(db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    halftime = crud.create_halftime(db_session, schemas.HalftimeCreate(game_id=game.id))

    new_timestamp = datetime(2024, 1, 15, 10, 50, 0, tzinfo=timezone.utc)
    updated_halftime = crud.update_halftime(
        db_session,
        halftime.id,
        schemas.HalftimeUpdate(
            halftime_timestamp=new_timestamp,
            comments="Delayed restart",
        ),
    )

    assert updated_halftime is not None
    assert updated_halftime.halftime_timestamp.replace(tzinfo=timezone.utc) == new_timestamp
    assert updated_halftime.comments == "Delayed restart"


def test_update_halftime_not_found(db_session: Session):
    updated_halftime = crud.update_halftime(
        db_session,
        99999,
        schemas.HalftimeUpdate(comments="No-op"),
    )
    assert updated_halftime is None


def test_delete_halftime(db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    halftime = crud.create_halftime(db_session, schemas.HalftimeCreate(game_id=game.id))

    success = crud.delete_halftime(db_session, halftime.id)

    assert success is True
    assert crud.get_halftime(db_session, halftime.id) is None


def test_delete_halftime_not_found(db_session: Session):
    success = crud.delete_halftime(db_session, 99999)
    assert success is False


def test_cascade_delete_game_deletes_halftime(db_session: Session):
    game = _set_started(db_session, _build_game(db_session))
    halftime = crud.create_halftime(db_session, schemas.HalftimeCreate(game_id=game.id))

    crud.delete_game(db_session, game.id)

    assert crud.get_halftime(db_session, halftime.id) is None
