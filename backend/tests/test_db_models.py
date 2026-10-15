"""
RAKTSETU - Unit Tests for Canonical Database Models & Constraints
Tests:
- ORM model creation and foreign key relationships
- Check constraints (positive units requested, non-negative units secured)
- Unique constraints (incident_id, duplicate outreach prevention)
- Fulfilment record validation
"""

import pytest
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError

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


def test_organisation_creation(db_session):
    """Test creating an Organisation with JSON coverage zones."""
    org = Organisation(
        org_id="ORG-TEST-1",
        name="Pune Red Cross",
        type="BloodBank",
        status="Active",
        coverage_zones=["Kothrud", "Deccan"],
        contact_available=True,
        lat=18.5074,
        lng=73.8077,
        active_donors_count=120,
        is_synthetic=True,
    )
    db_session.add(org)
    db_session.commit()

    saved = db_session.query(Organisation).filter_by(org_id="ORG-TEST-1").first()
    assert saved is not None
    assert saved.name == "Pune Red Cross"
    assert "Kothrud" in saved.coverage_zones
    assert saved.is_synthetic is True


def test_donor_creation_and_relationships(db_session):
    """Test Donor creation linked to an Organisation."""
    org = Organisation(
        org_id="ORG-TEST-2",
        name="Tech Community Donors",
        type="Community",
        status="Active",
        coverage_zones=["Baner"],
        lat=18.5590,
        lng=73.7868,
    )
    db_session.add(org)
    db_session.commit()

    donor = Donor(
        donor_id="D9901",
        blood_group="O-",
        readiness="Ready",
        consent_given=True,
        contact_permission=True,
        organisation_id=org.id,
        zone="Baner",
        district="Pune",
        lat=18.5590,
        lng=73.7868,
        response_rate=0.85,
        avg_response_time_minutes=10.5,
        recent_load=1,
        contact_reliability=0.95,
    )
    db_session.add(donor)
    db_session.commit()

    saved_donor = db_session.query(Donor).filter_by(donor_id="D9901").first()
    assert saved_donor is not None
    assert saved_donor.organisation is not None
    assert saved_donor.organisation.org_id == "ORG-TEST-2"
    assert saved_donor.recent_load == 1


def test_incident_and_requirement_lifecycle(db_session):
    """Test full hierarchy: BloodRequirement -> Incident -> Waves -> Attempts -> Responses -> Fulfilment."""
    req = BloodRequirement(
        requirement_id="REQ-TEST-101",
        blood_group="O-",
        component="Packed RBC",
        units_requested=2,
        urgency="Critical",
        requesting_facility="Sahyadri Hospital",
        zone="Wagholi",
        district="Pune",
        lat=18.5593,
        lng=73.9826,
        source="Hospital",
        verification_status="Verified",
    )
    db_session.add(req)
    db_session.commit()

    incident = Incident(
        incident_id="INC-TEST-101",
        requirement_id=req.id,
        status="Mobilising",
        units_requested=2,
        units_secured=1,
        response_stage="Wave 1",
        operator_id="OP-TEST-USER",
    )
    db_session.add(incident)
    db_session.commit()

    # Wave 1
    wave1 = ResponseWave(
        incident_id=incident.id,
        wave_number=1,
        status="Active",
        donors_contacted=1,
        units_secured=1,
    )
    db_session.add(wave1)
    db_session.commit()

    donor = Donor(
        donor_id="D9902",
        blood_group="O-",
        readiness="Ready",
        zone="Wagholi",
        lat=18.5593,
        lng=73.9826,
    )
    db_session.add(donor)
    db_session.commit()

    attempt = ContactAttempt(
        incident_id=incident.id,
        wave_id=wave1.id,
        donor_id=donor.id,
        status="Delivered",
    )
    db_session.add(attempt)
    db_session.commit()

    response = DonorResponse(
        contact_attempt_id=attempt.id,
        donor_id=donor.id,
        response="Accepted",
        eta_minutes=15,
        distance_km=4.2,
    )
    db_session.add(response)
    db_session.commit()

    # Clinical fulfilment by hospital
    fulfilment = FulfilmentRecord(
        incident_id=incident.id,
        units_confirmed=1,
        component="Packed RBC",
        confirmation_source="Sahyadri Blood Center",
        confirmed_by="Dr. Patwardhan",
    )
    db_session.add(fulfilment)
    db_session.commit()

    # Assert navigation of relationships
    queried_inc = db_session.query(Incident).filter_by(incident_id="INC-TEST-101").first()
    assert queried_inc.requirement.requirement_id == "REQ-TEST-101"
    assert len(queried_inc.waves) == 1
    assert queried_inc.waves[0].wave_number == 1
    assert len(queried_inc.contact_attempts) == 1
    assert queried_inc.contact_attempts[0].response.response == "Accepted"
    assert len(queried_inc.fulfilment_records) == 1
    assert queried_inc.fulfilment_records[0].confirmed_by == "Dr. Patwardhan"


