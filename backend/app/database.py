from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Get database URL from environment variable, fallback to SQLite for local development
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./ultimate_stats.db"  # SQLite fallback for easy local testing
)

# SQLite-specific: Use check_same_thread=False to allow FastAPI to work properly
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Helper function to initialize the database (create all tables)
def init_db():
    from app.models import Base
    Base.metadata.create_all(bind=engine)
