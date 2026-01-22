from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas


def create_line(db: Session, line: schemas.LineCreate) -> models.Line:
    db_line = models.Line(
        team_id=line.team_id,
        name=line.name,
        description=line.description
    )

    # Add players to line if provided
    if line.player_ids:
        players = db.query(models.Player).filter(
            models.Player.id.in_(line.player_ids),
            models.Player.team_id == line.team_id  # Ensure players belong to same team
        ).all()
        db_line.players = players

    db.add(db_line)
    db.commit()
    db.refresh(db_line)
    return db_line


def get_line(db: Session, line_id: int) -> Optional[models.Line]:
    return db.query(models.Line).filter(
        models.Line.id == line_id
    ).first()


def get_lines(db: Session, team_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[models.Line]:
    query = db.query(models.Line)
    if team_id:
        query = query.filter(models.Line.team_id == team_id)
    return query.offset(skip).limit(limit).all()


def update_line(db: Session, line_id: int, line_update: schemas.LineUpdate) -> Optional[models.Line]:
    db_line = get_line(db, line_id)
    if db_line:
        if line_update.name is not None:
            db_line.name = line_update.name
        if line_update.description is not None:
            db_line.description = line_update.description

        db.commit()
        db.refresh(db_line)
    return db_line


def delete_line(db: Session, line_id: int) -> bool:
    db_line = get_line(db, line_id)
    if db_line:
        db.delete(db_line)
        db.commit()
        return True
    return False


def add_players_to_line(db: Session, line_id: int, player_ids: List[int]) -> Optional[models.Line]:
    """Add players to line"""
    db_line = get_line(db, line_id)
    if db_line:
        players = db.query(models.Player).filter(
            models.Player.id.in_(player_ids),
            models.Player.team_id == db_line.team_id  # Ensure players belong to same team
        ).all()

        # Add only new players (avoid duplicates)
        existing_player_ids = {p.id for p in db_line.players}
        for player in players:
            if player.id not in existing_player_ids:
                db_line.players.append(player)

        db.commit()
        db.refresh(db_line)
    return db_line


def remove_players_from_line(db: Session, line_id: int, player_ids: List[int]) -> Optional[models.Line]:
    """Remove players from line"""
    db_line = get_line(db, line_id)
    if db_line:
        db_line.players = [
            p for p in db_line.players if p.id not in player_ids
        ]
        db.commit()
        db.refresh(db_line)
    return db_line


def get_line_players(db: Session, line_id: int) -> List[models.Player]:
    """Get all players in a line"""
    db_line = get_line(db, line_id)
    if db_line:
        return db_line.players
    return []
