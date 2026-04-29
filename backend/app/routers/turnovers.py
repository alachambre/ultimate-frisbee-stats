from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.auth.context import AccessContext
from app.auth.dependencies import get_request_access_context, require_team_member
from app.auth.redaction import serialize_turnover, serialize_turnovers
from app.database import get_db
from app.logging_config import get_logger
from app.statistics_cache import clear_statistics_cache

logger = get_logger("routers.turnovers")

router = APIRouter(
    prefix="/turnovers",
    tags=["turnovers"]
)


@router.post("", response_model=schemas.TurnoverWithPlayer, status_code=201)
def create_turnover(
    turnover: schemas.TurnoverCreate,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Create a new turnover."""
    try:
        created_turnover = crud.create_turnover(db, turnover)
        logger.info(
            f"Turnover created: id={created_turnover.id}, point={turnover.point_id}, "
            f"player={turnover.player_id or 'unassigned'}, type={turnover.turnover_type.value}"
        )
        clear_statistics_cache("turnover_created")
        return created_turnover
    except ValueError as e:
        logger.warning(f"Failed to create turnover: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{turnover_id}", response_model=schemas.TurnoverWithPlayer)
def get_turnover(
    turnover_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    """Get a specific turnover."""
    turnover = crud.get_turnover(db, turnover_id)
    if not turnover:
        logger.warning(f"Turnover {turnover_id} not found")
        raise HTTPException(status_code=404, detail="Turnover not found")
    return serialize_turnover(turnover, access_context)


@router.put("/{turnover_id}", response_model=schemas.TurnoverWithPlayer)
def update_turnover(
    turnover_id: int,
    turnover_update: schemas.TurnoverUpdate,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Update a turnover."""
    try:
        turnover = crud.update_turnover(db, turnover_id, turnover_update)
        if not turnover:
            logger.warning(f"Failed to update turnover: turnover {turnover_id} not found")
            raise HTTPException(status_code=404, detail="Turnover not found")

        clear_statistics_cache("turnover_updated")
        return turnover
    except ValueError as e:
        logger.warning(f"Failed to update turnover {turnover_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{turnover_id}", status_code=204)
def delete_turnover(
    turnover_id: int,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Delete a turnover."""
    success = crud.delete_turnover(db, turnover_id)
    if not success:
        logger.warning(f"Failed to delete turnover: turnover {turnover_id} not found")
        raise HTTPException(status_code=404, detail="Turnover not found")

    logger.info(f"Turnover {turnover_id} deleted")
    clear_statistics_cache("turnover_deleted")


# Nested endpoints
@router.get("/points/{point_id}/turnovers", response_model=List[schemas.TurnoverWithPlayer])
def list_point_turnovers(
    point_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    """Get all turnovers for a specific point."""
    return serialize_turnovers(crud.get_turnovers_by_point(db, point_id), access_context)


@router.get("/players/{player_id}/turnovers", response_model=List[schemas.Turnover])
def list_player_turnovers(
    player_id: int,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Get all turnovers for a specific player."""
    return crud.get_turnovers_by_player(db, player_id)
