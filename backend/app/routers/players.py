from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.auth.dependencies import require_team_member
from app.database import get_db
from app.statistics_invalidation import (
    StatisticsCacheInvalidationReason,
    invalidate_statistics_cache,
)

router = APIRouter(
    prefix="/players",
    tags=["players"],
    dependencies=[Depends(require_team_member)],
)


@router.post("", response_model=schemas.Player, status_code=201)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    # Verify team exists
    team = crud.get_team(db, player.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    created_player = crud.create_player(db, player)
    invalidate_statistics_cache(StatisticsCacheInvalidationReason.PLAYER_CREATED)
    return created_player


@router.get("/{player_id}", response_model=schemas.Player)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = crud.get_player(db, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.put("/{player_id}", response_model=schemas.Player)
def update_player(player_id: int, player_update: schemas.PlayerUpdate, db: Session = Depends(get_db)):
    player = crud.update_player(db, player_id, player_update)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    invalidate_statistics_cache(StatisticsCacheInvalidationReason.PLAYER_UPDATED)
    return player


@router.delete("/{player_id}", status_code=204)
def delete_player(player_id: int, db: Session = Depends(get_db)):
    try:
        success = crud.delete_player(db, player_id)
        if not success:
            raise HTTPException(status_code=404, detail="Player not found")
        invalidate_statistics_cache(StatisticsCacheInvalidationReason.PLAYER_DELETED)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
