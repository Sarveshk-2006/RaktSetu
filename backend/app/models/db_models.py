"""
RAKTSETU - Canonical SQLAlchemy 2.0 Database ORM Models
Represents all operational entities: Donors, Organisations, Requirements,
Incidents, Response Waves, Contact Attempts, Donor Responses,
Fulfilment Records, and Audit Events.
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint, Index, Text, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


# ─── 1. Organisation ──────────────────────────────────────────────────────────

class Organisation(Base):
    """
    Participating healthcare, university, NGO, or civic partner organisation.
    """
    __tablename__ = "organisations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    org_id = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    type = Column(String(32), nullable=False)  # NGO / University / Community / BloodBank / Civic
    status = Column(String(32), nullable=False, default="Active")  # Active / Inactive
    coverage_zones = Column(JSON, nullable=False, default=list)  # JSON list of zones: ["Baner", "Aundh"]
    contact_available = Column(Boolean, nullable=False, default=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    active_donors_count = Column(Integer, nullable=False, default=0)
    is_synthetic = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    # Relationships
    donors = relationship("Donor", back_populates="organisation")

    def __repr__(self) -> str:
        return f"<Organisation org_id={self.org_id} name={self.name}>"


# ─── 2. Donor ─────────────────────────────────────────────────────────────────

class Donor(Base):
    """
    Individual donor capacity record (Privacy-protected: no personal contact details).
    """
    __tablename__ = "donors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    donor_id = Column(String(32), unique=True, nullable=False, index=True)
    blood_group = Column(String(8), nullable=False, index=True)  # O+, O-, A+, A-, B+, B-, AB+, AB-
    readiness = Column(String(32), nullable=False, default="Ready", index=True)  # Ready, Maybe, Unavailable, Unknown
    consent_given = Column(Boolean, nullable=False, default=True)
    contact_permission = Column(Boolean, nullable=False, default=True)
    organisation_id = Column(Integer, ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True, index=True)

    # Geographic location (aggregate / zone level to protect donor privacy)
    zone = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, default="Pune")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # Behavioral and operational metrics
    response_rate = Column(Float, nullable=False, default=0.75)
    avg_response_time_minutes = Column(Float, nullable=False, default=12.0)
    recent_load = Column(Integer, nullable=False, default=0)  # Outreach count / donations in last 90 days
    contact_reliability = Column(Float, nullable=False, default=0.90)

    last_activity_at = Column(DateTime, nullable=False, default=utc_now)
    is_active = Column(Boolean, nullable=False, default=True)
    is_synthetic = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    # Constraints
    __table_args__ = (
        CheckConstraint("recent_load >= 0", name="chk_donor_recent_load_non_negative"),
        CheckConstraint("response_rate >= 0.0 AND response_rate <= 1.0", name="chk_donor_response_rate_range"),
        CheckConstraint("contact_reliability >= 0.0 AND contact_reliability <= 1.0", name="chk_donor_contact_rel_range"),
    )

    # Relationships
    organisation = relationship("Organisation", back_populates="donors")
    contact_attempts = relationship("ContactAttempt", back_populates="donor")
    responses = relationship("DonorResponse", back_populates="donor")

    def __repr__(self) -> str:
        return f"<Donor donor_id={self.donor_id} blood_group={self.blood_group} readiness={self.readiness}>"


# ─── 3. Blood Requirement ─────────────────────────────────────────────────────

class BloodRequirement(Base):
    """
    Verified clinical blood requirement submitted by a facility or operator.
    """
    __tablename__ = "blood_requirements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    requirement_id = Column(String(32), unique=True, nullable=False, index=True)
    blood_group = Column(String(8), nullable=False, index=True)
    component = Column(String(32), nullable=False, default="Packed RBC")
    units_requested = Column(Integer, nullable=False)
    urgency = Column(String(32), nullable=False, default="High")  # Critical / High / Moderate / Routine
    requesting_facility = Column(String(128), nullable=False)
    zone = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, default="Pune")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    source = Column(String(32), nullable=False, default="Hospital")  # Hospital / BloodBank / Operator
    verification_status = Column(String(32), nullable=False, default="Verified")  # Pending / Verified / Rejected
    verified_at = Column(DateTime, nullable=True)
    is_synthetic = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)

    # Constraints
    __table_args__ = (
        CheckConstraint("units_requested > 0", name="chk_requirement_units_positive"),
    )

    # Relationships
    incident = relationship("Incident", back_populates="requirement", uselist=False)

    def __repr__(self) -> str:
        return f"<BloodRequirement req_id={self.requirement_id} bg={self.blood_group} units={self.units_requested}>"


# ─── 4. Incident ──────────────────────────────────────────────────────────────

class Incident(Base):
    """
    Core operational incident tracking the response lifecycle for a requirement.
    """
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(32), unique=True, nullable=False, index=True)  # e.g. INC-PN-48291
    requirement_id = Column(Integer, ForeignKey("blood_requirements.id", ondelete="RESTRICT"), unique=True, nullable=False)
    status = Column(String(32), nullable=False, default="Verified", index=True)
    # Statuses: Verified -> Matching -> Mobilising -> Partially Fulfilled -> Fulfilled -> Closed (or Cancelled)

    units_requested = Column(Integer, nullable=False)
    units_secured = Column(Integer, nullable=False, default=0)
    response_stage = Column(String(32), nullable=False, default="Wave 1")
    operator_id = Column(String(64), nullable=True)
    is_synthetic = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)
    fulfilled_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    # Constraints
    __table_args__ = (
        CheckConstraint("units_requested > 0", name="chk_incident_units_requested_positive"),
        CheckConstraint("units_secured >= 0", name="chk_incident_units_secured_non_negative"),
    )

    # Relationships
    requirement = relationship("BloodRequirement", back_populates="incident")
    waves = relationship("ResponseWave", back_populates="incident", cascade="all, delete-orphan", order_by="ResponseWave.wave_number")
    contact_attempts = relationship("ContactAttempt", back_populates="incident", cascade="all, delete-orphan")
    fulfilment_records = relationship("FulfilmentRecord", back_populates="incident", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Incident incident_id={self.incident_id} status={self.status} secured={self.units_secured}/{self.units_requested}>"


# ─── 5. Response Wave ─────────────────────────────────────────────────────────

class ResponseWave(Base):
    """
    Progressive mobilisation wave within an incident.
    """
    __tablename__ = "response_waves"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    wave_number = Column(Integer, nullable=False)
    status = Column(String(32), nullable=False, default="Pending")  # Pending / Active / Complete / Insufficient
    donors_contacted = Column(Integer, nullable=False, default=0)
    responses_received = Column(Integer, nullable=False, default=0)
    confirmed_count = Column(Integer, nullable=False, default=0)
    units_secured = Column(Integer, nullable=False, default=0)
    launched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    escalation_reason = Column(String(256), nullable=True)

    # Constraints: One wave number per incident
    __table_args__ = (
        UniqueConstraint("incident_id", "wave_number", name="uq_incident_wave_number"),
        CheckConstraint("wave_number > 0", name="chk_wave_number_positive"),
        CheckConstraint("donors_contacted >= 0", name="chk_wave_donors_contacted_non_neg"),
        CheckConstraint("units_secured >= 0", name="chk_wave_units_secured_non_neg"),
    )

    # Relationships
    incident = relationship("Incident", back_populates="waves")
    contact_attempts = relationship("ContactAttempt", back_populates="wave", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ResponseWave incident_id={self.incident_id} wave={self.wave_number} status={self.status}>"


# ─── 6. Contact Attempt ───────────────────────────────────────────────────────

class ContactAttempt(Base):
    """
    Dispatched outreach to an eligible donor for a specific incident wave.
    Enforces uniqueness: a donor can only be contacted ONCE per incident to prevent over-contacting.
    """
    __tablename__ = "contact_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    wave_id = Column(Integer, ForeignKey("response_waves.id", ondelete="CASCADE"), nullable=False, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="Dispatched")  # Dispatched / Delivered / Failed / Cancelled
    attempted_at = Column(DateTime, nullable=False, default=utc_now)

    # Uniqueness constraint: Prevent duplicate outreach to same donor for same incident
    __table_args__ = (
        UniqueConstraint("incident_id", "donor_id", name="uq_incident_donor_attempt"),
    )

    # Relationships
    incident = relationship("Incident", back_populates="contact_attempts")
    wave = relationship("ResponseWave", back_populates="contact_attempts")
    donor = relationship("Donor", back_populates="contact_attempts")
    response = relationship("DonorResponse", back_populates="contact_attempt", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ContactAttempt incident_id={self.incident_id} donor_id={self.donor_id} status={self.status}>"


# ─── 7. Donor Response ────────────────────────────────────────────────────────

class DonorResponse(Base):
    """
    Recorded response from a contacted donor.
    """
    __tablename__ = "donor_responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    contact_attempt_id = Column(Integer, ForeignKey("contact_attempts.id", ondelete="CASCADE"), unique=True, nullable=False)
    donor_id = Column(Integer, ForeignKey("donors.id", ondelete="RESTRICT"), nullable=False, index=True)
    response = Column(String(32), nullable=False)  # Accepted / Declined / NoResponse / Pending
    responded_at = Column(DateTime, nullable=False, default=utc_now)
    response_time_seconds = Column(Integer, nullable=True)
    distance_km = Column(Float, nullable=True)
    eta_minutes = Column(Integer, nullable=True)
    notes = Column(String(256), nullable=True)

    # Relationships
    contact_attempt = relationship("ContactAttempt", back_populates="response")
    donor = relationship("Donor", back_populates="responses")

    def __repr__(self) -> str:
        return f"<DonorResponse attempt_id={self.contact_attempt_id} response={self.response}>"


# ─── 8. Fulfilment Record ─────────────────────────────────────────────────────

class FulfilmentRecord(Base):
    """
    Clinical verification that blood units were delivered / fulfilled.
    Separate from donor acceptance: requires authorised medical or facility confirmation.
    """
    __tablename__ = "fulfilment_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    units_confirmed = Column(Integer, nullable=False)
    component = Column(String(32), nullable=False, default="Packed RBC")
    confirmation_source = Column(String(128), nullable=False)  # Hospital Blood Bank / Medical Officer
    confirmed_by = Column(String(128), nullable=False)  # Authorized personnel name or ID
    confirmed_at = Column(DateTime, nullable=False, default=utc_now)
    notes = Column(Text, nullable=True)

    # Constraints
    __table_args__ = (
        CheckConstraint("units_confirmed > 0", name="chk_fulfilment_units_positive"),
    )

    # Relationships
    incident = relationship("Incident", back_populates="fulfilment_records")

    def __repr__(self) -> str:
        return f"<FulfilmentRecord incident_id={self.incident_id} units={self.units_confirmed} by={self.confirmed_by}>"


# ─── 9. Audit Event ───────────────────────────────────────────────────────────

class AuditEvent(Base):
    """
    Verifiable accountability and audit record for every critical action in the system.
    Stores actor, action, affected entity, timestamp, safe metadata, and SHA-256 hash.
    Never stores passwords, tokens, or private medical details.
    """
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(32), unique=True, nullable=False, index=True)  # e.g. LOG-9941
    timestamp = Column(DateTime, nullable=False, default=utc_now, index=True)
    incident_id = Column(String(32), nullable=True, index=True)  # Public incident ID (e.g. INC-PN-48291)
    actor = Column(String(128), nullable=False)
    actor_type = Column(String(32), nullable=False)  # System / Operator / Donor / Hospital
    category = Column(String(32), nullable=False, index=True)  # Verification / Dispatch / Donor Response / Fulfilment / System
    action = Column(String(64), nullable=False, index=True)
    entity_type = Column(String(32), nullable=False)  # Incident / ResponseWave / ContactAttempt / FulfilmentRecord
    entity_id = Column(String(64), nullable=True)
    outcome = Column(String(32), nullable=False, default="Success")  # Success / Pending / Failure / Flagged
    safe_metadata = Column(JSON, nullable=False, default=dict)
    prev_hash = Column(String(64), nullable=True)
    sha256_hash = Column(String(64), nullable=True)

    def __repr__(self) -> str:
        return f"<AuditEvent event_id={self.event_id} action={self.action} actor={self.actor}>"


# ─── 10. Simulation Run ────────────────────────────────────────────────────────

class SimulationRun(Base):
    """
    Persisted record of an isolated stress simulation scenario.
    Stores scenario ID, configuration parameters, baseline vs simulated metrics,
    bottlenecks, and recommended interventions.
    Strictly isolated from live operational records.
    """
    __tablename__ = "simulation_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    simulation_id = Column(String(32), unique=True, nullable=False, index=True)
    scenario_id = Column(String(32), nullable=False, index=True)
    scenario_name = Column(String(128), nullable=False)
    parameters = Column(JSON, nullable=False, default=dict)
    baseline_metrics = Column(JSON, nullable=False, default=dict)
    simulated_metrics = Column(JSON, nullable=False, default=dict)
    capacity_difference_percent = Column(Float, nullable=False, default=0.0)
    affected_blood_groups = Column(JSON, nullable=False, default=list)
    affected_zones = Column(JSON, nullable=False, default=list)
    bottlenecks = Column(JSON, nullable=False, default=list)
    interventions = Column(JSON, nullable=False, default=list)
    executed_at = Column(DateTime, nullable=False, default=utc_now)
    executed_by = Column(String(128), nullable=False, default="System Operator")

    def __repr__(self) -> str:
        return f"<SimulationRun id={self.simulation_id} scenario={self.scenario_id}>"


# ─── 11. Security & RBAC: User and Roles ──────────────────────────────────────

class UserRole:
    ADMIN = "admin"                          # Platform administrator
    HOSPITAL_OPERATOR = "hospital_operator"  # Hospital / blood-bank clinical operator
    INCIDENT_OPERATOR = "incident_operator"  # Authorised mobilization / cascade operator
    ORG_COORDINATOR = "org_coordinator"      # Verified organisation coordinator
    AUDITOR = "auditor"                      # Read-only compliance auditor

    ALL_ROLES = [ADMIN, HOSPITAL_OPERATOR, INCIDENT_OPERATOR, ORG_COORDINATOR, AUDITOR]


class User(Base):
    """
    Authenticated platform user with cryptographically hashed credentials and RBAC role.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default=UserRole.INCIDENT_OPERATOR, index=True)
    full_name = Column(String(128), nullable=False)
    organisation_id = Column(Integer, ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True, index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=utc_now)
    updated_at = Column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    organisation = relationship("Organisation")

    def __repr__(self) -> str:
        return f"<User username={self.username} role={self.role}>"