def test_unique_incident_identifier(db_session):
    """Enforce that public incident IDs cannot be duplicated."""
    req1 = BloodRequirement(
        requirement_id="REQ-DUP-1",
        blood_group="A+",
        units_requested=1,
        requesting_facility="Facility 1",
        zone="Baner",
        lat=18.5,
        lng=73.8,
    )
    req2 = BloodRequirement(
        requirement_id="REQ-DUP-2",
        blood_group="A+",
        units_requested=1,
        requesting_facility="Facility 2",
        zone="Kothrud",
        lat=18.5,
        lng=73.8,
    )
    db_session.add_all([req1, req2])
    db_session.commit()

    inc1 = Incident(
        incident_id="INC-UNIQUE-01",
        requirement_id=req1.id,
        status="Verified",
        units_requested=1,
    )
    db_session.add(inc1)
    db_session.commit()

    # Attempt to insert identical incident_id
    inc2 = Incident(
        incident_id="INC-UNIQUE-01",
        requirement_id=req2.id,
        status="Verified",
        units_requested=1,
    )
    db_session.add(inc2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_duplicate_outreach_prevention_constraint(db_session):
    """
    CRITICAL RAKTSETU PRINCIPLE:
    Prevent contacting the same donor more than once for the same incident workflow.
    """
    req = BloodRequirement(
        requirement_id="REQ-OUTREACH-1",
        blood_group="B+",
        units_requested=2,
        requesting_facility="Ruby Hall",
        zone="Kothrud",
        lat=18.5,
        lng=73.8,
    )
    db_session.add(req)
    db_session.commit()

    inc = Incident(
        incident_id="INC-OUTREACH-1",
        requirement_id=req.id,
        status="Mobilising",
        units_requested=2,
    )
    db_session.add(inc)
    db_session.commit()

    wave1 = ResponseWave(incident_id=inc.id, wave_number=1, status="Insufficient")
    wave2 = ResponseWave(incident_id=inc.id, wave_number=2, status="Active")
    donor = Donor(donor_id="D-OVERLOAD", blood_group="B+", readiness="Ready", zone="Kothrud", lat=18.5, lng=73.8)
    db_session.add_all([wave1, wave2, donor])
    db_session.commit()

    # Attempt 1 in Wave 1
    attempt1 = ContactAttempt(incident_id=inc.id, wave_id=wave1.id, donor_id=donor.id)
    db_session.add(attempt1)
    db_session.commit()

    # Attempt 2 in Wave 2 for the SAME donor and SAME incident -> MUST FAIL
    attempt2 = ContactAttempt(incident_id=inc.id, wave_id=wave2.id, donor_id=donor.id)
    db_session.add(attempt2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_positive_units_check_constraint(db_session):
    """Enforce that requirements cannot be created with 0 or negative units."""
    req_invalid = BloodRequirement(
        requirement_id="REQ-ZERO-UNITS",
        blood_group="O+",
        units_requested=0,  # Invalid!
        requesting_facility="Test Clinic",
        zone="Wakad",
        lat=18.5,
        lng=73.8,
    )
    db_session.add(req_invalid)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_audit_event_logging(db_session):
    """Test AuditEvent persistence with safe metadata and SHA-256 hash."""
    audit = AuditEvent(
        event_id="LOG-TEST-001",
        timestamp=datetime.now(timezone.utc),
        incident_id="INC-TEST-101",
        actor="Operator OP-1",
        actor_type="Operator",
        category="Verification",
        action="REQUIREMENT_VERIFIED",
        entity_type="Incident",
        entity_id="INC-TEST-101",
        outcome="Success",
        safe_metadata={"blood_group": "O-", "units": 2},
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    db_session.add(audit)
    db_session.commit()

    saved = db_session.query(AuditEvent).filter_by(event_id="LOG-TEST-001").first()
    assert saved is not None
    assert saved.action == "REQUIREMENT_VERIFIED"
    assert saved.safe_metadata["blood_group"] == "O-"
