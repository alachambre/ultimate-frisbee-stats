"""
Base classes, enums, and association tables for database models
"""
from sqlalchemy import Table, Column, Integer, ForeignKey, Enum
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


# Association Tables
point_players = Table(
    'point_players',
    Base.metadata,
    Column('point_id', Integer, ForeignKey('points.id', ondelete='CASCADE'), primary_key=True),
    Column('player_id', Integer, ForeignKey('players.id', ondelete='CASCADE'), primary_key=True)
)

competition_players = Table(
    'competition_players',
    Base.metadata,
    Column('competition_id', Integer, ForeignKey('competitions.id', ondelete='CASCADE'), primary_key=True),
    Column('player_id', Integer, ForeignKey('players.id', ondelete='CASCADE'), primary_key=True)
)
