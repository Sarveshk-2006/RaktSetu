"""
RAKTSETU - Test Configuration and Fixtures
Provides isolated in-memory SQLite database sessions for unit and integration testing.
Ensures zero pollution of developer or production databases.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models.db_models import (
    Organisation,
    Donor,
    BloodRequirement,
    Incident,
    ResponseWave,
    ContactAttempt,
    DonorResponse,
    FulfilmentRecord,
    AuditEvent,
)


@pytest.fixture(scope="function")
def test_engine():
    """Create an isolated in-memory SQLite engine with StaticPool for thread/session safety."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(test_engine):
    """Yields a transactional database session for each test function, rolled back afterwards."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
