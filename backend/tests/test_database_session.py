"""
RAKTSETU - Unit Tests for Database Session Management & Transactions
Tests:
- Request-scoped session lifecycle
- Persistence across session closure and reopening
- Transaction rollback on exceptions
- Uncommitted change isolation
"""

import pytest
from sqlalchemy.orm import sessionmaker
from app.models.db_models import Organisation


def test_session_persistence_across_reopen(test_engine):
    """Data committed in one session must persist when queried from a new session."""
    SessionFactory = sessionmaker(bind=test_engine)

    # Session 1: Commit data
    session1 = SessionFactory()
    org = Organisation(
        org_id="ORG-SESSION-1",
        name="Session Test Organisation",
        type="Civic",
        coverage_zones=["Hadapsar"],
        lat=18.5018,
        lng=73.9260,
    )
    session1.add(org)
    session1.commit()
    session1.close()

    # Session 2: Read from new session
    session2 = SessionFactory()
    persisted = session2.query(Organisation).filter_by(org_id="ORG-SESSION-1").first()
    assert persisted is not None
    assert persisted.name == "Session Test Organisation"
    session2.close()


def test_transaction_rollback_on_error(test_engine):
    """Uncommitted changes must roll back cleanly when an error occurs."""
    SessionFactory = sessionmaker(bind=test_engine)
    session = SessionFactory()

    org = Organisation(
        org_id="ORG-ROLLBACK-1",
        name="Rollback Organisation",
        type="NGO",
        coverage_zones=["Aundh"],
        lat=18.5584,
        lng=73.8074,
    )
    session.add(org)
    # Simulate an error before commit
    session.rollback()

    # Verify not saved
    found = session.query(Organisation).filter_by(org_id="ORG-ROLLBACK-1").first()
    assert found is None
    session.close()
