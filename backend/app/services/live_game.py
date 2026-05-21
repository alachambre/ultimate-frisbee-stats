from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app import models


def ensure_timezone_aware(dt: Optional[datetime]) -> Optional[datetime]:
    """Convert timezone-naive datetime to timezone-aware UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _validate_transition(
    current_status: models.PointStatusEnum,
    new_status: models.PointStatusEnum,
) -> None:
    if new_status == models.PointStatusEnum.running and current_status not in [
        models.PointStatusEnum.ready,
        models.PointStatusEnum.scored,
    ]:
        raise ValueError(f"Invalid status transition: {current_status.value} -> running")
    if (
        new_status == models.PointStatusEnum.scored
        and current_status != models.PointStatusEnum.running
    ):
        raise ValueError(f"Invalid status transition: {current_status.value} -> scored")
    if new_status == models.PointStatusEnum.completed and current_status not in [
        models.PointStatusEnum.running,
        models.PointStatusEnum.scored,
    ]:
        raise ValueError(
            f"Invalid status transition: {current_status.value} -> completed"
        )


def start_game_clock_for_point(
    db: Session,
    point: models.Point,
    now: Optional[datetime] = None,
) -> None:
    game = db.query(models.Game).filter(models.Game.id == point.game_id).first()
    if game and game.start_datetime is None:
        game.start_datetime = point.start_datetime or now or _now_utc()


def launch_pull(
    db: Session,
    point: models.Point,
    start_datetime: Optional[datetime] = None,
    now: Optional[datetime] = None,
) -> None:
    _validate_transition(point.status, models.PointStatusEnum.running)
    point.status = models.PointStatusEnum.running
    if start_datetime is not None:
        point.start_datetime = start_datetime
    elif point.start_datetime is None:
        point.start_datetime = now or _now_utc()
    start_game_clock_for_point(db, point, now=now)


def restart_point(point: models.Point) -> None:
    _validate_transition(point.status, models.PointStatusEnum.running)
    point.status = models.PointStatusEnum.running


def mark_point_scored(point: models.Point) -> None:
    _validate_transition(point.status, models.PointStatusEnum.scored)
    point.status = models.PointStatusEnum.scored


def mark_point_completed(db: Session, point: models.Point) -> None:
    _validate_transition(point.status, models.PointStatusEnum.completed)
    player_count = len(point.players)
    if player_count != 7:
        db.rollback()
        raise ValueError(
            "Cannot complete point: must have exactly 7 players "
            f"(currently has {player_count})"
        )
    point.status = models.PointStatusEnum.completed


def transition_point_status(
    db: Session,
    point: models.Point,
    new_status: models.PointStatusEnum,
    requested_start_datetime: Optional[datetime] = None,
) -> None:
    if new_status == models.PointStatusEnum.running:
        if point.status == models.PointStatusEnum.ready:
            launch_pull(
                db,
                point,
                start_datetime=requested_start_datetime,
            )
        else:
            restart_point(point)
    elif new_status == models.PointStatusEnum.scored:
        mark_point_scored(point)
    elif new_status == models.PointStatusEnum.completed:
        mark_point_completed(db, point)
    else:
        point.status = new_status


def finish_point(
    point: models.Point,
    won: bool,
    end_datetime: Optional[datetime] = None,
    comments: Optional[str] = None,
    now: Optional[datetime] = None,
) -> None:
    if point.status not in [
        models.PointStatusEnum.running,
        models.PointStatusEnum.scored,
    ]:
        raise ValueError(
            f"Point {point.id} cannot be finished (status: {point.status.value}). "
            "Only running or scored points can be finished."
        )

    point.won = won
    if end_datetime is not None:
        point.end_datetime = end_datetime
    else:
        candidate_end_datetime = now or _now_utc()
        start_aware = ensure_timezone_aware(point.start_datetime)
        if start_aware and candidate_end_datetime <= start_aware:
            candidate_end_datetime = start_aware + timedelta(microseconds=1)
        point.end_datetime = candidate_end_datetime
    point.status = models.PointStatusEnum.completed

    if comments is not None:
        point.comments = comments

    validate_point_timestamps(point)


def cancel_point(db: Session, point: models.Point) -> None:
    if point.status not in [
        models.PointStatusEnum.ready,
        models.PointStatusEnum.running,
    ]:
        raise ValueError(
            "Can only cancel ready or running points. "
            f"Point {point.id} has status: {point.status.value}"
        )

    db.delete(point)


def validate_point_result_allowed(
    point: models.Point,
    won_was_set: bool,
    won: Optional[bool],
    target_status: models.PointStatusEnum,
) -> None:
    if not won_was_set or won is None:
        return
    if target_status not in [
        models.PointStatusEnum.scored,
        models.PointStatusEnum.completed,
    ]:
        raise ValueError("Cannot set won unless point is scored or completed")


def validate_point_timestamps(point: models.Point) -> None:
    if not point.start_datetime or not point.end_datetime:
        return

    start_aware = ensure_timezone_aware(point.start_datetime)
    end_aware = ensure_timezone_aware(point.end_datetime)
    if start_aware and end_aware and end_aware <= start_aware:
        raise ValueError("end_datetime must be after start_datetime")
