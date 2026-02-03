"""
PlayerBuilder - Simple builder for creating players.
"""
from sqlalchemy.orm import Session
from app.crud import players as players_crud
from app.schemas.player import PlayerCreate, Gender
from app.models.player import Player
from app.models.team import Team


class PlayerBuilder:
    """
    Builder for creating players with minimal setup.

    Usage:
        player = PlayerBuilder(db_session, team) \\
            .with_name("John Doe") \\
            .with_number(42) \\
            .male() \\
            .build()
    """

    def __init__(self, db: Session, team: Team):
        self.db = db
        self.team = team
        self._name = "Test Player"
        self._number = 1
        self._gender = Gender.M

    def with_name(self, name: str) -> "PlayerBuilder":
        self._name = name
        return self

    def with_number(self, number: int) -> "PlayerBuilder":
        self._number = number
        return self

    def male(self) -> "PlayerBuilder":
        self._gender = Gender.M
        return self

    def female(self) -> "PlayerBuilder":
        self._gender = Gender.W
        return self

    def with_gender(self, gender: Gender) -> "PlayerBuilder":
        self._gender = gender
        return self

    def build(self) -> Player:
        return players_crud.create_player(
            self.db,
            PlayerCreate(
                team_id=self.team.id,
                name=self._name,
                number=self._number,
                gender=self._gender
            )
        )
