"""
GameBuilder - Simple builder for creating games.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.crud import games as games_crud
from app.schemas.game import GameCreate
from app.models.game import Game
from app.models.competition import Competition


class GameBuilder:
    """
    Builder for creating games with minimal setup.

    Usage:
        game = GameBuilder(db_session, competition) \\
            .with_opponent("Flying Monkeys") \\
            .with_date(date) \\
            .build()
    """

    def __init__(self, db: Session, competition: Competition):
        self.db = db
        self.competition = competition
        self._opponent_name = "Opponent"
        self._date = datetime.now(timezone.utc).date()

    def with_opponent(self, opponent_name: str) -> "GameBuilder":
        self._opponent_name = opponent_name
        return self

    def with_date(self, date: datetime) -> "GameBuilder":
        self._date = date
        return self

    def build(self) -> Game:
        return games_crud.create_game(
            self.db,
            GameCreate(
                competition_id=self.competition.id,
                opponent_name=self._opponent_name,
                date=self._date
            )
        )
