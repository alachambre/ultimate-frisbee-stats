"""
StrategyBuilder - Simple builder for creating strategies.
"""
from sqlalchemy.orm import Session
from app.crud import strategies as strategies_crud
from app.schemas.strategy import StrategyCreate
from app.models.strategy import Strategy
from app.models.team import Team


class StrategyBuilder:
    """
    Builder for creating strategies with minimal setup.

    Usage:
        strategy = StrategyBuilder(db_session, team) \\
            .with_name("Vertical Stack") \\
            .offense() \\
            .build()
    """

    def __init__(self, db: Session, team: Team):
        self.db = db
        self.team = team
        self._name = "Test Strategy"
        self._category = "offense"

    def with_name(self, name: str) -> "StrategyBuilder":
        self._name = name
        return self

    def offense(self) -> "StrategyBuilder":
        self._category = "offense"
        return self

    def defense(self) -> "StrategyBuilder":
        self._category = "defense"
        return self

    def with_category(self, category: str) -> "StrategyBuilder":
        self._category = category
        return self

    def build(self) -> Strategy:
        return strategies_crud.create_strategy(
            self.db,
            StrategyCreate(
                team_id=self.team.id,
                name=self._name,
                category=self._category
            )
        )
