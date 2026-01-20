from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas


def create_competition(db: Session, competition: schemas.CompetitionCreate) -> models.Competition:
    db_competition = models.Competition(
        team_id=competition.team_id,
        name=competition.name,
        description=competition.description,
        start_date=competition.start_date,
        end_date=competition.end_date,
        status=models.CompetitionStatusEnum.ongoing
    )

    # Add players to roster if provided
    if competition.player_ids:
        players = db.query(models.Player).filter(
            models.Player.id.in_(competition.player_ids)
        ).all()
        db_competition.players = players

    db.add(db_competition)
    db.commit()
    db.refresh(db_competition)
    return db_competition


def get_competition(db: Session, competition_id: int) -> Optional[models.Competition]:
    return db.query(models.Competition).filter(
        models.Competition.id == competition_id
    ).first()


def get_competitions(db: Session, team_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[models.Competition]:
    query = db.query(models.Competition)
    if team_id:
        query = query.filter(models.Competition.team_id == team_id)
    return query.offset(skip).limit(limit).all()


def update_competition(db: Session, competition_id: int, competition_update: schemas.CompetitionUpdate) -> Optional[models.Competition]:
    db_competition = get_competition(db, competition_id)
    if db_competition:
        if competition_update.name is not None:
            db_competition.name = competition_update.name
        if competition_update.description is not None:
            db_competition.description = competition_update.description
        if competition_update.start_date is not None:
            db_competition.start_date = competition_update.start_date
        if competition_update.end_date is not None:
            db_competition.end_date = competition_update.end_date
        if competition_update.status is not None:
            db_competition.status = models.CompetitionStatusEnum[competition_update.status.value]

        db.commit()
        db.refresh(db_competition)
    return db_competition


def delete_competition(db: Session, competition_id: int) -> bool:
    db_competition = get_competition(db, competition_id)
    if db_competition:
        db.delete(db_competition)
        db.commit()
        return True
    return False


def add_players_to_competition(db: Session, competition_id: int, player_ids: List[int]) -> Optional[models.Competition]:
    """Add players to competition roster"""
    db_competition = get_competition(db, competition_id)
    if db_competition:
        players = db.query(models.Player).filter(
            models.Player.id.in_(player_ids),
            models.Player.team_id == db_competition.team_id  # Ensure players belong to same team
        ).all()

        # Add only new players (avoid duplicates)
        existing_player_ids = {p.id for p in db_competition.players}
        for player in players:
            if player.id not in existing_player_ids:
                db_competition.players.append(player)

        db.commit()
        db.refresh(db_competition)
    return db_competition


def remove_players_from_competition(db: Session, competition_id: int, player_ids: List[int]) -> Optional[models.Competition]:
    """Remove players from competition roster"""
    db_competition = get_competition(db, competition_id)
    if db_competition:
        db_competition.players = [
            p for p in db_competition.players if p.id not in player_ids
        ]
        db.commit()
        db.refresh(db_competition)
    return db_competition


def get_competition_players(db: Session, competition_id: int) -> List[models.Player]:
    """Get all players in a competition roster"""
    db_competition = get_competition(db, competition_id)
    if db_competition:
        return db_competition.players
    return []
