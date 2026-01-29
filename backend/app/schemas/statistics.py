"""
Statistics schemas
"""
from pydantic import BaseModel
from typing import Optional


class PlayerOffenseStats(BaseModel):
    """Offensive statistics for a player"""
    points_played: int
    points_won: int
    points_lost: int
    hold_rate: float
    points_won_no_turnover: int
    clean_hold_rate: float  # points_won_no_turnover / points_won (only won points)

    class Config:
        from_attributes = True


class PlayerDefenseStats(BaseModel):
    """Defensive statistics for a player"""
    points_played: int
    points_won: int
    points_lost: int
    break_rate: float
    points_with_turnover: int
    turnover_rate: float  # points_with_turnover / points_played
    points_won_no_turnover: int
    clean_break_rate: float  # points_won_no_turnover / points_won (only won points)
    points_lost_no_turnover: int

    class Config:
        from_attributes = True


class PlayerGameStats(BaseModel):
    """Statistics for a player in a specific game"""
    player_id: int
    player_name: str
    player_number: int
    points_played: int  # Number of completed points played
    effective_time_seconds: int  # Total effective time (point duration - call durations)
    offense: PlayerOffenseStats
    defense: PlayerDefenseStats

    class Config:
        from_attributes = True


class OffenseStats(BaseModel):
    """Offensive statistics for a game"""
    points_started: int
    points_won: int
    points_lost: int
    hold_rate: float
    points_won_no_turnover: int
    clean_hold_rate: float
    broken_rate: float  # points lost on offense (broken)

    class Config:
        from_attributes = True


class DefenseStats(BaseModel):
    """Defensive statistics for a game"""
    points_started: int
    points_won: int
    points_lost: int
    break_rate: float
    points_with_turnover: int
    turnover_rate: float
    points_won_no_turnover: int
    clean_break_rate: float
    points_lost_no_turnover: int  # opponent scored without turnover
    hold_rate: float  # opponent didn't score on defense (inverse of break_rate)

    class Config:
        from_attributes = True


class GameTeamStats(BaseModel):
    """Team statistics for a game"""
    game_id: int
    total_completed_points: int
    offense: OffenseStats
    defense: DefenseStats

    class Config:
        from_attributes = True
