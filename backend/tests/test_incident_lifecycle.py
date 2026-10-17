"""
RAKTSETU - Unit & Service Tests for Incident Lifecycle State Machine
Tests requirement creation, verification gates, state transitions, fulfilment limits,
cancellation, closure, and transactional audit trails.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.db_models import Incident, BloodRequirement, AuditEvent, Organisation, Donor
from app.models.models import IncidentCreateRequest, IncidentUrgency, BloodGroup
from app.core.exceptions import (
    InvalidStateTransitionError,
    UnverifiedRequirementError,
    IncidentNotFoundError,
    IncidentOverFulfilmentError,
    IncidentClosedError,
)
from app.services.incident_service import (
    create_requirement_and_incident,
    check_duplicate_requirement,
    verify_incident_requirement,
    confirm_fulfilment,
    cancel_incident,
    close_incident,
    validate_transition,
)


@pytest.fixture
def db_session():
    """Provides an isolated SQLite in-memory database for lifecycle testing."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_create_requirement_and_incident_persists_payload(db_session):
    """Verifies that submitted payload fields are persisted without hardcoding."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.B_POS,
        component="Packed RBC",
        units_requested=3,
        urgency=IncidentUrgency.CRITICAL,
        requesting_facility="Jupiter Hospital, Baner",
        zone="Baner",
        district="Pune",
        lat=18.5590,
        lng=73.7868,
        source="Hospital",
        auto_verify=False,
        actor="Dr. R. Patil",
    )

    incident = create_requirement_and_incident(db_session, req_dto)

    assert incident.incident_id.startswith("INC-PN-")
    assert incident.status == "PendingVerification"
    assert incident.units_requested == 3
    assert incident.units_secured == 0
    assert incident.operator_id == "Dr. R. Patil"

    req = incident.requirement
    assert req.blood_group == "B+"
    assert req.component == "Packed RBC"
    assert req.units_requested == 3
    assert req.urgency == "Critical"
    assert req.requesting_facility == "Jupiter Hospital, Baner"
    assert req.verification_status == "Pending"
    assert req.verified_at is None

    # Check that audit event was created atomically
    audit = db_session.query(AuditEvent).filter_by(incident_id=incident.incident_id).first()
    assert audit is not None
    assert audit.action == "RequirementCreated"
    assert audit.actor == "Dr. R. Patil"
    assert audit.sha256_hash is not None


def test_verification_lifecycle_and_transition(db_session):
    """Verifies that unverified requirement transitions to Verified with audit record."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.O_NEG,
        component="Packed RBC",
        units_requested=2,
        urgency=IncidentUrgency.HIGH,
        requesting_facility="Sahyadri Hospital",
        zone="Hadapsar",
        lat=18.5018,
        lng=73.9260,
        auto_verify=False,
    )
    incident = create_requirement_and_incident(db_session, req_dto)
    assert incident.status == "PendingVerification"

    # Authorised verification
    verified_inc = verify_incident_requirement(
        db_session,
        incident_id=incident.incident_id,
        verified_by="Coord. Sharma",
        notes="Facility confirmed via telephone dispatch line.",
        facility_confirmed=True,
    )

    assert verified_inc.status == "Verified"
    assert verified_inc.requirement.verification_status == "Verified"
    assert verified_inc.requirement.verified_at is not None

    # Idempotent re-verification
    reverified = verify_incident_requirement(
        db_session,
        incident_id=incident.incident_id,
        verified_by="Coord. Sharma",
    )
    assert reverified.status == "Verified"


def test_verification_rejection_cancels_incident(db_session):
    """Verifies that rejecting facility confirmation marks requirement Rejected and cancels incident."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.A_POS,
        units_requested=1,
        urgency=IncidentUrgency.MODERATE,
        requesting_facility="Unverified Clinic",
        zone="Aundh",
        lat=18.5584,
        lng=73.8074,
        auto_verify=False,
    )
    incident = create_requirement_and_incident(db_session, req_dto)

    rejected_inc = verify_incident_requirement(
        db_session,
        incident_id=incident.incident_id,
        verified_by="Supervisor Roy",
        notes="Clinic could not be contacted; request invalid.",
        facility_confirmed=False,
    )

    assert rejected_inc.status == "Cancelled"
    assert rejected_inc.requirement.verification_status == "Rejected"


def test_invalid_lifecycle_transitions_rejected():
    """Verifies that illegal transitions are blocked by validate_transition."""
    # Closed is terminal
    with pytest.raises(InvalidStateTransitionError):
        validate_transition("Closed", "Mobilising")

    with pytest.raises(InvalidStateTransitionError):
        validate_transition("Closed", "Verified")

    # Cannot transition directly from Verified to Closed without fulfilment or cancellation
    with pytest.raises(InvalidStateTransitionError):
        validate_transition("Verified", "Closed")

    # Cannot transition directly from Mobilising to Closed without fulfilment or cancellation
    with pytest.raises(InvalidStateTransitionError):
        validate_transition("Mobilising", "Closed")


def test_closure_requires_fulfilled_or_cancelled(db_session):
    """Verifies that closing an active/mobilising incident without fulfilment is rejected."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.AB_POS,
        units_requested=2,
        urgency=IncidentUrgency.HIGH,
        requesting_facility="Ruby Hall Clinic",
        zone="Shivajinagar",
        lat=18.5308,
        lng=73.8475,
        auto_verify=True,
    )
    incident = create_requirement_and_incident(db_session, req_dto)

    # Attempt to close while 'Verified'
    with pytest.raises(InvalidStateTransitionError):
        close_incident(db_session, incident.incident_id, closed_by="Operator 1")

    # Cancel incident, then closure is allowed
    cancel_incident(db_session, incident.incident_id, cancelled_by="Operator 1", reason="Patient discharged")
    assert incident.status == "Cancelled"

    closed = close_incident(db_session, incident.incident_id, closed_by="Operator 1")
    assert closed.status == "Closed"
    assert closed.closed_at is not None


