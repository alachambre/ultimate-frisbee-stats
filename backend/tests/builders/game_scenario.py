"""
GameScenarioBuilder - High-level fluent API for constructing complete game scenarios.

Handles all the boilerplate of creating teams, competitions, games, players,
strategies, and points with proper relationships and timestamps.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session

from app.crud import (
    teams as teams_crud,
    competitions as competitions_crud,
    games as games_crud,
    players as players_crud,
    strategies as strategies_crud,
    points as points_crud,
    turnovers as turnovers_crud,
    calls as calls_crud,
)
from app.schemas.team import TeamCreate
from app.schemas.competition import CompetitionCreate
from app.schemas.game import GameCreate
from app.schemas.player import PlayerCreate, Gender
from app.schemas.strategy import StrategyCreate
from app.schemas.point import PointCreate, PointUpdate, PointFinish
from app.schemas.turnover import TurnoverCreate
from app.schemas.call import CallCreate, CallUpdate
from app.models.team import Team
from app.models.competition import Competition
from app.models.game import Game
from app.models.player import Player
from app.models.strategy import Strategy
from app.models.point import Point


class GameScenarioBuilder:
    """
    Builder for constructing game test scenarios with teams, competitions,
    games, players, strategies, and points.

    Usage:
        scenario = GameScenarioBuilder(db_session) \\
            .with_team("Test Team") \\
            .with_competition("Test Competition") \\
            .with_game("Opponent") \\
            .with_players(7)  # Creates 4M + 3W \\
            .with_offense_strategy("Vertical Stack") \\
            .with_defense_strategy("Zone") \\
            .with_completed_point(offense=True, won=True, duration_seconds=30) \\
            .with_completed_point(defense=True, pull=True, won=False, with_turnover=True) \\
            .build()

        # Access created objects
        team = scenario.team
        game = scenario.game
        players = scenario.players
    """

    def __init__(self, db: Session):
        self.db = db
        self.team: Optional[Team] = None
        self.competition: Optional[Competition] = None
        self.game: Optional[Game] = None
        self.players: List[Player] = []
        self.offense_strategies: List[Strategy] = []
        self.defense_strategies: List[Strategy] = []
        self.points: List[Point] = []

    def with_team(self, name: str = "Test Team") -> "GameScenarioBuilder":
        """Create a team"""
        self.team = teams_crud.create_team(
            self.db,
            TeamCreate(name=name)
        )
        return self

    def with_competition(
        self,
        name: str = "Test Competition",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> "GameScenarioBuilder":
        """Create a competition (requires team)"""
        if not self.team:
            self.with_team()

        if not start_date:
            start_date = datetime.now(timezone.utc).date()
        if not end_date:
            end_date = start_date + timedelta(days=7)

        self.competition = competitions_crud.create_competition(
            self.db,
            CompetitionCreate(
                team_id=self.team.id,
                name=name,
                start_date=start_date,
                end_date=end_date
            )
        )
        return self

    def with_game(
        self,
        opponent_name: str = "Opponent",
        date: Optional[datetime] = None
    ) -> "GameScenarioBuilder":
        """Create a game (requires competition)"""
        if not self.competition:
            self.with_competition()

        if not date:
            date = datetime.now(timezone.utc).date()

        self.game = games_crud.create_game(
            self.db,
            GameCreate(
                competition_id=self.competition.id,
                opponent_name=opponent_name,
                date=date
            )
        )
        return self

    def with_players(
        self,
        count: int = 7,
        men: Optional[int] = None,
        women: Optional[int] = None
    ) -> "GameScenarioBuilder":
        """
        Create players (requires team)

        Args:
            count: Total number of players (default 7)
            men: Number of men (default 4 if count=7, otherwise count-3)
            women: Number of women (default 3 if count=7, otherwise 3)
        """
        if not self.team:
            self.with_team()

        # Default split: 4M + 3W for 7 players
        if men is None:
            men = 4 if count == 7 else max(1, count - 3)
        if women is None:
            women = 3 if count == 7 else 3

        for i in range(1, men + 1):
            player = players_crud.create_player(
                self.db,
                PlayerCreate(
                    team_id=self.team.id,
                    name=f"Man {i}",
                    number=i,
                    gender=Gender.M
                )
            )
            self.players.append(player)

        for i in range(1, women + 1):
            player = players_crud.create_player(
                self.db,
                PlayerCreate(
                    team_id=self.team.id,
                    name=f"Woman {i}",
                    number=men + i,
                    gender=Gender.W
                )
            )
            self.players.append(player)

        return self

    def with_offense_strategy(self, name: str) -> "GameScenarioBuilder":
        """Create an offense strategy (requires team)"""
        if not self.team:
            self.with_team()

        strategy = strategies_crud.create_strategy(
            self.db,
            StrategyCreate(
                team_id=self.team.id,
                name=name,
                category="offense"
            )
        )
        self.offense_strategies.append(strategy)
        return self

    def with_defense_strategy(self, name: str) -> "GameScenarioBuilder":
        """Create a defense strategy (requires team)"""
        if not self.team:
            self.with_team()

        strategy = strategies_crud.create_strategy(
            self.db,
            StrategyCreate(
                team_id=self.team.id,
                name=name,
                category="defense"
            )
        )
        self.defense_strategies.append(strategy)
        return self

    def with_completed_point(
        self,
        point_number: Optional[int] = None,
        offense: bool = True,
        won: bool = True,
        strategy: Optional[Strategy] = None,
        duration_seconds: int = 60,
        pull: Optional[bool] = None,
        with_turnover: bool = False,
        with_call: bool = False,
        start_time: Optional[datetime] = None
    ) -> "GameScenarioBuilder":
        """
        Create a completed point with all required fields

        Args:
            point_number: Point number (auto-increments if None)
            offense: True for offense point, False for defense
            won: Whether the point was won
            strategy: Strategy to use (None = no strategy)
            duration_seconds: Point duration in seconds
            pull: Pull result (inbound=True, out=False, None=not tracked)
            with_turnover: Add a turnover to the point
            with_call: Add a call to the point
            start_time: Point start time (defaults to now + offset)
        """
        if not self.game:
            self.with_game()
        if not self.players:
            self.with_players()

        # Auto-increment point number
        if point_number is None:
            point_number = len(self.points) + 1

        # Strategy is explicitly provided (can be None)
        strategy_id = strategy.id if strategy else None

        # Calculate timestamps
        if start_time is None:
            # Offset by point count to avoid overlaps
            offset = len(self.points) * 100
            start_time = datetime.now(timezone.utc) + timedelta(seconds=offset)
        end_time = start_time + timedelta(seconds=duration_seconds)

        # Create point
        point = points_crud.create_point(
            self.db,
            PointCreate(
                game_id=self.game.id,
                point_number=point_number,
                starting_on_offense=offense,
                pull=pull,
                strategy_id=strategy_id
            )
        )

        # Add optional turnover
        if with_turnover:
            turnovers_crud.create_turnover(
                self.db,
                TurnoverCreate(
                    point_id=point.id,
                    timestamp=start_time + timedelta(seconds=duration_seconds // 2)
                )
            )

        # Add optional call
        if with_call:
            call = calls_crud.create_call(
                self.db,
                CallCreate(
                    point_id=point.id,
                    timestamp=start_time + timedelta(seconds=10)
                )
            )
            # Resume the call
            calls_crud.update_call(
                self.db,
                call.id,
                CallUpdate(
                    resume_timestamp=start_time + timedelta(seconds=20)
                )
            )

        # Complete point with players
        player_ids = [p.id for p in self.players[:7]]
        # Transition to running, set players/strategy/pull, and apply custom start time
        points_crud.update_point(
            self.db,
            point.id,
            PointUpdate(
                status="running",
                player_ids=player_ids,
                strategy_id=strategy_id,
                pull=pull,
                start_datetime=start_time
            )
        )

        # Finish the point with custom end time
        points_crud.finish_point(
            self.db,
            point.id,
            PointFinish(
                won=won,
                end_datetime=end_time
            )
        )

        # Refresh to get updated state
        self.db.refresh(point)
        self.points.append(point)
        return self

    def build(self) -> "GameScenarioBuilder":
        """
        Finalize the scenario and return self for accessing created objects
        """
        return self
