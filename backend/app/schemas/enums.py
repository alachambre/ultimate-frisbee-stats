"""
Pydantic enums for API schemas
"""
from enum import Enum


class Gender(str, Enum):
    M = "M"
    W = "W"


class CompetitionStatus(str, Enum):
    ongoing = "ongoing"
    completed = "completed"


class GameStatus(str, Enum):
    ready = "ready"
    started = "started"
    ended = "ended"
