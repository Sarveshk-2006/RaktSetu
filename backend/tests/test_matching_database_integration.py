"""
RAKTSETU - Unit Tests for Database Matching Integration & Duplicate Outreach Protection
Tests:
- End-to-end incident matching against seeded database records
- Automatic exclusion of donors already contacted across previous waves
- Persistence-level DuplicateOutreachError on duplicate attempt dispatch
"""

import pytest
from app.db.seed import seed_database
from app.services.matching import (
    match_donors_for_incident,
    record_contact_attempt_safe,
    DuplicateOutreachError,
)
from app.models.db_models import Incident, Donor, ResponseWave


def test_database_matching_excludes_previously_contacted_donors(db_session):
    """
    In the canonical seed:
    - Incident 'INC-PN-48291' has Wave 1 with contact attempts for D1042, D3819, D5127
    - Wave 2 has contact attempts for D8821, D2234
    Running matching for INC-PN-48291 must NOT recommend any of these 5 already-contacted donors.
    """
    seed_database(db_session, donor_count=60)

    res = match_donors_for_incident(db_session, "INC-PN-48291", limit=10)

    recommended_ids = {c.donor_id for c in res.candidates}
    already_contacted = {"D1042", "D3819", "D5127", "D8821", "D2234"}

    # No already-contacted donor should be recommended
    overlap = recommended_ids.intersection(already_contacted)
    assert len(overlap) == 0, f"Found already-contacted donors in recommendations: {overlap}"

    # Confirm they appear in exclusions with ALREADY_CONTACTED reason
    excluded_map = {e.donor_id: e.reason_code for e in res.exclusions}
    for contacted_id in already_contacted:
        assert contacted_id in excluded_map
        assert excluded_map[contacted_id] == "ALREADY_CONTACTED"

    # All recommended candidates must be compatible with O- (i.e. O-)
    for cand in res.candidates:
        assert cand.blood_group == "O-"


def test_record_contact_attempt_safe_blocks_duplicate_dispatch(db_session):
    """
    Verify that record_contact_attempt_safe enforces the persistence-level constraint
    and raises DuplicateOutreachError when attempting to re-contact a donor.
    """
    seed_database(db_session, donor_count=20)

    incident = db_session.query(Incident).filter_by(incident_id="INC-PN-48291").first()
    wave = db_session.query(ResponseWave).filter_by(incident_id=incident.id, wave_number=1).first()
    donor = db_session.query(Donor).filter_by(donor_id="D1042").first()

    # D1042 was already contacted in Wave 1 in seed data.
    # Attempting to dispatch another outreach for the same incident must raise DuplicateOutreachError.
    with pytest.raises(DuplicateOutreachError):
        record_contact_attempt_safe(
            db=db_session,
            incident_id=incident.id,
            wave_id=wave.id,
            donor_id=donor.id,
        )


def test_matching_nonexistent_incident_raises_value_error(db_session):
    """Querying matching for a non-existent incident raises ValueError."""
    with pytest.raises(ValueError, match="not found"):
        match_donors_for_incident(db_session, "INC-DOES-NOT-EXIST")
