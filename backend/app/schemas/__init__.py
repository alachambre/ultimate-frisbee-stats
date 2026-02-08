"""
Pydantic schemas organized by domain

All schemas are re-exported here for backward compatibility with existing imports:
    from app.schemas import Team, TeamCreate, TeamUpdate, Player, PlayerCreate, etc.
    from app import schemas
"""

from .enums import Gender, CompetitionStatus, GameStatus, PointStatus, StrategyCategory, StoppageType
from .team import Team, TeamCreate, TeamUpdate, TeamWithPlayers
from .competition import Competition, CompetitionCreate, CompetitionUpdate, CompetitionWithPlayers, CompetitionWithTeam
from .player import Player, PlayerCreate, PlayerUpdate
from .game import Game, GameCreate, GameUpdate, GameWithScore, GameDetail
from .point import Point, PointCreate, PointUpdate, PointFinish, PointWithPlayers
from .line import Line, LineCreate, LineUpdate, LineWithPlayers
from .strategy import Strategy, StrategyCreate, StrategyUpdate
from .stoppage import Stoppage, StoppageCreate, StoppageUpdate
from .halftime import Halftime, HalftimeCreate, HalftimeUpdate
from .turnover import Turnover, TurnoverCreate, TurnoverUpdate, TurnoverWithPlayer

# Rebuild models with forward references after all models are imported
TeamWithPlayers.model_rebuild()
CompetitionWithPlayers.model_rebuild()
GameWithScore.model_rebuild()
GameDetail.model_rebuild()
PointWithPlayers.model_rebuild()
LineWithPlayers.model_rebuild()
TurnoverWithPlayer.model_rebuild()

__all__ = [
    # Enums
    "Gender",
    "CompetitionStatus",
    "GameStatus",
    "PointStatus",
    "StrategyCategory",
    "StoppageType",
    # Teams
    "Team",
    "TeamCreate",
    "TeamUpdate",
    "TeamWithPlayers",
    # Competitions
    "Competition",
    "CompetitionCreate",
    "CompetitionUpdate",
    "CompetitionWithPlayers",
    "CompetitionWithTeam",
    # Players
    "Player",
    "PlayerCreate",
    "PlayerUpdate",
    # Games
    "Game",
    "GameCreate",
    "GameUpdate",
    "GameWithScore",
    "GameDetail",
    # Points
    "Point",
    "PointCreate",
    "PointUpdate",
    "PointFinish",
    "PointWithPlayers",
    # Lines
    "Line",
    "LineCreate",
    "LineUpdate",
    "LineWithPlayers",
    # Strategies
    "Strategy",
    "StrategyCreate",
    "StrategyUpdate",
    # Stoppages
    "Stoppage",
    "StoppageCreate",
    "StoppageUpdate",
    # Halftime
    "Halftime",
    "HalftimeCreate",
    "HalftimeUpdate",
    # Turnovers
    "Turnover",
    "TurnoverCreate",
    "TurnoverUpdate",
    "TurnoverWithPlayer",
]
