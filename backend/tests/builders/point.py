"""
PointBuilder - Fine-grained control for creating individual points.

Use when you need precise control over point creation with complex scenarios
(multiple turnovers, specific call timings, etc.)
"""
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session

from app.crud import points as points_crud, turnovers as turnovers_crud, stoppages as stoppages_crud
from app.schemas.point import PointCreate, PointUpdate
from app.schemas.turnover import TurnoverCreate
from app.schemas.stoppage import StoppageCreate, StoppageUpdate
from app.models.point import Point


class PointBuilder:
    """
    Builder for creating individual points with fine-grained control.

    Usage:
        point = PointBuilder(db_session, game_id, player_ids) \\
            .offense() \\
            .with_strategy(strategy_id) \\
            .with_duration(seconds=45) \\
            .won() \\
            .with_turnover(timestamp) \\
            .complete()
    """

    def __init__(self, db: Session, game_id: int, player_ids: List[int]):
        self.db = db
        self.game_id = game_id
        self.player_ids = player_ids
        self.point_number = 1
        self._offense = True
        self._won = False
        self._strategy_id = None
        self._field_side = None
        self._pull = None
        self._start_time = datetime.now(timezone.utc)
        self._duration = 60
        self._turnovers = []
        self._stoppages = []

    def offense(self) -> "PointBuilder":
        self._offense = True
        return self

    def defense(self) -> "PointBuilder":
        self._offense = False
        return self

    def won(self) -> "PointBuilder":
        self._won = True
        return self

    def lost(self) -> "PointBuilder":
        self._won = False
        return self

    def number(self, n: int) -> "PointBuilder":
        self.point_number = n
        return self

    def with_strategy(self, strategy_id: int) -> "PointBuilder":
        self._strategy_id = strategy_id
        return self

    def with_field_side(self, field_side: str) -> "PointBuilder":
        self._field_side = field_side
        return self

    def with_pull(self, inbound: bool) -> "PointBuilder":
        self._pull = inbound
        return self

    def with_duration(self, seconds: int) -> "PointBuilder":
        self._duration = seconds
        return self

    def start_at(self, timestamp: datetime) -> "PointBuilder":
        self._start_time = timestamp
        return self

    def with_turnover(self, seconds_from_start: int = 30) -> "PointBuilder":
        self._turnovers.append((seconds_from_start, "other"))
        return self

    def with_turnover_type(
        self,
        seconds_from_start: int = 30,
        turnover_type: str = "other",
    ) -> "PointBuilder":
        self._turnovers.append((seconds_from_start, turnover_type))
        return self

    def with_stoppage(self, start: int = 10, duration: int = 10) -> "PointBuilder":
        self._stoppages.append((start, duration))
        return self

    def with_call(self, start: int = 10, duration: int = 10) -> "PointBuilder":
        # Backward-compatible alias used by existing tests/builders.
        self._stoppages.append((start, duration))
        return self

    def complete(self) -> Point:
        """Create and complete the point"""
        # Create point
        point = points_crud.create_point(
            self.db,
            PointCreate(
                game_id=self.game_id,
                point_number=self.point_number,
                starting_on_offense=self._offense,
                field_side=self._field_side,
                pull=self._pull,
                strategy_id=self._strategy_id
            )
        )

        # Move point to running first (required lifecycle transition)
        points_crud.update_point(
            self.db,
            point.id,
            PointUpdate(
                status="running",
                start_datetime=self._start_time,
                player_ids=self.player_ids,
                field_side=self._field_side,
            )
        )

        # Add turnovers
        for offset, turnover_type in self._turnovers:
            turnovers_crud.create_turnover(
                self.db,
                TurnoverCreate(
                    point_id=point.id,
                    timestamp=self._start_time + timedelta(seconds=offset),
                    turnover_type=turnover_type,
                )
            )

        # Add stoppages
        for start, duration in self._stoppages:
            stoppage = stoppages_crud.create_stoppage(
                self.db,
                StoppageCreate(
                    point_id=point.id,
                    call_timestamp=self._start_time + timedelta(seconds=start)
                )
            )
            stoppages_crud.update_stoppage(
                self.db,
                stoppage.id,
                StoppageUpdate(
                    resume_timestamp=self._start_time + timedelta(seconds=start + duration)
                )
            )

        # Complete point
        end_time = self._start_time + timedelta(seconds=self._duration)
        points_crud.update_point(
            self.db,
            point.id,
            PointUpdate(
                status="completed",
                won=self._won,
                end_datetime=end_time,
                player_ids=self.player_ids,
            )
        )

        self.db.refresh(point)
        return point
