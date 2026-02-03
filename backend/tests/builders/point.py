"""
PointBuilder - Fine-grained control for creating individual points.

Use when you need precise control over point creation with complex scenarios
(multiple turnovers, specific call timings, etc.)
"""
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session

from app.crud import points as points_crud, turnovers as turnovers_crud, calls as calls_crud
from app.schemas.point import PointCreate, PointUpdate
from app.schemas.turnover import TurnoverCreate
from app.schemas.call import CallCreate, CallUpdate
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
        self._pull = None
        self._start_time = datetime.now(timezone.utc)
        self._duration = 60
        self._turnovers = []
        self._calls = []

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
        self._turnovers.append(seconds_from_start)
        return self

    def with_call(self, start: int = 10, duration: int = 10) -> "PointBuilder":
        self._calls.append((start, duration))
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
                pull=self._pull,
                strategy_id=self._strategy_id
            )
        )

        # Add turnovers
        for offset in self._turnovers:
            turnovers_crud.create_turnover(
                self.db,
                TurnoverCreate(
                    point_id=point.id,
                    timestamp=self._start_time + timedelta(seconds=offset)
                )
            )

        # Add calls
        for start, duration in self._calls:
            call = calls_crud.create_call(
                self.db,
                CallCreate(
                    point_id=point.id,
                    timestamp=self._start_time + timedelta(seconds=start)
                )
            )
            calls_crud.update_call(
                self.db,
                call.id,
                CallUpdate(
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
                start_datetime=self._start_time,
                end_datetime=end_time,
                player_ids=self.player_ids
            )
        )

        self.db.refresh(point)
        return point
