"""
RAKTSETU - Unit & Service Tests for Response Cascade Engine
Tests wave launching, candidate cohort selection, duplicate outreach prevention across waves,
database constraint enforcement, idempotent donor responses, and escalation policies.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.db_models import (
    Incident,
    BloodRequirement,
    ResponseWave,
    ContactAttempt,
    Donor,
    DonorResponse,
    AuditEvent,
)
from app.models.models import IncidentCreateRequest, IncidentUrgency, BloodGroup
from app.core.exceptions import (
    UnverifiedRequirementError,
    ActiveWaveExistsError,
    WaveProgressionError,
    DuplicateOutreachError,
    InvalidResponseStatusError,
)
from app.services.incident_service import create_requirement_and_incident, verify_incident_requirement
from app.services.cascade import (
    launch_response_wave,
    record_donor_response,
    advance_or_evaluate_wave,
)
from app.services.matching import record_contact_attempt_safe


@pytest.fixture
def cascade_db():
    """Provides an isolated database populated with synthetic donor pool for cascade tests."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Populate 10 synthetic donors in Pune
    blood_groups = ["O-", "O-", "O+", "O+", "A+", "A-", "B+", "B-", "AB+", "AB-"]
    zones = ["Wagholi", "Hadapsar", "Kothrud", "Baner", "Aundh"]
    for i, bg in enumerate(blood_groups):
        donor = Donor(
            donor_id=f"D{str(i + 1).zfill(4)}",
            blood_group=bg,
            readiness="Ready",
            consent_given=True,
            contact_permission=True,
            zone=zones[i % len(zones)],
            district="Pune",
            lat=18.5204 + (i * 0.01),
            lng=73.8567 + (i * 0.01),
            response_rate=0.85,
            avg_response_time_minutes=10.0,
            recent_load=0,
            contact_reliability=0.90,
            is_active=True,
            is_synthetic=True,
        )
        session.add(donor)
    session.commit()

    try:
        yield session
    finally:
        session.close()


def test_wave_launch_requires_verified_requirement(cascade_db):
    """Unverified requirement strictly blocks wave launch and donor mobilisation."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.O_NEG,
        units_requested=2,
        urgency=IncidentUrgency.CRITICAL,
        requesting_facility="Sahyadri Hospital",
        zone="Wagholi",
        lat=18.5593,
        lng=73.9826,
        auto_verify=False,  # Unverified
    )
    incident = create_requirement_and_incident(cascade_db, req_dto)

    with pytest.raises(UnverifiedRequirementError) as exc_info:
        launch_response_wave(cascade_db, incident.incident_id, wave_size=3)

    assert "Only Verified requirements can initiate donor mobilisation" in str(exc_info.value)


def test_initial_wave_launch_persists_pending_dispatch(cascade_db):
    """Verifies that launching Wave 1 creates ResponseWave and ContactAttempts with PendingDispatch."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.O_NEG,
        units_requested=2,
        urgency=IncidentUrgency.CRITICAL,
        requesting_facility="Sahyadri Hospital",
        zone="Wagholi",
        lat=18.5593,
        lng=73.9826,
        auto_verify=True,
    )
    incident = create_requirement_and_incident(cascade_db, req_dto)

    # Launch Wave 1 with wave_size=2
    result = launch_response_wave(cascade_db, incident.incident_id, wave_size=2)

    assert result.status == "Active"
    assert result.wave_number == 1
    assert result.donors_contacted == 2
    assert len(result.candidates) == 2

    # Check database persistence
    db_wave = cascade_db.query(ResponseWave).filter_by(incident_id=incident.id, wave_number=1).first()
    assert db_wave is not None
    assert db_wave.status == "Active"
    assert db_wave.donors_contacted == 2

    attempts = cascade_db.query(ContactAttempt).filter_by(incident_id=incident.id).all()
    assert len(attempts) == 2
    for att in attempts:
        assert att.status == "PendingDispatch"
        assert att.wave_id == db_wave.id

    # Check incident transitioned to Mobilising
    cascade_db.refresh(incident)
    assert incident.status == "Mobilising"
    assert incident.response_stage == "Wave 1"


