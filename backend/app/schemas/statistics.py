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
    player_number: Optional[int]  # Jersey number can be None
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


class PullStats(BaseModel):
    """Pull statistics for a game (defense points only)"""
    total_pulls: int  # Points where pull was tracked
    inbound_pulls: int
    out_of_bounds_pulls: int
    inbound_rate: float

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
    pull_stats: PullStats

    class Config:
        from_attributes = True


class TeamStatsBase(BaseModel):
    """Common offense/defense statistics payload shared across scopes"""
    total_completed_points: int
    offense: OffenseStats
    defense: DefenseStats

    class Config:
        from_attributes = True


class GameTeamStats(TeamStatsBase):
    """Team statistics for a game"""
    game_id: int


class CompetitionTeamStats(TeamStatsBase):
    """Team statistics aggregated over a competition"""
    competition_id: int


class TeamTeamStats(TeamStatsBase):
    """Team statistics aggregated over all competitions for a team"""
    team_id: int


class OffenseStrategyStats(BaseModel):
    """Statistics for an offensive strategy"""
    strategy_id: int
    strategy_name: str
    points_played: int
    points_won: int  # Holds
    points_lost: int
    hold_rate: float
    clean_holds: int  # Holds with 0 turnovers
    clean_hold_rate: float
    quick_scores: int  # Holds in < 90 seconds
    quick_score_rate: float

    class Config:
        from_attributes = True


class DefenseStrategyStats(BaseModel):
    """Statistics for a defensive strategy"""
    strategy_id: int
    strategy_name: str
    points_played: int
    points_won: int  # Breaks
    points_lost: int
    break_rate: float
    points_with_turnover: int  # Points where we forced at least 1 turnover
    turnover_rate: float

    class Config:
        from_attributes = True


class StrategyStatsBase(BaseModel):
    """Common strategy statistics payload shared across scopes"""
    offense_strategies: list[OffenseStrategyStats]
    defense_strategies: list[DefenseStrategyStats]

    class Config:
        from_attributes = True


class GameStrategyStats(StrategyStatsBase):
    """Strategy statistics for a game"""
    game_id: int


class CompetitionStrategyStats(StrategyStatsBase):
    """Strategy statistics for a competition"""
    competition_id: int


class TeamStrategyStats(StrategyStatsBase):
    """Strategy statistics for a team across all competitions"""
    team_id: int
