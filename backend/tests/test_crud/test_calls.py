from datetime import datetime, timezone

import pytest
from sqlalchemy.orm import Session

from app import crud, models, schemas


def test_create_stoppage_valid(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="Foul discussion",
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    assert stoppage.id is not None
    assert stoppage.point_id == sample_point.id
    assert stoppage.stoppage_type == "call"
    assert stoppage.call_timestamp.replace(tzinfo=timezone.utc) == stoppage_data.call_timestamp
    assert stoppage.resume_timestamp is None
    assert stoppage.comments == "Foul discussion"
    assert stoppage.created_at is not None


def test_create_stoppage_with_type(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        stoppage_type=schemas.StoppageType.timeout,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="Team timeout",
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    assert stoppage.stoppage_type == "timeout"
    assert stoppage.comments == "Team timeout"


def test_create_stoppage_with_resume(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        resume_timestamp=datetime(2024, 1, 15, 10, 1, 30, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    assert stoppage.id is not None
    assert stoppage.resume_timestamp.replace(tzinfo=timezone.utc) == stoppage_data.resume_timestamp


def test_create_stoppage_invalid_point(db_session: Session):
    stoppage_data = schemas.StoppageCreate(
        point_id=99999,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )

    with pytest.raises(ValueError, match="Point with ID 99999 not found"):
        crud.create_stoppage(db_session, stoppage_data)


def test_create_stoppage_invalid_timestamps(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        resume_timestamp=datetime(2024, 1, 15, 9, 59, 0, tzinfo=timezone.utc),
    )

    with pytest.raises(ValueError, match="resume_timestamp must be after call_timestamp"):
        crud.create_stoppage(db_session, stoppage_data)


def test_get_stoppage(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    created_stoppage = crud.create_stoppage(db_session, stoppage_data)

    retrieved_stoppage = crud.get_stoppage(db_session, created_stoppage.id)

    assert retrieved_stoppage is not None
    assert retrieved_stoppage.id == created_stoppage.id
    assert retrieved_stoppage.point_id == sample_point.id


def test_get_stoppage_not_found(db_session: Session):
    stoppage = crud.get_stoppage(db_session, 99999)
    assert stoppage is None


def test_get_stoppages_by_point(db_session: Session, sample_point: models.Point):
    stoppage_1_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="First stoppage",
    )
    stoppage_2_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="Second stoppage",
    )
    stoppage_3_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 2, 0, tzinfo=timezone.utc),
        comments="Third stoppage (middle time)",
    )

    crud.create_stoppage(db_session, stoppage_1_data)
    crud.create_stoppage(db_session, stoppage_2_data)
    crud.create_stoppage(db_session, stoppage_3_data)

    stoppages = crud.get_stoppages_by_point(db_session, sample_point.id)

    assert len(stoppages) == 3
    assert stoppages[0].comments == "First stoppage"
    assert stoppages[1].comments == "Third stoppage (middle time)"
    assert stoppages[2].comments == "Second stoppage"


def test_get_stoppages_by_point_empty(db_session: Session, sample_point: models.Point):
    stoppages = crud.get_stoppages_by_point(db_session, sample_point.id)
    assert len(stoppages) == 0


def test_update_stoppage_set_resume(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    update_data = schemas.StoppageUpdate(
        resume_timestamp=datetime(2024, 1, 15, 10, 1, 30, tzinfo=timezone.utc)
    )
    updated_stoppage = crud.update_stoppage(db_session, stoppage.id, update_data)

    assert updated_stoppage is not None
    assert updated_stoppage.resume_timestamp.replace(tzinfo=timezone.utc) == update_data.resume_timestamp


def test_update_stoppage_set_comments(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="Initial comment",
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    update_data = schemas.StoppageUpdate(comments="Updated comment")
    updated_stoppage = crud.update_stoppage(db_session, stoppage.id, update_data)

    assert updated_stoppage is not None
    assert updated_stoppage.comments == "Updated comment"


def test_update_stoppage_set_type(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    update_data = schemas.StoppageUpdate(stoppage_type=schemas.StoppageType.injury)
    updated_stoppage = crud.update_stoppage(db_session, stoppage.id, update_data)

    assert updated_stoppage is not None
    assert updated_stoppage.stoppage_type == "injury"


def test_update_stoppage_invalid_timestamp(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    update_data = schemas.StoppageUpdate(
        resume_timestamp=datetime(2024, 1, 15, 9, 59, 0)
    )

    with pytest.raises(ValueError, match="resume_timestamp must be after call_timestamp"):
        crud.update_stoppage(db_session, stoppage.id, update_data)


def test_update_stoppage_not_found(db_session: Session):
    update_data = schemas.StoppageUpdate(comments="New comment")
    result = crud.update_stoppage(db_session, 99999, update_data)
    assert result is None


def test_delete_stoppage(db_session: Session, sample_point: models.Point):
    stoppage_data = schemas.StoppageCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    success = crud.delete_stoppage(db_session, stoppage.id)
    assert success is True

    deleted_stoppage = crud.get_stoppage(db_session, stoppage.id)
    assert deleted_stoppage is None


def test_delete_stoppage_not_found(db_session: Session):
    success = crud.delete_stoppage(db_session, 99999)
    assert success is False


def test_cascade_delete_point_deletes_stoppages(
    db_session: Session,
    sample_game: models.Game,
    sample_players,
):
    player_ids = [player.id for player in sample_players]
    point_data = schemas.PointCreate(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        player_ids=player_ids,
    )
    point = crud.create_point(db_session, point_data)

    stoppage_data = schemas.StoppageCreate(
        point_id=point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    stoppage = crud.create_stoppage(db_session, stoppage_data)

    crud.delete_point(db_session, point.id)

    deleted_stoppage = crud.get_stoppage(db_session, stoppage.id)
    assert deleted_stoppage is None
