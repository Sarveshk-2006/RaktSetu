"""
RAKTSETU - Unit Tests for Idempotent Database Seeding
Tests:
- First seed execution populates all canonical records
- Repeated seed execution produces ZERO duplicate records (100% idempotent)
- Seeded data contains valid domain models and references
"""

from app.db.seed import seed_database
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


def test_seed_database_idempotency(db_session):
    """Running the seed script twice must insert records on first run, and 0 on second run."""
    # Run 1: Initial seed
    res1 = seed_database(db_session, donor_count=50)
    assert res1["organisations"] == 5
    assert res1["donors"] == 50
    assert res1["incidents"] == 4
    assert res1["requirements"] == 4
    assert res1["waves"] == 2
    assert res1["contact_attempts"] == 5
    assert res1["donor_responses"] == 3
    assert res1["fulfilments"] == 1
    assert res1["audit_events"] == 4

    # Run 2: Re-run seed on same database session
    res2 = seed_database(db_session, donor_count=50)
    assert res2["organisations"] == 0
    assert res2["donors"] == 0
    assert res2["incidents"] == 0
    assert res2["requirements"] == 0
    assert res2["waves"] == 0
    assert res2["contact_attempts"] == 0
    assert res2["donor_responses"] == 0
    assert res2["fulfilments"] == 0
    assert res2["audit_events"] == 0

    # Verify counts in database
    assert db_session.query(Organisation).count() == 5
    assert db_session.query(Donor).count() == 50
    assert db_session.query(Incident).count() == 4
    assert db_session.query(BloodRequirement).count() == 4

    # Verify canonical incident INC-PN-48291 exists with correct state
    demo_inc = db_session.query(Incident).filter_by(incident_id="INC-PN-48291").first()
    assert demo_inc is not None
    assert demo_inc.status == "Mobilising"
    assert demo_inc.requirement.blood_group == "O-"
    assert demo_inc.units_requested == 2
    assert demo_inc.units_secured == 1
    assert len(demo_inc.waves) == 2
