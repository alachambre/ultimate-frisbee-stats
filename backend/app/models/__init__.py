"""
Database models organized by domain

All models are re-exported here for backward compatibility with existing imports:
    from app.models import Team, Player, Game, Point, Competition
    from app import models
"""

from .base import Base, GenderEnum, CompetitionStatusEnum, GameStatusEnum, point_players, competition_players, line_players, game_players
from .team import Team
from .competition import Competition
from .player import Player
from .game import Game
from .point import Point
from .line import Line

__all__ = [
    "Base",
    "GenderEnum",
    "CompetitionStatusEnum",
    "GameStatusEnum",
    "point_players",
    "competition_players",
    "line_players",
    "game_players",
    "Team",
    "Competition",
    "Player",
    "Game",
    "Point",
    "Line",
]
