from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, crud
from app.auth.context import AccessContext
from app.auth.dependencies import get_request_access_context, require_team_member
from app.auth.redaction import serialize_halftime
from app.database import get_db
from app.logging_config import get_logger
from app.statistics_cache import clear_statistics_cache

logger = get_logger("routers.halftimes")

router = APIRouter(
    prefix="/halftimes",
    tags=["halftimes"],
)


@router.post("", response_model=schemas.Halftime, status_code=201)
def create_halftime(
    halftime: schemas.HalftimeCreate,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Create a halftime marker for a game."""
    try:
        created_halftime = crud.create_halftime(db, halftime)
        logger.info(f"Halftime created: id={created_halftime.id}, game={halftime.game_id}")
        clear_statistics_cache("halftime_created")
        return created_halftime
    except ValueError as e:
        logger.warning(f"Failed to create halftime: {str(e)}")
        error_text = str(e).lower()
        status_code = 404 if "not found" in error_text else 400
        raise HTTPException(status_code=status_code, detail=str(e))


@router.get("/games/{game_id}/halftime", response_model=schemas.Halftime)
def get_halftime_by_game(
    game_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    """Get halftime marker for a game."""
    halftime = crud.get_halftime_by_game(db, game_id)
    if not halftime:
        logger.warning(f"Halftime not found for game {game_id}")
        raise HTTPException(status_code=404, detail="Halftime not found")
    return serialize_halftime(halftime, access_context)


@router.put("/{halftime_id}", response_model=schemas.Halftime)
def update_halftime(
    halftime_id: int,
    halftime_update: schemas.HalftimeUpdate,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Update halftime marker."""
    halftime = crud.update_halftime(db, halftime_id, halftime_update)
    if not halftime:
        logger.warning(f"Failed to update halftime: halftime {halftime_id} not found")
        raise HTTPException(status_code=404, detail="Halftime not found")
    logger.info(f"Halftime updated: id={halftime_id}")
    clear_statistics_cache("halftime_updated")
    return halftime


@router.delete("/{halftime_id}", status_code=204)
def delete_halftime(
    halftime_id: int,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Delete halftime marker."""
    success = crud.delete_halftime(db, halftime_id)
    if not success:
        logger.warning(f"Failed to delete halftime: halftime {halftime_id} not found")
        raise HTTPException(status_code=404, detail="Halftime not found")
    logger.info(f"Halftime deleted: id={halftime_id}")
    clear_statistics_cache("halftime_deleted")
