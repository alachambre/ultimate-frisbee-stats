from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.auth.context import AccessContext
from app.auth.dependencies import get_request_access_context, require_team_member
from app.auth.redaction import serialize_stoppage, serialize_stoppages
from app.database import get_db
from app.logging_config import get_logger

logger = get_logger("routers.stoppages")

router = APIRouter(
    prefix="/stoppages",
    tags=["stoppages"],
)


@router.post("", response_model=schemas.Stoppage, status_code=201)
def create_stoppage(
    stoppage: schemas.StoppageCreate,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Create a new stoppage."""
    try:
        created_stoppage = crud.create_stoppage(db, stoppage)
        logger.info(
            f"Stoppage created: id={created_stoppage.id}, point={stoppage.point_id}, "
            f"type={stoppage.stoppage_type.value}, "
            f"resume={'resolved' if stoppage.resume_timestamp else 'pending'}"
        )
        return created_stoppage
    except ValueError as e:
        logger.warning(f"Failed to create stoppage: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{stoppage_id}", response_model=schemas.Stoppage)
def get_stoppage(
    stoppage_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    """Get a specific stoppage."""
    stoppage = crud.get_stoppage(db, stoppage_id)
    if not stoppage:
        logger.warning(f"Stoppage {stoppage_id} not found")
        raise HTTPException(status_code=404, detail="Stoppage not found")
    return serialize_stoppage(stoppage, access_context)


@router.put("/{stoppage_id}", response_model=schemas.Stoppage)
def update_stoppage(
    stoppage_id: int,
    stoppage_update: schemas.StoppageUpdate,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Update a stoppage."""
    try:
        stoppage = crud.update_stoppage(db, stoppage_id, stoppage_update)
        if not stoppage:
            logger.warning(f"Failed to update stoppage: stoppage {stoppage_id} not found")
            raise HTTPException(status_code=404, detail="Stoppage not found")

        if stoppage_update.resume_timestamp:
            logger.info(f"Stoppage {stoppage_id} resolved with resume timestamp")

        return stoppage
    except ValueError as e:
        logger.warning(f"Failed to update stoppage {stoppage_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{stoppage_id}", status_code=204)
def delete_stoppage(
    stoppage_id: int,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Delete a stoppage."""
    success = crud.delete_stoppage(db, stoppage_id)
    if not success:
        logger.warning(f"Failed to delete stoppage: stoppage {stoppage_id} not found")
        raise HTTPException(status_code=404, detail="Stoppage not found")

    logger.info(f"Stoppage {stoppage_id} deleted")


@router.get("/points/{point_id}/stoppages", response_model=List[schemas.Stoppage])
def list_point_stoppages(
    point_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    """Get all stoppages for a specific point."""
    return serialize_stoppages(crud.get_stoppages_by_point(db, point_id), access_context)
