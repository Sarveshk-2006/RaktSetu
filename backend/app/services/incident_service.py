"""
RAKTSETU - Incident Lifecycle Domain Service
Handles requirement creation, verification, authoritative state transitions,
clinical fulfilment recording, cancellation, and operational closure.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Set, Tuple, List, Any
from sqlalchemy.orm import Session

from app.models.db_models import (
    Incident,
    BloodRequirement,
    ResponseWave,
    FulfilmentRecord,
    AuditEvent,
)
from app.models.models import IncidentCreateRequest
from app.core.exceptions import (
    InvalidStateTransitionError,
    IncidentNotFoundError,
    IncidentClosedError,
    IncidentOverFulfilmentError,
)
from app.services.audit import log_audit_event
from app.services.matching import VALID_BLOOD_GROUPS


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ─── 1. LIFECYCLE TRANSITION STATE MACHINE ───────────────────────────────────

VALID_INCIDENT_TRANSITIONS: Dict[str, Set[str]] = {
    "PendingVerification": {"Verified", "Cancelled"},
    "Verified": {"Matching", "Mobilising", "Partially Fulfilled", "Fulfilled", "Cancelled"},
    "Matching": {"Mobilising", "Partially Fulfilled", "Fulfilled", "Escalated", "Cancelled"},
    "Mobilising": {"Partially Fulfilled", "Fulfilled", "Escalated", "Cancelled"},
    "Partially Fulfilled": {"Mobilising", "Fulfilled", "Escalated", "Cancelled"},
    "Escalated": {"Mobilising", "Partially Fulfilled", "Fulfilled", "Cancelled"},
    "Fulfilled": {"Closed"},
    "Cancelled": {"Closed"},
    "Closed": set(),  # Terminal state
}


def validate_transition(current_status: str, target_status: str) -> None:
    """Validates that a transition between two incident lifecycle states is allowed."""
    if current_status == target_status:
        return
    allowed = VALID_INCIDENT_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        raise InvalidStateTransitionError(
            f"Illegal lifecycle transition from '{current_status}' to '{target_status}'. "
            f"Allowed next states: {sorted(list(allowed)) or 'None (Terminal)'}."
        )


# ─── 2. CREATION & VERIFICATION ──────────────────────────────────────────────

def create_requirement_and_incident(
    db: Session,
    req_data: IncidentCreateRequest,
    actor: Optional[str] = None,
) -> Incident:
    """
    Creates a BloodRequirement and its associated Incident in a single atomic transaction.
    Generates human-readable, unique IDs (e.g. INC-PN-XXXXX).
    """
    bg_clean = (req_data.blood_group.value if hasattr(req_data.blood_group, "value") else str(req_data.blood_group)).strip().upper()
    if bg_clean not in VALID_BLOOD_GROUPS:
        raise ValueError(f"Invalid blood group '{bg_clean}'. Must be one of {sorted(list(VALID_BLOOD_GROUPS))}")

    if req_data.units_requested <= 0:
        raise ValueError("units_requested must be strictly positive.")

    # Generate human-readable identifier
    unique_suffix = uuid.uuid4().hex[:5].upper()
    req_id = f"REQ-PN-{unique_suffix}"
    inc_id = f"INC-PN-{unique_suffix}"

    now = utc_now()
    is_verified = bool(req_data.auto_verify)
    verif_status = "Verified" if is_verified else "Pending"
    verif_time = now if is_verified else None
    inc_status = "Verified" if is_verified else "PendingVerification"

    effective_actor = actor or req_data.actor

    requirement = BloodRequirement(
        requirement_id=req_id,
        blood_group=bg_clean,
        component=req_data.component,
        units_requested=req_data.units_requested,
        urgency=req_data.urgency.value if hasattr(req_data.urgency, "value") else str(req_data.urgency),
        requesting_facility=req_data.requesting_facility,
        zone=req_data.zone,
        district=req_data.district,
        lat=req_data.lat,
        lng=req_data.lng,
        source=req_data.source,
        verification_status=verif_status,
        verified_at=verif_time,
        is_synthetic=False,
        created_at=now,
    )
    db.add(requirement)
    db.flush()

    incident = Incident(
        incident_id=inc_id,
        requirement_id=requirement.id,
        status=inc_status,
        units_requested=req_data.units_requested,
        units_secured=0,
        response_stage="Wave 1",
        operator_id=effective_actor,
        is_synthetic=False,
        created_at=now,
        updated_at=now,
    )
    db.add(incident)
    db.flush()

    # Log audit event atomically
    log_audit_event(
        db=db,
        incident_id=inc_id,
        actor=effective_actor,
        actor_type="Operator" if is_verified else "Hospital",
        category="Verification" if is_verified else "Lifecycle",
        action="RequirementCreated",
        entity_type="Incident",
        entity_id=inc_id,
        outcome="Success",
        safe_metadata={
            "requirement_id": req_id,
            "blood_group": bg_clean,
            "component": req_data.component,
            "units_requested": req_data.units_requested,
            "facility": req_data.requesting_facility,
            "verification_status": verif_status,
        },
    )

    db.commit()
    db.refresh(incident)
    return incident


def verify_incident_requirement(
    db: Session,
    incident_id: str,
    verified_by: str,
    notes: Optional[str] = None,
    facility_confirmed: bool = True,
) -> Incident:
    """
    Authorised verification of an incident requirement.
    Enforces that requirements cannot launch mobilisation without verification.
    """
    incident = db.query(Incident).filter_by(incident_id=incident_id).first()
    if not incident:
        raise IncidentNotFoundError(f"Incident '{incident_id}' not found.")

    req = incident.requirement
    if not req:
        raise ValueError(f"Incident '{incident_id}' has no associated BloodRequirement.")

    # Idempotent if already verified
    if req.verification_status == "Verified" and incident.status != "PendingVerification":
        return incident

    now = utc_now()
    if not facility_confirmed:
        req.verification_status = "Rejected"
        incident.status = "Cancelled"
        incident.updated_at = now
        log_audit_event(
            db=db,
            incident_id=incident.incident_id,
            actor=verified_by,
            actor_type="Operator",
            category="Verification",
            action="RequirementRejected",
            entity_type="BloodRequirement",
            entity_id=req.requirement_id,
            outcome="Flagged",
            safe_metadata={"notes": notes, "facility_confirmed": False},
        )
        db.commit()
        db.refresh(incident)
        return incident

    req.verification_status = "Verified"
    req.verified_at = now
    validate_transition(incident.status, "Verified")
    incident.status = "Verified"
    incident.updated_at = now

    log_audit_event(
        db=db,
        incident_id=incident.incident_id,
        actor=verified_by,
        actor_type="Operator",
        category="Verification",
        action="RequirementVerified",
        entity_type="BloodRequirement",
        entity_id=req.requirement_id,
        outcome="Success",
        safe_metadata={
            "facility_confirmed": True,
            "notes": notes or "",
            "verified_at": now.isoformat(),
        },
    )

    db.commit()
    db.refresh(incident)
    return incident


# ─── 3. FULFILMENT & CONFIRMATION ────────────────────────────────────────────

def confirm_fulfilment(
    db: Session,
    incident_id: str,
    units_confirmed: int,
    confirmation_source: str,
    confirmed_by: str,
    component: Optional[str] = None,
    notes: Optional[str] = None,
) -> Tuple[FulfilmentRecord, Incident]:
    """
    Authorised clinical confirmation that blood units have been collected and delivered.
    Strictly verifies positive quantity and rejects over-fulfilment.
    Recalculates incident.units_secured transactionally.
    """
    if units_confirmed <= 0:
        raise ValueError("units_confirmed must be strictly positive (> 0).")

    incident = db.query(Incident).filter_by(incident_id=incident_id).first()
    if not incident:
        raise IncidentNotFoundError(f"Incident '{incident_id}' not found.")

    if incident.status in ["Closed", "Cancelled"]:
        raise IncidentClosedError(f"Cannot confirm fulfilment on a {incident.status} incident.")

    total_secured_after = incident.units_secured + units_confirmed
    if total_secured_after > incident.units_requested:
        raise IncidentOverFulfilmentError(
            f"Cannot confirm {units_confirmed} units: total secured ({total_secured_after}) "
            f"would exceed requested units ({incident.units_requested})."
        )

    now = utc_now()
    eff_comp = component or (incident.requirement.component if incident.requirement else "Packed RBC")

    record = FulfilmentRecord(
        incident_id=incident.id,
        units_confirmed=units_confirmed,
        component=eff_comp,
        confirmation_source=confirmation_source,
        confirmed_by=confirmed_by,
        confirmed_at=now,
        notes=notes,
    )
    db.add(record)
    db.flush()

    incident.units_secured = total_secured_after
    incident.updated_at = now

    # Check if fully fulfilled or partially fulfilled
    if incident.units_secured == incident.units_requested:
        validate_transition(incident.status, "Fulfilled")
        incident.status = "Fulfilled"
        incident.fulfilled_at = now
        # Authoritatively complete any active wave
        for wave in incident.waves:
            if wave.status == "Active":
                wave.status = "Complete"
                wave.completed_at = now
    else:
        validate_transition(incident.status, "Partially Fulfilled")
        incident.status = "Partially Fulfilled"

    log_audit_event(
        db=db,
        incident_id=incident.incident_id,
        actor=confirmed_by,
        actor_type="Hospital",
        category="Fulfilment",
        action="FulfilmentConfirmed",
        entity_type="FulfilmentRecord",
        entity_id=str(record.id),
        outcome="Success",
        safe_metadata={
            "units_confirmed": units_confirmed,
            "units_secured_total": incident.units_secured,
            "units_requested": incident.units_requested,
            "confirmation_source": confirmation_source,
            "new_incident_status": incident.status,
        },
    )

    db.commit()
    db.refresh(record)
    db.refresh(incident)
    return record, incident


# ─── 4. CANCELLATION & CLOSURE ───────────────────────────────────────────────

def cancel_incident(
    db: Session,
    incident_id: str,
    cancelled_by: str,
    reason: str,
) -> Incident:
    """
    Authorised cancellation of an active incident.
    Marks all active waves cancelled and sets incident status to Cancelled.
    """
    incident = db.query(Incident).filter_by(incident_id=incident_id).first()
    if not incident:
        raise IncidentNotFoundError(f"Incident '{incident_id}' not found.")

    if incident.status == "Closed":
        raise InvalidStateTransitionError("Cannot cancel an already closed incident.")

    if incident.status == "Cancelled":
        return incident

    now = utc_now()
    validate_transition(incident.status, "Cancelled")
    incident.status = "Cancelled"
    incident.updated_at = now

    for wave in incident.waves:
        if wave.status == "Active":
            wave.status = "Cancelled"
            wave.completed_at = now

    log_audit_event(
        db=db,
        incident_id=incident.incident_id,
        actor=cancelled_by,
        actor_type="Operator",
        category="Lifecycle",
        action="IncidentCancelled",
        entity_type="Incident",
        entity_id=incident.incident_id,
        outcome="Flagged",
        safe_metadata={"reason": reason},
    )

    db.commit()
    db.refresh(incident)
    return incident


def close_incident(
    db: Session,
    incident_id: str,
    closed_by: str,
    notes: Optional[str] = None,
) -> Incident:
    """
    Authorised closure of an incident.
    Enforces that an incident MUST be 'Fulfilled' or 'Cancelled' before it can be closed.
    """
    incident = db.query(Incident).filter_by(incident_id=incident_id).first()
    if not incident:
        raise IncidentNotFoundError(f"Incident '{incident_id}' not found.")

    if incident.status == "Closed":
        return incident

    if incident.status not in ["Fulfilled", "Cancelled"]:
        raise InvalidStateTransitionError(
            f"Cannot close incident in state '{incident.status}'. "
            f"Incident must be 'Fulfilled' or 'Cancelled' prior to authoritative closure."
        )

    now = utc_now()
    validate_transition(incident.status, "Closed")
    incident.status = "Closed"
    incident.closed_at = now
    incident.updated_at = now

    log_audit_event(
        db=db,
        incident_id=incident.incident_id,
        actor=closed_by,
        actor_type="Operator",
        category="Lifecycle",
        action="IncidentClosed",
        entity_type="Incident",
        entity_id=incident.incident_id,
        outcome="Success",
        safe_metadata={"notes": notes or "", "closed_at": now.isoformat()},
    )

    db.commit()
    db.refresh(incident)
    return incident
