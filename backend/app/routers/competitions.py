from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app import schemas, crud
from app.database import get_db

router = APIRouter(
    prefix="/competitions",
    tags=["competitions"]
)


@router.post("", response_model=schemas.Competition, status_code=201)
def create_competition(competition: schemas.CompetitionCreate, db: Session = Depends(get_db)):
    # Verify team exists
    team = crud.get_team(db, competition.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Verify all players exist and belong to the team
    if competition.player_ids:
        players = crud.get_players_by_team(db, competition.team_id)
        player_ids_set = {p.id for p in players}
        invalid_players = set(competition.player_ids) - player_ids_set
        if invalid_players:
            raise HTTPException(
                status_code=400,
                detail=f"Players {invalid_players} not found in team {competition.team_id}"
            )

    return crud.create_competition(db, competition)


@router.get("", response_model=List[schemas.CompetitionWithTeam])
def list_competitions(team_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    competitions = crud.get_competitions(db, team_id=team_id, skip=skip, limit=limit)
    # Add team_name to each competition
    result = []
    for competition in competitions:
        team = crud.get_team(db, competition.team_id)
        competition_dict = {
            **competition.__dict__,
            "team_name": team.name if team else "Unknown"
        }
        result.append(competition_dict)
    return result


@router.get("/{competition_id}", response_model=schemas.CompetitionWithPlayers)
def get_competition(competition_id: int, db: Session = Depends(get_db)):
    competition = crud.get_competition(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return competition


@router.put("/{competition_id}", response_model=schemas.Competition)
def update_competition(competition_id: int, competition_update: schemas.CompetitionUpdate, db: Session = Depends(get_db)):
    competition = crud.update_competition(db, competition_id, competition_update)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return competition


@router.delete("/{competition_id}", status_code=204)
def delete_competition(competition_id: int, db: Session = Depends(get_db)):
    success = crud.delete_competition(db, competition_id)
    if not success:
        raise HTTPException(status_code=404, detail="Competition not found")


# Nested endpoints for competition resources
@router.get("/{competition_id}/players", response_model=List[schemas.Player])
def list_competition_players(competition_id: int, db: Session = Depends(get_db)):
    """Get the roster for this competition"""
    competition = crud.get_competition(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return crud.get_competition_players(db, competition_id)


class PlayerIdsRequest(BaseModel):
    player_ids: List[int]


@router.post("/{competition_id}/players", response_model=schemas.CompetitionWithPlayers)
def add_players_to_roster(competition_id: int, request: PlayerIdsRequest, db: Session = Depends(get_db)):
    """Add players to competition roster"""
    competition = crud.get_competition(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    # Verify all players belong to the same team
    if request.player_ids:
        players = crud.get_players_by_team(db, competition.team_id)
        player_ids_set = {p.id for p in players}
        invalid_players = set(request.player_ids) - player_ids_set
        if invalid_players:
            raise HTTPException(
                status_code=400,
                detail=f"Players {invalid_players} not found in team {competition.team_id}"
            )

    return crud.add_players_to_competition(db, competition_id, request.player_ids)


@router.delete("/{competition_id}/players", response_model=schemas.CompetitionWithPlayers)
def remove_players_from_roster(competition_id: int, request: PlayerIdsRequest, db: Session = Depends(get_db)):
    """Remove players from competition roster"""
    competition = crud.get_competition(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    return crud.remove_players_from_competition(db, competition_id, request.player_ids)


@router.get("/{competition_id}/games", response_model=List[schemas.GameWithScore])
def list_competition_games(competition_id: int, db: Session = Depends(get_db)):
    """List all games in this competition"""
    competition = crud.get_competition(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")

    games = crud.get_games_by_competition(db, competition_id)
    # Add scores and team/competition name to each game
    result = []
    for game in games:
        our_score, opponent_score = crud.get_game_score(db, game.id)
        game_dict = {
            **game.__dict__,
            "our_score": our_score,
            "opponent_score": opponent_score,
            "team_name": competition.team.name,
            "competition_name": competition.name
        }
        result.append(game_dict)
    return result
