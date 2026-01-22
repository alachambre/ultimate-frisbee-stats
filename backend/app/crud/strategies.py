from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app import models, schemas


def create_strategy(db: Session, strategy: schemas.StrategyCreate) -> models.Strategy:
    """Create a new strategy"""
    db_strategy = models.Strategy(
        name=strategy.name,
        description=strategy.description,
        category=strategy.category
    )
    db.add(db_strategy)
    try:
        db.commit()
        db.refresh(db_strategy)
        return db_strategy
    except IntegrityError:
        db.rollback()
        raise ValueError(f"Strategy with name '{strategy.name}' already exists")


def get_strategy(db: Session, strategy_id: int) -> Optional[models.Strategy]:
    """Get a strategy by ID"""
    return db.query(models.Strategy).filter(
        models.Strategy.id == strategy_id
    ).first()


def get_strategies(
    db: Session,
    category: Optional[schemas.StrategyCategory] = None,
    skip: int = 0,
    limit: int = 100
) -> List[models.Strategy]:
    """Get all strategies with optional category filter"""
    query = db.query(models.Strategy)
    if category:
        query = query.filter(models.Strategy.category == category)
    return query.offset(skip).limit(limit).all()


def update_strategy(
    db: Session,
    strategy_id: int,
    strategy_update: schemas.StrategyUpdate
) -> Optional[models.Strategy]:
    """Update a strategy"""
    db_strategy = get_strategy(db, strategy_id)
    if db_strategy:
        if strategy_update.name is not None:
            db_strategy.name = strategy_update.name
        if strategy_update.description is not None:
            db_strategy.description = strategy_update.description
        if strategy_update.category is not None:
            db_strategy.category = strategy_update.category

        try:
            db.commit()
            db.refresh(db_strategy)
        except IntegrityError:
            db.rollback()
            raise ValueError(f"Strategy with name '{strategy_update.name}' already exists")
    return db_strategy


def delete_strategy(db: Session, strategy_id: int) -> bool:
    """Delete a strategy (sets strategy_id to NULL on points due to ON DELETE SET NULL)"""
    db_strategy = get_strategy(db, strategy_id)
    if db_strategy:
        db.delete(db_strategy)
        db.commit()
        return True
    return False