def test_active_wave_blocks_concurrent_new_wave(cascade_db):
    """Verifies that an ongoing Active wave blocks launching another wave without prior evaluation."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.O_POS,
        units_requested=3,
        urgency=IncidentUrgency.HIGH,
        requesting_facility="KEM Hospital",
        zone="Shivajinagar",
        lat=18.5204,
        lng=73.8567,
        auto_verify=True,
    )
    incident = create_requirement_and_incident(cascade_db, req_dto)

    # Launch Wave 1
    launch_response_wave(cascade_db, incident.incident_id, wave_size=2)

    # Attempting to launch Wave 2 while Wave 1 is still Active must be rejected
    with pytest.raises(ActiveWaveExistsError) as exc:
        launch_response_wave(cascade_db, incident.incident_id, wave_size=2)

    assert "is currently Active. Evaluate or advance it before launching a new wave." in str(exc.value)


def test_duplicate_outreach_excluded_across_successive_waves(cascade_db):
    """Verifies that candidates contacted in Wave 1 are excluded from Wave 2."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.O_NEG,  # In cascade_db fixture, donors D0001 and D0002 are O-
        units_requested=2,
        urgency=IncidentUrgency.CRITICAL,
        requesting_facility="Sahyadri Hospital",
        zone="Wagholi",
        lat=18.5593,
        lng=73.9826,
        auto_verify=True,
    )
    incident = create_requirement_and_incident(cascade_db, req_dto)

    # Launch Wave 1 with 1 candidate
    w1_res = launch_response_wave(cascade_db, incident.incident_id, wave_size=1)
    w1_donor = w1_res.candidates[0].donor_id

    # Complete Wave 1
    advance_or_evaluate_wave(cascade_db, incident.incident_id, wave_number=1, action="complete")

    # Launch Wave 2
    w2_res = launch_response_wave(cascade_db, incident.incident_id, wave_size=1)
    w2_donor = w2_res.candidates[0].donor_id

    # The donor contacted in Wave 2 must be different from Wave 1!
    assert w1_donor != w2_donor

    # Complete Wave 2
    advance_or_evaluate_wave(cascade_db, incident.incident_id, wave_number=2, action="complete")

    # Launch Wave 3: With only 2 O- donors in DB, candidate pool is now exhausted!
    w3_res = launch_response_wave(cascade_db, incident.incident_id, wave_size=1)
    assert w3_res.status == "Escalated"
    assert w3_res.donors_contacted == 0
    assert "exhausted" in w3_res.message.lower()

    # Incident status must be Escalated
    cascade_db.refresh(incident)
    assert incident.status == "Escalated"


def test_donor_response_idempotency_and_no_units_secured(cascade_db):
    """
    CRITICAL TEST:
    1. A donor response 'Accepted' signifies willingness, NOT a blood unit secured.
    2. Submitting responses is idempotent.
    """
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.O_POS,
        units_requested=2,
        urgency=IncidentUrgency.HIGH,
        requesting_facility="Poona Hospital",
        zone="Kothrud",
        lat=18.5074,
        lng=73.8077,
        auto_verify=True,
    )
    incident = create_requirement_and_incident(cascade_db, req_dto)

    # Launch Wave 1
    launch_response_wave(cascade_db, incident.incident_id, wave_size=2)

    attempt = cascade_db.query(ContactAttempt).filter_by(incident_id=incident.id).first()
    assert attempt is not None

    # Record 'Accepted' response
    resp = record_donor_response(
        cascade_db,
        incident_id=incident.incident_id,
        contact_attempt_id=attempt.id,
        response_status="Accepted",
        actor="Donor Portal",
        distance_km=4.2,
        eta_minutes=15,
        notes="Willing to donate at 3pm.",
    )

    assert resp.response == "Accepted"
    assert resp.distance_km == 4.2

    # Check wave confirmed count incremented
    wave = attempt.wave
    cascade_db.refresh(wave)
    assert wave.responses_received == 1
    assert wave.confirmed_count == 1

    # CRITICAL: units_secured on the incident MUST REMAIN ZERO!
    cascade_db.refresh(incident)
    assert incident.units_secured == 0

    # Test Idempotency: repeating exact same response does not double counts
    resp2 = record_donor_response(
        cascade_db,
        incident_id=incident.incident_id,
        contact_attempt_id=attempt.id,
        response_status="Accepted",
    )
    assert resp2.id == resp.id
    cascade_db.refresh(wave)
    assert wave.responses_received == 1
    assert wave.confirmed_count == 1
    cascade_db.refresh(incident)
    assert incident.units_secured == 0


def test_duplicate_outreach_database_constraint(cascade_db):
    """Enforces that the database uniqueness constraint prevents duplicate outreach attempts."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.A_POS,
        units_requested=1,
        urgency=IncidentUrgency.HIGH,
        requesting_facility="Noble Hospital",
        zone="Hadapsar",
        lat=18.5018,
        lng=73.9260,
        auto_verify=True,
    )
    incident = create_requirement_and_incident(cascade_db, req_dto)

    w_res = launch_response_wave(cascade_db, incident.incident_id, wave_size=1)
    attempt = cascade_db.query(ContactAttempt).filter_by(incident_id=incident.id).first()

    # Attempt manual duplicate dispatch via record_contact_attempt_safe
    with pytest.raises(DuplicateOutreachError):
        record_contact_attempt_safe(
            cascade_db,
            incident_id=incident.id,
            wave_id=attempt.wave_id,
            donor_id=attempt.donor_id,
        )
