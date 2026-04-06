from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app import schemas, crud
from app.auth.dependencies import require_team_member
from app.database import get_db

router = APIRouter(
    prefix="/strategies",
    tags=["strategies"],
    dependencies=[Depends(require_team_member)],
)


@router.post("", response_model=schemas.Strategy, status_code=201)
def create_strategy(strategy: schemas.StrategyCreate, db: Session = Depends(get_db)):
    """Create a new strategy"""
    try:
        return crud.create_strategy(db, strategy)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[schemas.Strategy])
def list_strategies(
    category: Optional[schemas.StrategyCategory] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all strategies with optional category filter"""
    return crud.get_strategies(db, category=category, skip=skip, limit=limit)


@router.get("/{strategy_id}", response_model=schemas.Strategy)
def get_strategy(strategy_id: int, db: Session = Depends(get_db)):
    """Get a strategy by ID"""
    strategy = crud.get_strategy(db, strategy_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy


@router.put("/{strategy_id}", response_model=schemas.Strategy)
def update_strategy(
    strategy_id: int,
    strategy_update: schemas.StrategyUpdate,
    db: Session = Depends(get_db)
):
    """Update a strategy"""
    try:
        strategy = crud.update_strategy(db, strategy_id, strategy_update)
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        return strategy
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{strategy_id}", status_code=204)
def delete_strategy(strategy_id: int, db: Session = Depends(get_db)):
    """Delete a strategy"""
    success = crud.delete_strategy(db, strategy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Strategy not found")
