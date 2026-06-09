from sqlalchemy import case, func
from sqlalchemy.orm import Query, Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import Dict, List, Optional, Sequence
from datetime import datetime, timedelta, timezone
from app import models, schemas
from app.crud.statistics_key_moments import build_timeline_markers_and_key_moments
from app.logging_config import get_logger

logger = get_logger("crud.games")


def _to_utc_naive(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _current_utc_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_game(db: Session, game: schemas.GameCreate) -> models.Game:
    try:
        db_game = models.Game(
            competition_id=game.competition_id,
            opponent_name=game.opponent_name,
            date=_to_utc_naive(game.date) or _current_utc_naive(),
            status=models.GameStatusEnum.ready,
            comments=game.comments
        )

        # Add players to game if provided (must be from competition roster)
        if game.player_ids:
            from app.crud.competitions import get_competition
            competition = get_competition(db, game.competition_id)
            if competition:
                roster_player_ids = {p.id for p in competition.players}
                valid_player_ids = [pid for pid in game.player_ids if pid in roster_player_ids]
                if valid_player_ids:
                    players = db.query(models.Player).filter(
                        models.Player.id.in_(valid_player_ids)
                    ).all()
                    db_game.players = players

        db.add(db_game)
        db.commit()
        db.refresh(db_game)
        return db_game
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(
            f"Database error creating game for competition {game.competition_id}: {e}",
            exc_info=True
        )
        raise


def get_game(db: Session, game_id: int) -> Optional[models.Game]:
    return db.query(models.Game).filter(models.Game.id == game_id).first()


def get_all_games(db: Session) -> List[models.Game]:
    return db.query(models.Game).order_by(models.Game.date.desc()).all()


def get_game_scores_by_game_ids(
    db: Session,
    game_ids: Sequence[int],
) -> Dict[int, tuple[int, int]]:
    """Calculate scores for multiple games with a single grouped query."""
    normalized_game_ids = sorted(set(game_ids))
    if not normalized_game_ids:
        return {}

    score_rows = (
        db.query(
            models.Point.game_id,
            func.coalesce(
                func.sum(case((models.Point.won.is_(True), 1), else_=0)),
                0,
            ).label("our_score"),
            func.count(models.Point.id).label("completed_points"),
        )
        .filter(
            models.Point.game_id.in_(normalized_game_ids),
            models.Point.status == models.PointStatusEnum.completed,
        )
        .group_by(models.Point.game_id)
        .all()
    )

    return {
        row.game_id: (
            int(row.our_score),
            int(row.completed_points) - int(row.our_score),
        )
        for row in score_rows
    }


def _game_with_score_payload(
    game: models.Game,
    scores_by_game_id: Dict[int, tuple[int, int]],
) -> dict:
    our_score, opponent_score = scores_by_game_id.get(game.id, (0, 0))
    competition = game.competition
    return {
        "id": game.id,
        "competition_id": game.competition_id,
        "opponent_name": game.opponent_name,
        "date": game.date,
        "status": game.status,
        "start_datetime": game.start_datetime,
        "end_datetime": game.end_datetime,
        "comments": game.comments,
        "created_at": game.created_at,
        "our_score": our_score,
        "opponent_score": opponent_score,
        "team_name": (
            competition.team.name
            if competition and competition.team
            else "Unknown"
        ),
        "competition_name": competition.name if competition else "Unknown",
    }


def _games_with_scores(db: Session, query: Query) -> List[dict]:
    games = (
        query.options(
            joinedload(models.Game.competition).joinedload(models.Competition.team),
        )
        .all()
    )
    scores_by_game_id = get_game_scores_by_game_ids(db, [game.id for game in games])
    return [_game_with_score_payload(game, scores_by_game_id) for game in games]


def get_all_games_with_scores(db: Session) -> List[dict]:
    return _games_with_scores(
        db,
        db.query(models.Game).order_by(models.Game.date.desc()),
    )


def get_games_by_competition(db: Session, competition_id: int) -> List[models.Game]:
    return db.query(models.Game).filter(
        models.Game.competition_id == competition_id
    ).order_by(models.Game.date.desc()).all()


def get_games_by_competition_with_scores(
    db: Session,
    competition_id: int,
) -> List[dict]:
    return _games_with_scores(
        db,
        db.query(models.Game)
        .filter(models.Game.competition_id == competition_id)
        .order_by(models.Game.date.desc()),
    )


def get_games_by_team(db: Session, team_id: int) -> List[models.Game]:
    """Get all games for a team across all competitions"""
    return db.query(models.Game).join(
        models.Competition
    ).filter(
        models.Competition.team_id == team_id
    ).order_by(models.Game.date.desc()).all()


def get_games_by_team_with_scores(db: Session, team_id: int) -> List[dict]:
    """Get all games for a team across all competitions with grouped scores."""
    return _games_with_scores(
        db,
        db.query(models.Game)
        .join(models.Competition)
        .filter(models.Competition.team_id == team_id)
        .order_by(models.Game.date.desc()),
    )


def update_game(db: Session, game_id: int, game_update: schemas.GameUpdate) -> Optional[models.Game]:
    db_game = get_game(db, game_id)
    if db_game:
        try:
            if game_update.opponent_name is not None:
                db_game.opponent_name = game_update.opponent_name
            if game_update.date is not None:
                db_game.date = _to_utc_naive(game_update.date)
            if game_update.status is not None:
                # Convert GameStatus enum to GameStatusEnum
                new_status = models.GameStatusEnum[game_update.status.value]
                old_status = db_game.status

                # Set end timestamp when game ends
                if new_status == models.GameStatusEnum.ended and old_status == models.GameStatusEnum.started:
                    end_datetime = datetime.now(timezone.utc)
                    if db_game.start_datetime:
                        start_datetime = db_game.start_datetime
                        if start_datetime.tzinfo is None:
                            start_datetime = start_datetime.replace(tzinfo=timezone.utc)
                        if end_datetime <= start_datetime:
                            end_datetime = start_datetime + timedelta(microseconds=1)
                    db_game.end_datetime = end_datetime

                db_game.status = new_status
            if game_update.comments is not None:
                db_game.comments = game_update.comments
            db.commit()
            db.refresh(db_game)
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(
                f"Database error updating game {game_id}: {e}",
                exc_info=True
            )
            raise
    return db_game


def finish_game(db: Session, game_id: int) -> Optional[models.Game]:
    return update_game(db, game_id, schemas.GameUpdate(status=schemas.GameStatus.ended))


def delete_game(db: Session, game_id: int) -> bool:
    db_game = get_game(db, game_id)
    if db_game:
        db.delete(db_game)
        db.commit()
        return True
    return False


def get_game_score(db: Session, game_id: int) -> tuple[int, int]:
    """Calculate the score for a game (our_score, opponent_score)"""
    return get_game_scores_by_game_ids(db, [game_id]).get(game_id, (0, 0))


def _point_reference_timestamp(point) -> Optional[datetime]:
    return point.end_datetime or point.start_datetime or point.created_at


def _point_duration_seconds(point) -> int:
    if point.start_datetime and point.end_datetime:
        return max(0, int((point.end_datetime - point.start_datetime).total_seconds()))
    return 0


def _get_halftime_after_point_number(completed_points: List[models.Point], halftime) -> Optional[int]:
    if halftime is None:
        return None

    points_before_halftime = [
        point.point_number
        for point in completed_points
        if (
            (reference_timestamp := _point_reference_timestamp(point)) is not None
            and reference_timestamp <= halftime.halftime_timestamp
        )
    ]
    return max(points_before_halftime) if points_before_halftime else None


def _build_game_history_timeline(
    game_status: models.GameStatusEnum,
    game_id: int,
    points: List[models.Point],
    halftime,
) -> dict:
    completed_points = sorted(
        [
            point
            for point in points
            if point.status == models.PointStatusEnum.completed and point.won is not None
        ],
        key=lambda point: (
            point.point_number,
            _point_reference_timestamp(point) or datetime.min,
            point.id,
        ),
    )

    our_score = 0
    opponent_score = 0
    timeline_points = []
    for point in completed_points:
        if point.won is True:
            our_score += 1
        else:
            opponent_score += 1

        timeline_points.append({
            "point_id": point.id,
            "point_number": point.point_number,
            "starting_on_offense": point.starting_on_offense,
            "won": point.won is True,
            "field_side": point.field_side,
            "duration_seconds": _point_duration_seconds(point),
            "our_turnovers": getattr(point, "our_turnovers", 0),
            "opponent_turnovers": getattr(point, "opponent_turnovers", 0),
            "our_score_after": our_score,
            "opponent_score_after": opponent_score,
        })

    halftime_after_point_number = _get_halftime_after_point_number(
        completed_points,
        halftime,
    )
    markers_by_point_id, key_moments = build_timeline_markers_and_key_moments(
        timeline_points,
        halftime_after_point_number=halftime_after_point_number,
        final_point_id=completed_points[-1].id if completed_points else None,
        is_game_ended=game_status == models.GameStatusEnum.ended,
    )
    for point in timeline_points:
        point["markers"] = markers_by_point_id.get(point["point_id"], [])

    return {
        "game_id": game_id,
        "halftime_after_point_number": halftime_after_point_number,
        "points": timeline_points,
        "key_moments": key_moments,
    }


def get_game_detail(db: Session, game_id: int) -> Optional[dict]:
    """Get complete game information with score and all points"""
    from app.crud.points import get_points_by_game
    from app.crud.competitions import get_competition
    game = get_game(db, game_id)
    if not game:
        return None

    points = get_points_by_game(db, game_id)
    our_score, opponent_score = get_game_score(db, game_id)
    competition = get_competition(db, game.competition_id)
    team_name = competition.team.name if competition and competition.team else "Unknown"
    competition_name = competition.name if competition else "Unknown"

    return {
        "id": game.id,
        "competition_id": game.competition_id,
        "opponent_name": game.opponent_name,
        "date": game.date,
        "status": game.status,
        "comments": game.comments,
        "start_datetime": game.start_datetime,
        "end_datetime": game.end_datetime,
        "created_at": game.created_at,
        "our_score": our_score,
        "opponent_score": opponent_score,
        "team_name": team_name,
        "competition_name": competition_name,
        "points": points,
        "players": game.players,
        "halftime": game.halftime,
        "timeline": _build_game_history_timeline(game.status, game.id, points, game.halftime),
    }


def add_players_to_game(db: Session, game_id: int, player_ids: List[int]) -> Optional[models.Game]:
    """Add players to game (must be from competition roster)"""
    from app.crud.competitions import get_competition
    db_game = get_game(db, game_id)
    if db_game:
        competition = get_competition(db, db_game.competition_id)
        if competition:
            # Only add players from competition roster
            roster_player_ids = {p.id for p in competition.players}
            valid_player_ids = [pid for pid in player_ids if pid in roster_player_ids]

            if valid_player_ids:
                players = db.query(models.Player).filter(
                    models.Player.id.in_(valid_player_ids)
                ).all()

                # Add only new players (avoid duplicates)
                existing_player_ids = {p.id for p in db_game.players}
                for player in players:
                    if player.id not in existing_player_ids:
                        db_game.players.append(player)

                db.commit()
                db.refresh(db_game)
    return db_game


def remove_players_from_game(db: Session, game_id: int, player_ids: List[int]) -> Optional[models.Game]:
    """Remove players from game"""
    db_game = get_game(db, game_id)
    if db_game:
        if player_ids:
            used_player_ids = {
                row[0]
                for row in db.query(models.point_players.c.player_id)
                .join(models.Point, models.Point.id == models.point_players.c.point_id)
                .filter(
                    models.Point.game_id == game_id,
                    models.point_players.c.player_id.in_(player_ids)
                )
                .distinct()
                .all()
            }

            if used_player_ids:
                blocked = sorted(used_player_ids)
                raise ValueError(
                    f"Cannot remove players from game because they have played points: {blocked}"
                )

        db_game.players = [
            p for p in db_game.players if p.id not in player_ids
        ]
        db.commit()
        db.refresh(db_game)
    return db_game
