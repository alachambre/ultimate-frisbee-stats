"""
Base classes, enums, and association tables for database models
"""
from sqlalchemy import Table, Column, Integer, ForeignKey, Enum, Index
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


# Enums
class GenderEnum(enum.Enum):
    M = "M"
    W = "W"


class CompetitionStatusEnum(enum.Enum):
    ongoing = "ongoing"
    completed = "completed"


class GameStatusEnum(enum.Enum):
    ready = "ready"
    started = "started"
    ended = "ended"


class PointStatusEnum(enum.Enum):
    ready = "ready"
    running = "running"
    scored = "scored"
    completed = "completed"


class StrategyCategory(enum.Enum):
    offense = "offense"
    defense = "defense"


# Association Tables
point_players = Table(
    'point_players',
    Base.metadata,
    Column('point_id', Integer, ForeignKey('points.id', ondelete='CASCADE'), primary_key=True),
    Column('player_id', Integer, ForeignKey('players.id', ondelete='CASCADE'), primary_key=True),
    Index('idx_point_players_player_id', 'player_id'),
)

competition_players = Table(
    'competition_players',
    Base.metadata,
    Column('competition_id', Integer, ForeignKey('competitions.id', ondelete='CASCADE'), primary_key=True),
    Column('player_id', Integer, ForeignKey('players.id', ondelete='CASCADE'), primary_key=True)
)

line_players = Table(
    'line_players',
    Base.metadata,
    Column('line_id', Integer, ForeignKey('lines.id', ondelete='CASCADE'), primary_key=True),
    Column('player_id', Integer, ForeignKey('players.id', ondelete='CASCADE'), primary_key=True)
)

game_players = Table(
    'game_players',
    Base.metadata,
    Column('game_id', Integer, ForeignKey('games.id', ondelete='CASCADE'), primary_key=True),
    Column('player_id', Integer, ForeignKey('players.id', ondelete='CASCADE'), primary_key=True)
)
