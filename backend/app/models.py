from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

# Association table for many-to-many relationship between Point and Player
point_players = Table(
    'point_players',
    Base.metadata,
    Column('point_id', Integer, ForeignKey('points.id', ondelete='CASCADE'), primary_key=True),
    Column('player_id', Integer, ForeignKey('players.id', ondelete='CASCADE'), primary_key=True)
)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    players = relationship("Player", back_populates="team", cascade="all, delete-orphan")
    games = relationship("Game", back_populates="team", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    number = Column(Integer, nullable=True)  # Jersey number (optional)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    team = relationship("Team", back_populates="players")
    points = relationship("Point", secondary=point_players, back_populates="players")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    opponent_name = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, default="in_progress", nullable=False)  # in_progress | finished
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    team = relationship("Team", back_populates="games")
    points = relationship("Point", back_populates="game", cascade="all, delete-orphan")


class Point(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    point_number = Column(Integer, nullable=False)  # Sequential number within the game
    starting_on_offense = Column(Boolean, nullable=False)  # True if we started with the disc
    won = Column(Boolean, nullable=True)  # True if we won the point (nullable while active)
    status = Column(String, default="active", nullable=False)  # "active" | "completed"
    start_datetime = Column(DateTime, nullable=True)  # When point started
    end_datetime = Column(DateTime, nullable=True)  # When point finished
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    game = relationship("Game", back_populates="points")
    players = relationship("Player", secondary=point_players, back_populates="points")

    # Note: V2 will add Event model with relationship here
    # events = relationship("Event", back_populates="point", cascade="all, delete-orphan")
