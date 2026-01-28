"""
Statistics schemas
"""
from pydantic import BaseModel


class PlayerGameStats(BaseModel):
    """Statistics for a player in a specific game"""
    player_id: int
    player_name: str
    player_number: int
    points_played: int  # Number of completed points played
    effective_time_seconds: int  # Total effective time (point duration - call durations)

    class Config:
        from_attributes = True
