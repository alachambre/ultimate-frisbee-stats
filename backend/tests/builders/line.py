"""
LineBuilder - Simple builder for creating lines.
"""
from typing import List
from sqlalchemy.orm import Session
from app.crud import lines as lines_crud
from app.schemas.line import LineCreate
from app.models.line import Line
from app.models.team import Team
from app.models.player import Player


class LineBuilder:
    """
    Builder for creating lines with minimal setup.

    Usage:
        line = LineBuilder(db_session, team) \\
            .with_name("O-Line") \\
            .with_players([p1, p2, p3]) \\
            .build()
    """

    def __init__(self, db: Session, team: Team):
        self.db = db
        self.team = team
        self._name = "Test Line"
        self._player_ids = []

    def with_name(self, name: str) -> "LineBuilder":
        self._name = name
        return self

    def with_players(self, players: List[Player]) -> "LineBuilder":
        self._player_ids = [p.id for p in players]
        return self

    def with_player_ids(self, player_ids: List[int]) -> "LineBuilder":
        self._player_ids = player_ids
        return self

    def build(self) -> Line:
        return lines_crud.create_line(
            self.db,
            LineCreate(
                team_id=self.team.id,
                name=self._name,
                player_ids=self._player_ids
            )
        )
