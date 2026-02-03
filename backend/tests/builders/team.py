"""
TeamBuilder - Simple builder for creating teams.
"""
from sqlalchemy.orm import Session
from app.crud import teams as teams_crud
from app.schemas.team import TeamCreate
from app.models.team import Team


class TeamBuilder:
    """
    Builder for creating teams with minimal setup.

    Usage:
        team = TeamBuilder(db_session).with_name("Flying Monkeys").build()
    """

    def __init__(self, db: Session):
        self.db = db
        self._name = "Test Team"

    def with_name(self, name: str) -> "TeamBuilder":
        self._name = name
        return self

    def build(self) -> Team:
        return teams_crud.create_team(
            self.db,
            TeamCreate(name=self._name)
        )
