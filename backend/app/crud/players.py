from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas


def create_player(db: Session, player: schemas.PlayerCreate) -> models.Player:
    db_player = models.Player(
        team_id=player.team_id,
        name=player.name,
        number=player.number,
        gender=player.gender
    )
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


def get_player(db: Session, player_id: int) -> Optional[models.Player]:
    return db.query(models.Player).filter(models.Player.id == player_id).first()


def get_players_by_team(db: Session, team_id: int) -> List[models.Player]:
    return db.query(models.Player).filter(models.Player.team_id == team_id).all()


def update_player(db: Session, player_id: int, player_update: schemas.PlayerUpdate) -> Optional[models.Player]:
    db_player = get_player(db, player_id)
    if db_player:
        if player_update.name is not None:
            db_player.name = player_update.name
        if player_update.number is not None:
            db_player.number = player_update.number
        if player_update.gender is not None:
            db_player.gender = player_update.gender
        db.commit()
        db.refresh(db_player)
    return db_player


def delete_player(db: Session, player_id: int) -> bool:
    db_player = get_player(db, player_id)
    if db_player:
        used_in_game_roster = db.query(models.game_players.c.game_id).join(
            models.Game, models.Game.id == models.game_players.c.game_id
        ).join(
            models.Competition, models.Competition.id == models.Game.competition_id
        ).filter(
            models.Competition.team_id == db_player.team_id,
            models.game_players.c.player_id == player_id
        ).first()

        used_in_points = db.query(models.point_players.c.point_id).join(
            models.Point, models.Point.id == models.point_players.c.point_id
        ).join(
            models.Game, models.Game.id == models.Point.game_id
        ).join(
            models.Competition, models.Competition.id == models.Game.competition_id
        ).filter(
            models.Competition.team_id == db_player.team_id,
            models.point_players.c.player_id == player_id
        ).first()

        if used_in_game_roster or used_in_points:
            raise ValueError("Cannot delete player because they are used in games")

        db.delete(db_player)
        db.commit()
        return True
    return False
