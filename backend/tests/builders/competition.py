"""
CompetitionBuilder - Simple builder for creating competitions.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.crud import competitions as competitions_crud
from app.schemas.competition import CompetitionCreate
from app.models.competition import Competition
from app.models.team import Team


class CompetitionBuilder:
    """
    Builder for creating competitions with minimal setup.

    Usage:
        competition = CompetitionBuilder(db_session, team) \\
            .with_name("Spring League") \\
            .with_dates(start_date, end_date) \\
            .build()
    """

    def __init__(self, db: Session, team: Team):
        self.db = db
        self.team = team
        self._name = "Test Competition"
        self._start_date = datetime.now(timezone.utc).date()
        self._end_date = self._start_date + timedelta(days=7)

    def with_name(self, name: str) -> "CompetitionBuilder":
        self._name = name
        return self

    def with_dates(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> "CompetitionBuilder":
        if start_date:
            self._start_date = start_date
        if end_date:
            self._end_date = end_date
        return self

    def build(self) -> Competition:
        return competitions_crud.create_competition(
            self.db,
            CompetitionCreate(
                team_id=self.team.id,
                name=self._name,
                start_date=self._start_date,
                end_date=self._end_date
            )
        )