def test_fulfilment_and_over_fulfilment_rejection(db_session):
    """Verifies that confirmed fulfilment updates units_secured and prevents over-fulfilment."""
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.O_POS,
        units_requested=2,
        urgency=IncidentUrgency.CRITICAL,
        requesting_facility="Sassoon General Hospital",
        zone="Shivajinagar",
        lat=18.5204,
        lng=73.8567,
        auto_verify=True,
    )
    incident = create_requirement_and_incident(db_session, req_dto)

    # Partial fulfilment: 1 of 2 units
    rec1, inc1 = confirm_fulfilment(
        db_session,
        incident_id=incident.incident_id,
        units_confirmed=1,
        confirmation_source="Sassoon Blood Bank",
        confirmed_by="Dr. Deshmukh",
        notes="First unit crossmatched and transfused.",
    )
    assert inc1.units_secured == 1
    assert inc1.status == "Partially Fulfilled"
    assert rec1.units_confirmed == 1

    # Over-fulfilment rejection: attempting 2 more when only 1 remaining
    with pytest.raises(IncidentOverFulfilmentError):
        confirm_fulfilment(
            db_session,
            incident_id=incident.incident_id,
            units_confirmed=2,
            confirmation_source="Sassoon Blood Bank",
            confirmed_by="Dr. Deshmukh",
        )

    # Full fulfilment: confirm 1 more unit
    rec2, inc2 = confirm_fulfilment(
        db_session,
        incident_id=incident.incident_id,
        units_confirmed=1,
        confirmation_source="Sassoon Blood Bank",
        confirmed_by="Dr. Deshmukh",
    )
    assert inc2.units_secured == 2
    assert inc2.status == "Fulfilled"
    assert inc2.fulfilled_at is not None

    # Now closure is permitted
    closed = close_incident(db_session, incident.incident_id, closed_by="Dr. Deshmukh")
    assert closed.status == "Closed"


def test_audit_event_rollback_on_failure(db_session):
    """Verifies that failed business operations do not leave spurious audit records."""
    initial_audits = db_session.query(AuditEvent).count()

    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.B_NEG,
        units_requested=1,
        urgency=IncidentUrgency.HIGH,
        requesting_facility="Noble Hospital",
        zone="Hadapsar",
        lat=18.5018,
        lng=73.9260,
        auto_verify=True,
    )
    incident = create_requirement_and_incident(db_session, req_dto)
    assert db_session.query(AuditEvent).count() == initial_audits + 1

    # Attempt illegal operation: confirm 5 units on a 1-unit requirement
    with pytest.raises(IncidentOverFulfilmentError):
        confirm_fulfilment(
            db_session,
            incident_id=incident.incident_id,
            units_confirmed=5,
            confirmation_source="Noble Blood Bank",
            confirmed_by="Officer",
        )

    # Audits count must not have incremented for the failed operation
    assert db_session.query(AuditEvent).count() == initial_audits + 1


def test_check_duplicate_requirement(db_session):
    """
    Verifies Unified Blood Incident principle (Presentation Slide 3 & 4):
    Identifies active duplicate requirements for the same facility and blood group to prevent fragmented outreach.
    """
    req_dto = IncidentCreateRequest(
        blood_group=BloodGroup.O_NEG,
        units_requested=2,
        urgency=IncidentUrgency.CRITICAL,
        requesting_facility="Sahyadri Hospital, Hadapsar",
        zone="Hadapsar",
        lat=18.502,
        lng=73.927,
        auto_verify=True,
    )
    inc1 = create_requirement_and_incident(db_session, req_dto)

    # Check for duplicate with identical facility and blood group
    dup = check_duplicate_requirement(
        db_session,
        facility="Sahyadri Hospital, Hadapsar",
        blood_group="O-",
        component="Packed RBC",
    )
    assert dup is not None
    assert dup.incident_id == inc1.incident_id

    # Check for non-matching blood group
    no_dup_bg = check_duplicate_requirement(
        db_session,
        facility="Sahyadri Hospital, Hadapsar",
        blood_group="A+",
        component="Whole Blood",
    )
    assert no_dup_bg is None

    # Check for non-matching facility
    no_dup_fac = check_duplicate_requirement(
        db_session,
        facility="Ruby Hall Clinic",
        blood_group="O-",
        component="Whole Blood",
    )
    assert no_dup_fac is None

    # Once cancelled and closed, it should no longer flag as an active duplicate
    cancel_incident(db_session, inc1.incident_id, cancelled_by="Operator", reason="Resolved via alternative mutual aid")
    close_incident(db_session, inc1.incident_id, closed_by="Operator")
    assert check_duplicate_requirement(
        db_session,
        facility="Sahyadri Hospital, Hadapsar",
        blood_group="O-",
        component="Packed RBC",
    ) is None

