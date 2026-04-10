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


class PointStatus(str, Enum):
    ready = "ready"
    running = "running"
    scored = "scored"
    completed = "completed"


class StrategyCategory(str, Enum):
    offense = "offense"
    defense = "defense"


class StoppageType(str, Enum):
    call = "call"
    injury = "injury"
    timeout = "timeout"
    other = "other"


class TurnoverType(str, Enum):
    defended_pass = "defended_pass"
    missed_pass = "missed_pass"
    defended_huck = "defended_huck"
    missed_huck = "missed_huck"
    drop = "drop"
    stall_out = "stall_out"
    miscommunication = "miscommunication"
    other = "other"
