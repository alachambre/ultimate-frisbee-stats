from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app import models, schemas


def create_game(db: Session, game: schemas.GameCreate) -> models.Game:
    db_game = models.Game(
        competition_id=game.competition_id,
        opponent_name=game.opponent_name,
        date=game.date,
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


def get_game(db: Session, game_id: int) -> Optional[models.Game]:
    return db.query(models.Game).filter(models.Game.id == game_id).first()


def get_all_games(db: Session) -> List[models.Game]:
    return db.query(models.Game).order_by(models.Game.date.desc()).all()


def get_games_by_competition(db: Session, competition_id: int) -> List[models.Game]:
    return db.query(models.Game).filter(
        models.Game.competition_id == competition_id
    ).order_by(models.Game.date.desc()).all()


def get_games_by_team(db: Session, team_id: int) -> List[models.Game]:
    """Get all games for a team across all competitions"""
    return db.query(models.Game).join(
        models.Competition
    ).filter(
        models.Competition.team_id == team_id
    ).order_by(models.Game.date.desc()).all()


def update_game(db: Session, game_id: int, game_update: schemas.GameUpdate) -> Optional[models.Game]:
    db_game = get_game(db, game_id)
    if db_game:
        if game_update.opponent_name is not None:
            db_game.opponent_name = game_update.opponent_name
        if game_update.status is not None:
            # Convert GameStatus enum to GameStatusEnum
            db_game.status = models.GameStatusEnum[game_update.status.value]
        if game_update.comments is not None:
            db_game.comments = game_update.comments
        db.commit()
        db.refresh(db_game)
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
    from app.crud.points import get_points_by_game
    points = get_points_by_game(db, game_id)
    our_score = sum(1 for p in points if p.won)
    opponent_score = len(points) - our_score
    return our_score, opponent_score


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

    return {
        **game.__dict__,
        "our_score": our_score,
        "opponent_score": opponent_score,
        "team_name": competition.team.name if competition and competition.team else "Unknown",
        "competition_name": competition.name if competition else "Unknown",
        "points": points,
        "players": game.players
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
        db_game.players = [
            p for p in db_game.players if p.id not in player_ids
        ]
        db.commit()
        db.refresh(db_game)
    return db_game
