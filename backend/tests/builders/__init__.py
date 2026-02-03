"""
Test builders for constructing test scenarios with minimal boilerplate.

Simple entity builders:
    from tests.builders import TeamBuilder, PlayerBuilder, StrategyBuilder

Complex scenario builders:
    from tests.builders import GameScenarioBuilder, PointBuilder
"""
from .team import TeamBuilder
from .competition import CompetitionBuilder
from .game import GameBuilder
from .player import PlayerBuilder
from .strategy import StrategyBuilder
from .line import LineBuilder
from .game_scenario import GameScenarioBuilder
from .point import PointBuilder

__all__ = [
    # Simple entity builders
    "TeamBuilder",
    "CompetitionBuilder",
    "GameBuilder",
    "PlayerBuilder",
    "StrategyBuilder",
    "LineBuilder",
    # Complex scenario builders
    "GameScenarioBuilder",
    "PointBuilder",
]
