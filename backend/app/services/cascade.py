"""
RAKTSETU - Response Cascade Domain Service
Orchestrates progressive mobilisation waves, candidate cohort selection,
atomic outreach persistence, idempotent donor responses, and escalation policies.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field

from app.models.db_models import (
    Incident,
    ResponseWave,
    ContactAttempt,
    Donor,
    DonorResponse,
)
from app.core.exceptions import (
    IncidentNotFoundError,
    UnverifiedRequirementError,
    InvalidStateTransitionError,
    IncidentClosedError,
    ActiveWaveExistsError,
    WaveProgressionError,
    DuplicateOutreachError,
    InvalidResponseStatusError,
)
from app.services.matching import match_donors_for_incident, MatchCandidateResult
from app.services.audit import log_audit_event


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


VALID_DONOR_RESPONSES = {"Accepted", "Declined", "UnableToHelp", "NoResponse", "Expired", "Pending"}


class WaveCandidateSummary(BaseModel):
    donor_id: str
    blood_group: str
    readiness: str
    score: float
    distance_km: Optional[float]
    recommendation_reasons: List[str]


class WaveLaunchResult(BaseModel):
    incident_id: str
    wave_number: int
    status: str
    donors_contacted: int
    units_requested: int
    units_secured: int
    units_remaining: int
    candidates: List[WaveCandidateSummary]
    message: str


# ─── 1. WAVE LAUNCH & COHORT DISPATCH ─────────────────────────────────────────

def launch_response_wave(
    db: Session,
    incident_id: str,
    wave_number: Optional[int] = None,
    wave_size: int = 5,
    operator_id: Optional[str] = None,
) -> WaveLaunchResult:
    """
    Launches a response wave for an incident:
    1. Validates incident verification & active state.
    2. Enforces wave ordering and ensures no concurrent active wave.
    3. Calls matching engine to select eligible, ranked candidates (excluding all previously contacted donors).
    4. Persists the ResponseWave and ContactAttempts atomically.
    5. Returns structured WaveLaunchResult.
    """
    incident = db.query(Incident).filter_by(incident_id=incident_id).first()
    if not incident:
        raise IncidentNotFoundError(f"Incident '{incident_id}' not found.")

    req = incident.requirement
    if not req:
        raise ValueError(f"Incident '{incident_id}' has no associated BloodRequirement.")

    # Hard Gate 1: Requirement MUST be verified before donor outreach
    if req.verification_status != "Verified":
        raise UnverifiedRequirementError(
            f"Requirement '{req.requirement_id}' has status '{req.verification_status}'. "
            f"Only Verified requirements can initiate donor mobilisation."
        )

    # Hard Gate 2: Incident lifecycle state checks
    if incident.status in ["Closed", "Cancelled"]:
        raise IncidentClosedError(f"Cannot launch wave on a {incident.status} incident.")

    if incident.status == "Fulfilled":
        raise InvalidStateTransitionError("Incident is already fulfilled. No further waves needed.")

    # Hard Gate 3: Check unmet demand
    remaining_units = incident.units_requested - incident.units_secured
    if remaining_units <= 0:
        raise InvalidStateTransitionError("All requested units have already been secured.")

    # Hard Gate 4: Ensure no other wave is currently Active
    active_wave = (
        db.query(ResponseWave)
        .filter(ResponseWave.incident_id == incident.id, ResponseWave.status == "Active")
        .first()
    )
    if active_wave:
        raise ActiveWaveExistsError(
            f"Wave {active_wave.wave_number} is currently Active. "
            f"Evaluate or advance it before launching a new wave."
        )

    # Resolve wave number
    existing_waves = (
        db.query(ResponseWave)
        .filter(ResponseWave.incident_id == incident.id)
        .order_by(ResponseWave.wave_number)
        .all()
    )
    expected_wave_num = (max(w.wave_number for w in existing_waves) + 1) if existing_waves else 1

    if wave_number is not None and wave_number != expected_wave_num:
        raise WaveProgressionError(
            f"Invalid wave sequence: requested wave {wave_number}, but expected next wave is {expected_wave_num}."
        )

    wave_num = expected_wave_num

    # Hard Gate 5: Cohort selection via deterministic matching service
    # Automatically pre-filters, validates component compatibility, scores, and excludes prior contacts.
    matching_result = match_donors_for_incident(
        db=db,
        incident_id=incident.incident_id,
        limit=wave_size,
    )

    if not matching_result.candidates:
        # Candidate pool is exhausted
        incident.status = "Escalated"
        incident.updated_at = utc_now()
        log_audit_event(
            db=db,
            incident_id=incident.incident_id,
            actor=operator_id or "System",
            actor_type="System",
            category="Lifecycle",
            action="IncidentEscalated",
            entity_type="Incident",
            entity_id=incident.incident_id,
            outcome="Flagged",
            safe_metadata={"reason": "CandidatePoolExhausted", "wave_number": wave_num},
        )
        db.commit()
        db.refresh(incident)
        return WaveLaunchResult(
            incident_id=incident.incident_id,
            wave_number=wave_num,
            status="Escalated",
            donors_contacted=0,
            units_requested=incident.units_requested,
            units_secured=incident.units_secured,
            units_remaining=remaining_units,
            candidates=[],
            message="Eligible candidate pool exhausted across coverage zones. Incident escalated.",
        )

    cohort = matching_result.candidates[:wave_size]
    now = utc_now()

    # Persist wave and contact attempts atomically
    wave = ResponseWave(
        incident_id=incident.id,
        wave_number=wave_num,
        status="Active",
        donors_contacted=len(cohort),
        responses_received=0,
        confirmed_count=0,
        units_secured=0,
        launched_at=now,
    )
    db.add(wave)
    db.flush()

    candidate_summaries: List[WaveCandidateSummary] = []
    effective_actor = operator_id or incident.operator_id or "Operator"

    try:
        for cand in cohort:
            donor_record = db.query(Donor).filter_by(donor_id=cand.donor_id).first()
            if not donor_record:
                continue

            attempt = ContactAttempt(
                incident_id=incident.id,
                wave_id=wave.id,
                donor_id=donor_record.id,
                status="PendingDispatch",
                attempted_at=now,
            )
            db.add(attempt)
            db.flush()
            donor_record.recent_load += 1  # Track outreach load for subsequent fatigue relief

            # Trigger secure notification delivery through provider boundary
            try:
                from app.services.notifications import notification_gateway, NotificationChannel
                delivery = notification_gateway.dispatch_wave_notification(
                    db=db,
                    incident_id=incident.incident_id,
                    wave_number=wave_num,
                    donor_id_str=cand.donor_id,
                    operator_username=effective_actor,
                    channel=NotificationChannel.SMS,
                )
                if delivery.status == "failed":
                    attempt.status = "Failed"
            except Exception:
                # Fails safely without disrupting wave creation
                pass

            candidate_summaries.append(
                WaveCandidateSummary(
                    donor_id=cand.donor_id,
                    blood_group=cand.blood_group,
                    readiness=cand.readiness,
                    score=cand.score,
                    distance_km=cand.distance_km,
                    recommendation_reasons=cand.reasons,
                )
            )

        # Update Incident lifecycle
        if incident.status in ["Verified", "Matching", "Escalated"]:
            incident.status = "Mobilising"
        incident.response_stage = f"Wave {wave_num}"
        if operator_id:
            incident.operator_id = operator_id
        incident.updated_at = now

        # Log audit event
        log_audit_event(
            db=db,
            incident_id=incident.incident_id,
            actor=effective_actor,
            actor_type="Operator",
            category="Dispatch",
            action="WaveLaunched",
            entity_type="ResponseWave",
            entity_id=str(wave.id),
            outcome="Success",
            safe_metadata={
                "wave_number": wave_num,
                "cohort_size": len(cohort),
                "donor_ids": [c.donor_id for c in cohort],
            },
        )

        db.commit()
    except IntegrityError as err:
        db.rollback()
        # Handle unique constraint collisions (e.g. concurrent wave launch or duplicate outreach)
        err_str = str(err).lower()
        if "uq_incident_wave_number" in err_str:
            raise WaveProgressionError(f"Wave {wave_num} was already launched concurrently.") from err
        if "uq_incident_donor_attempt" in err_str:
            raise DuplicateOutreachError("Duplicate outreach detected for one or more candidates in cohort.") from err
        raise

    db.refresh(incident)
    db.refresh(wave)

    return WaveLaunchResult(
        incident_id=incident.incident_id,
        wave_number=wave.wave_number,
        status=wave.status,
        donors_contacted=wave.donors_contacted,
        units_requested=incident.units_requested,
        units_secured=incident.units_secured,
        units_remaining=incident.units_requested - incident.units_secured,
        candidates=candidate_summaries,
        message=f"Wave {wave.wave_number} successfully launched with {len(candidate_summaries)} candidates pending dispatch.",
    )


# ─── 2. DONOR RESPONSE RECORDING ──────────────────────────────────────────────

def record_donor_response(
    db: Session,
    incident_id: str,
    contact_attempt_id: int,
    response_status: str,
    actor: str = "Donor Portal",
    distance_km: Optional[float] = None,
    eta_minutes: Optional[int] = None,
    notes: Optional[str] = None,
) -> DonorResponse:
    """
    Records a donor's response to an outreach contact attempt.
    - Idempotent: repeated identical submissions return the existing record without duplicate counts or audit events.
    - Acceptance signifies donor willingness to travel/donate; it does NOT increase units_secured.
    """
    resp_clean = (response_status or "").strip()
    # Normalize case e.g. "accepted" -> "Accepted"
    normalized_status = None
    for valid_s in VALID_DONOR_RESPONSES:
        if valid_s.lower() == resp_clean.lower():
            normalized_status = valid_s
            break

    if not normalized_status:
        raise InvalidResponseStatusError(
            f"Invalid response status '{response_status}'. Must be one of {sorted(list(VALID_DONOR_RESPONSES))}."
        )

    attempt = db.query(ContactAttempt).filter_by(id=contact_attempt_id).first()
    if not attempt:
        raise ValueError(f"Contact attempt with ID {contact_attempt_id} not found.")

    if attempt.incident.incident_id != incident_id:
        raise ValueError(
            f"Contact attempt {contact_attempt_id} belongs to incident '{attempt.incident.incident_id}', "
            f"not '{incident_id}'."
        )

    # Check for existing response (Idempotency)
    existing_resp = db.query(DonorResponse).filter_by(contact_attempt_id=contact_attempt_id).first()
    if existing_resp:
        if existing_resp.response == normalized_status:
            # Idempotent replay: return existing response unchanged
            return existing_resp

        # Response modification (e.g. from Pending to Accepted)
        old_resp = existing_resp.response
        existing_resp.response = normalized_status
        existing_resp.responded_at = utc_now()
        if distance_km is not None:
            existing_resp.distance_km = distance_km
        if eta_minutes is not None:
            existing_resp.eta_minutes = eta_minutes
        if notes:
            existing_resp.notes = notes

        # Update confirmed count on wave if applicable
        wave = attempt.wave
        if wave:
            if old_resp != "Accepted" and normalized_status == "Accepted":
                wave.confirmed_count += 1
            elif old_resp == "Accepted" and normalized_status != "Accepted":
                wave.confirmed_count = max(0, wave.confirmed_count - 1)

        log_audit_event(
            db=db,
            incident_id=incident_id,
            actor=actor,
            actor_type="Donor",
            category="Donor Response",
            action="DonorResponseUpdated",
            entity_type="DonorResponse",
            entity_id=str(existing_resp.id),
            outcome="Success",
            safe_metadata={
                "contact_attempt_id": contact_attempt_id,
                "previous_response": old_resp,
                "new_response": normalized_status,
            },
        )
        db.commit()
        db.refresh(existing_resp)
        return existing_resp

    now = utc_now()
    donor_response = DonorResponse(
        contact_attempt_id=attempt.id,
        donor_id=attempt.donor_id,
        response=normalized_status,
        responded_at=now,
        distance_km=distance_km,
        eta_minutes=eta_minutes,
        notes=notes,
    )
    db.add(donor_response)

    wave = attempt.wave
    if wave:
        wave.responses_received += 1
        if normalized_status == "Accepted":
            wave.confirmed_count += 1

    # CRITICAL: units_secured on the incident is NEVER incremented by donor response alone!
    # Fulfilment confirmation is strictly a clinical/blood-bank verification workflow.

    log_audit_event(
        db=db,
        incident_id=incident_id,
        actor=actor,
        actor_type="Donor",
        category="Donor Response",
        action="DonorResponseRecorded",
        entity_type="DonorResponse",
        entity_id=str(contact_attempt_id),
        outcome="Success",
        safe_metadata={
            "contact_attempt_id": contact_attempt_id,
            "response": normalized_status,
            "donor_id": attempt.donor.donor_id if attempt.donor else str(attempt.donor_id),
        },
    )

    db.commit()
    db.refresh(donor_response)
    return donor_response


# ─── 3. WAVE ADVANCE & EVALUATION ─────────────────────────────────────────────

def advance_or_evaluate_wave(
    db: Session,
    incident_id: str,
    wave_number: int,
    action: str = "advance",
    actor: str = "System",
) -> ResponseWave:
    """
    Evaluates or advances a wave based on timeout, insufficient responses, or completion.
    Idempotent: repeating evaluation on a completed wave is safe.
    """
    incident = db.query(Incident).filter_by(incident_id=incident_id).first()
    if not incident:
        raise IncidentNotFoundError(f"Incident '{incident_id}' not found.")

    wave = (
        db.query(ResponseWave)
        .filter(ResponseWave.incident_id == incident.id, ResponseWave.wave_number == wave_number)
        .first()
    )
    if not wave:
        raise ValueError(f"Wave {wave_number} not found for incident '{incident_id}'.")

    if wave.status in ["Complete", "Expired", "Cancelled"]:
        # Safe idempotent return
        return wave

    now = utc_now()
    action_clean = action.lower()

    if action_clean in ["timeout", "expire"]:
        wave.status = "Expired"
        wave.completed_at = now
    elif action_clean == "insufficient":
        wave.status = "Insufficient"
        wave.completed_at = now
    else:
        wave.status = "Complete"
        wave.completed_at = now

    # Check remaining unmet demand
    remaining = incident.units_requested - incident.units_secured
    if remaining > 0:
        # Check candidate pool availability
        matching_res = match_donors_for_incident(db, incident.incident_id, limit=1)
        if not matching_res.candidates:
            incident.status = "Escalated"
            log_audit_event(
                db=db,
                incident_id=incident.incident_id,
                actor=actor,
                actor_type="System",
                category="Lifecycle",
                action="IncidentEscalated",
                entity_type="Incident",
                entity_id=incident.incident_id,
                outcome="Flagged",
                safe_metadata={"reason": "CandidatePoolExhaustedOnWaveAdvance", "wave_number": wave_number},
            )

    log_audit_event(
        db=db,
        incident_id=incident.incident_id,
        actor=actor,
        actor_type="System",
        category="Dispatch",
        action="WaveAdvanced",
        entity_type="ResponseWave",
        entity_id=str(wave.id),
        outcome="Success",
        safe_metadata={
            "wave_number": wave_number,
            "action": action,
            "new_status": wave.status,
            "responses_received": wave.responses_received,
            "confirmed_count": wave.confirmed_count,
        },
    )

    db.commit()
    db.refresh(wave)
    return wave
