"""
RAKTSETU - Database Infrastructure
SQLAlchemy 2.0 Engine, Declarative Base, and Request-Scoped Session Factory.
Supports both SQLite (local dev & testing) and PostgreSQL (production).
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# SQLite requires check_same_thread=False for multi-threaded FastAPI handlers
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=settings.DATABASE_ECHO,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a request-scoped database session.
    Automatically closes session upon request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables(target_engine=None) -> None:
    """Create all tables defined on Base metadata."""
    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)


def drop_all_tables(target_engine=None) -> None:
    """Drop all tables defined on Base metadata."""
    eng = target_engine or engine
    Base.metadata.drop_all(bind=eng)
