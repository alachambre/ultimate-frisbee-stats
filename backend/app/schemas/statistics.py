"""
Statistics schemas
"""
from pydantic import BaseModel
from typing import Optional


class PlayerGameStats(BaseModel):
    """Statistics for a player in a specific game"""
    player_id: int
    player_name: str
    player_number: int
    points_played: int  # Number of completed points played
    effective_time_seconds: int  # Total effective time (point duration - call durations)

    class Config:
        from_attributes = True


class OffenseStats(BaseModel):
    """Offensive statistics for a game"""
    points_started: int
    points_won: int
    points_lost: int
    win_rate: float
    points_won_no_turnover: int
    clean_point_rate: float
    break_rate: float  # points lost on offense (broken)

    class Config:
        from_attributes = True


class DefenseStats(BaseModel):
    """Defensive statistics for a game"""
    points_started: int
    points_won: int
    points_lost: int
    win_rate: float
    points_with_turnover: int
    turnover_rate: float
    points_won_no_turnover: int
    clean_break_rate: float
    points_lost_no_turnover: int  # opponent scored without turnover
    hold_rate: float  # opponent didn't score on defense

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
