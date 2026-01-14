from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas


def create_team(db: Session, team: schemas.TeamCreate) -> models.Team:
    db_team = models.Team(name=team.name)
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


def get_team(db: Session, team_id: int) -> Optional[models.Team]:
    return db.query(models.Team).filter(models.Team.id == team_id).first()


def get_teams(db: Session, skip: int = 0, limit: int = 100) -> List[models.Team]:
    return db.query(models.Team).offset(skip).limit(limit).all()


def update_team(db: Session, team_id: int, team_update: schemas.TeamUpdate) -> Optional[models.Team]:
    db_team = get_team(db, team_id)
    if db_team:
        db_team.name = team_update.name
        db.commit()
        db.refresh(db_team)
    return db_team


def delete_team(db: Session, team_id: int) -> bool:
    db_team = get_team(db, team_id)
    if db_team:
        db.delete(db_team)
        db.commit()
        return True
    return False
