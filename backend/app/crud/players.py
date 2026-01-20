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
        db.delete(db_player)
        db.commit()
        return True
    return False