# ─── 12. Notification Deliveries (Milestone 7) ────────────────────────────────

class NotificationDelivery(Base):
    """
    Persisted lifecycle record of an external SMS / WhatsApp notification.
    Tracks provider delivery states, provider message IDs, attempt counts,
    masked recipient identifiers, safe error diagnostics, and timestamps.
    Separated from donor responses and fulfilment records.
    """
    __tablename__ = "notification_deliveries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispatch_id = Column(String(64), unique=True, nullable=False, index=True)
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    wave_id = Column(Integer, ForeignKey("response_waves.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_attempt_id = Column(Integer, ForeignKey("contact_attempts.id", ondelete="SET NULL"), nullable=True, index=True)
    donor_id = Column(Integer, ForeignKey("donors.id", ondelete="RESTRICT"), nullable=False, index=True)

    channel = Column(String(32), nullable=False, default="sms")  # sms / whatsapp / mock
    provider = Column(String(32), nullable=False, default="mock")  # twilio / whatsapp / mock
    template_id = Column(String(64), nullable=False, default="EMERGENCY_MOBILISATION_V1")
    recipient_phone_masked = Column(String(32), nullable=False)

    status = Column(String(32), nullable=False, default="pending_dispatch", index=True)
    # Lifecycle states: pending_dispatch -> dispatch_attempted -> provider_accepted -> delivered / failed / cancelled

    provider_message_id = Column(String(128), nullable=True, index=True)
    attempt_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)

    created_at = Column(DateTime, nullable=False, default=utc_now)
    dispatched_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)

    last_error = Column(String(512), nullable=True)
    safe_metadata = Column(JSON, nullable=True)

    # Relationships
    incident = relationship("Incident", backref="notification_deliveries")
    wave = relationship("ResponseWave", backref="notification_deliveries")
    contact_attempt = relationship("ContactAttempt", backref="notification_deliveries")
    donor = relationship("Donor", backref="notification_deliveries")

    def __repr__(self) -> str:
        return f"<NotificationDelivery dispatch_id={self.dispatch_id} status={self.status} provider_msg_id={self.provider_message_id}>"


