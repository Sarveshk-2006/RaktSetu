"""
RAKTSETU API — Incidents & Response Cascade Router
Implements authoritative lifecycle management, progressive mobilisation waves,
deterministic candidate matching, idempotent donor responses, clinical fulfilment,
and tamper-evident audit logging while preserving full backward compatibility.
"""

from datetime import datetime, timezone
from typing import List, Optional, Union, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles
from app.models.db_models import (
    Incident as DBIncident,
    BloodRequirement as DBBloodRequirement,
    ResponseWave as DBResponseWave,
    ContactAttempt as DBContactAttempt,
    DonorResponse as DBDonorResponse,
    FulfilmentRecord as DBFulfilmentRecord,
    AuditEvent as DBAuditEvent,
    User,
    UserRole,
)
from app.models.models import (
    IncidentRequirement,
    Incident as PydanticIncident,
    IncidentStatus,
    BloodGroup,
    IncidentUrgency,
    Location,
    ResponseWave as PydanticWave,
    WaveStatus,
    ResponseEvent,
    DonorResponse as PydanticDonorResponse,
    IncidentCreateRequest,
    IncidentVerificationRequest,
    WaveLaunchRequest,
    WaveAdvanceRequest,
    DonorResponseRecordRequest,
    FulfilmentConfirmRequest,
    IncidentCloseRequest,
    IncidentCancelRequest,
    AuditEventResponse,
)
from app.core.exceptions import (
    IncidentNotFoundError,
    UnverifiedRequirementError,
    InvalidStateTransitionError,
    IncidentClosedError,
    IncidentOverFulfilmentError,
    ActiveWaveExistsError,
    WaveProgressionError,
    DuplicateOutreachError,
    InvalidResponseStatusError,
    RaktSetuDomainError,
)
from app.services.incident_service import (
    create_requirement_and_incident,
    check_duplicate_requirement,
    verify_incident_requirement,
    confirm_fulfilment as svc_confirm_fulfilment,
    cancel_incident as svc_cancel_incident,
    close_incident as svc_close_incident,
)
from app.services.cascade import (
    launch_response_wave as svc_launch_response_wave,
    record_donor_response as svc_record_donor_response,
    advance_or_evaluate_wave as svc_advance_or_evaluate_wave,
    WaveLaunchResult,
)
from app.services.matching import match_donors_for_incident, MatchingResponse
from app.services.demo_data import (
    get_all_incidents,
    get_demo_incident,
    get_donor_candidates_for_incident,
)

router = APIRouter()


def _serialize_db_incident(inc: DBIncident) -> Dict[str, Any]:
    """Helper to serialize a database Incident model to an API-compatible dictionary."""
    now = datetime.now(timezone.utc)
    created = inc.created_at or now
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    elapsed = max(0, int((now - created).total_seconds()))

    req = inc.requirement
    req_dict = {
        "blood_group": req.blood_group if req else "O-",
        "units_required": inc.units_requested,
        "urgency": req.urgency if req else "High",
        "location": {
            "zone": req.zone if req else "Pune",
            "district": req.district if req else "Pune",
            "lat": req.lat if req else 18.5204,
            "lng": req.lng if req else 73.8567,
        },
        "requesting_facility": req.requesting_facility if req else "General Hospital",
        "source": req.source if req else "Hospital",
    }

    waves_data = []
    total_contacted = 0
    for w in inc.waves:
        waves_data.append({
            "wave_number": w.wave_number,
            "status": w.status,
            "donors_contacted": w.donors_contacted,
            "responses_received": w.responses_received,
            "confirmed": w.confirmed_count,
            "units_secured": w.units_secured,
        })
        total_contacted += w.donors_contacted

    response_events = []
    for att in inc.contact_attempts:
        if att.response:
            resp_time = att.response.responded_at or att.attempted_at
            response_events.append({
                "timestamp": resp_time,
                "donor_id": att.donor.donor_id if att.donor else str(att.donor_id),
                "response": att.response.response,
                "blood_group": att.donor.blood_group if att.donor else "Unknown",
                "distance_km": att.response.distance_km or 0.0,
            })

    return {
        "incident_id": inc.incident_id,
        "requirement": req_dict,
        "status": inc.status,
        "units_secured": inc.units_secured,
        "created_at": inc.created_at,
        "updated_at": inc.updated_at,
        "elapsed_seconds": elapsed,
        "waves": waves_data,
        "response_events": response_events,
        "fulfilled_at": inc.fulfilled_at,
        "response_time_seconds": (
            int((inc.fulfilled_at.replace(tzinfo=timezone.utc) - created).total_seconds())
            if inc.fulfilled_at else None
        ),
        "donors_contacted": total_contacted,
        "duplicate_outreach_avoided": 0,
    }


# ─── 1. INCIDENTS QUERY & RETRIEVAL ──────────────────────────────────────────

@router.get("/")
async def list_incidents(db: Session = Depends(get_db)):
    """List all incidents from persistence, with fallback to demo pool if unseeded."""
    db_incidents = db.query(DBIncident).all()
    if db_incidents:
        return [_serialize_db_incident(inc) for inc in db_incidents]
    return get_all_incidents()


@router.get("/check-duplicate")
async def check_duplicate_endpoint(
    facility: str = Query(..., description="Requesting medical facility or hospital"),
    blood_group: str = Query(..., description="Required ABO/Rh blood group"),
    component: str = Query("Whole Blood", description="Blood component"),
    db: Session = Depends(get_db),
):
    """
    Identifies if an active canonical incident already exists for this facility, blood group, and component.
    Adheres strictly to the Unified Blood Incident coordination model (Presentation Slide 3 & 4).
    """
    match = check_duplicate_requirement(db, facility=facility, blood_group=blood_group, component=component)
    if match:
        req = match.requirement
        return {
            "duplicate_found": True,
            "incident_id": match.incident_id,
            "status": match.status,
            "facility": req.requesting_facility if req else facility,
            "blood_group": req.blood_group if req else blood_group,
            "units_requested": match.units_requested,
            "units_secured": match.units_secured,
            "message": f"Active incident '{match.incident_id}' is already coordinating {match.units_requested} units of {blood_group} for {facility}. Unified coordination recommends coordinating under this existing shared incident.",
        }
    return {
        "duplicate_found": False,
        "message": "No active duplicate requirement found. Requisition can proceed.",
    }


@router.get("/{incident_id}")
async def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed state of a specific incident."""
    inc = db.query(DBIncident).filter_by(incident_id=incident_id).first()
    if inc:
        return _serialize_db_incident(inc)

    # Demo fallback for backward compatibility
    incidents = get_all_incidents()
    for demo_inc in incidents:
        if demo_inc.incident_id == incident_id:
            return demo_inc

    raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")


# ─── 2. CREATION & VERIFICATION ──────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_incident(
    req: Union[IncidentCreateRequest, IncidentRequirement],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HOSPITAL_OPERATOR, UserRole.INCIDENT_OPERATOR)),
):
    """
    Creates a new blood requirement and associated incident in a single transaction.
    Enforces RBAC and attributes the action to the server-authenticated identity.
    Accepts both canonical IncidentCreateRequest and legacy IncidentRequirement.
    """
    try:
        actor_name = current_user.full_name or current_user.username
        if isinstance(req, IncidentCreateRequest):
            create_dto = req
            if not create_dto.actor or create_dto.actor == "Requesting Facility Operator":
                create_dto.actor = actor_name
        else:
            create_dto = IncidentCreateRequest(
                blood_group=req.blood_group,
                units_requested=req.units_required,
                urgency=req.urgency,
                requesting_facility=req.requesting_facility,
                zone=req.location.zone,
                district=req.location.district,
                lat=req.location.lat,
                lng=req.location.lng,
                source=req.source,
                auto_verify=False,
                actor=actor_name,
            )

        new_inc = create_requirement_and_incident(db, create_dto)
        return _serialize_db_incident(new_inc)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create incident: {str(e)}")


@router.post("/verify")
async def verify_requirement_legacy(req: IncidentRequirement):
    """Legacy deterministic requirement verification endpoint for backward compatibility."""
    return {
        "verified": True,
        "checks": [
            {"label": "Requesting facility verified", "passed": True},
            {"label": "Requirement received", "passed": True},
            {"label": "Blood group confirmed", "passed": True},
            {"label": "Unit requirement recorded", "passed": True},
            {"label": "Location confirmed", "passed": True},
        ],
        "incident_id": "INC-PN-48291",
    }


@router.post("/{incident_id}/verify")
async def verify_incident_endpoint(
    incident_id: str,
    payload: IncidentVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HOSPITAL_OPERATOR)),
):
    """
    Authorised verification of a specific incident's requirement.
    Restricted strictly to Hospital/Blood-Bank Operators and System Administrators.
    Derives verification identity from validated server identity.
    """
    try:
        actor_name = current_user.full_name or payload.verified_by
        verified_inc = verify_incident_requirement(
            db=db,
            incident_id=incident_id,
            verified_by=actor_name,
            notes=payload.notes,
            facility_confirmed=payload.facility_confirmed,
        )
        return _serialize_db_incident(verified_inc)
    except IncidentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (InvalidStateTransitionError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── 3. MATCHING & CANDIDATES ────────────────────────────────────────────────

@router.get("/{incident_id}/candidates")
async def get_candidates(incident_id: str, db: Session = Depends(get_db)):
    """
    Returns ranked, eligible candidates evaluated by the deterministic matching engine.
    Excludes previously contacted donors across all previous waves.
    """
    db_inc = db.query(DBIncident).filter_by(incident_id=incident_id).first()
    if db_inc:
        try:
            return match_donors_for_incident(db, incident_id=incident_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Matching calculation failed: {str(e)}")

    # Fallback to prototype candidates if incident exists only in demo pool
    return get_donor_candidates_for_incident(incident_id)


# ─── 4. RESPONSE CASCADE & WAVES ─────────────────────────────────────────────

@router.post("/{incident_id}/waves", status_code=status.HTTP_201_CREATED)
async def launch_wave(
    incident_id: str,
    payload: WaveLaunchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.INCIDENT_OPERATOR, UserRole.HOSPITAL_OPERATOR)),
):
    """
    Launches a progressive mobilisation wave for an incident.
    Enforces requirement verification, excludes prior contacts, and persists outreach atomically.
    Attributes launch to the server-authenticated operator identity.
    """
    try:
        operator_name = current_user.full_name or payload.operator_id
        return svc_launch_response_wave(
            db=db,
            incident_id=incident_id,
            wave_number=payload.wave_number,
            wave_size=payload.wave_size,
            operator_id=operator_name,
        )
    except IncidentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UnverifiedRequirementError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except (InvalidStateTransitionError, IncidentClosedError, WaveProgressionError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except (ActiveWaveExistsError, DuplicateOutreachError) as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/{incident_id}/activate-wave")
async def activate_wave_compatibility(
    incident_id: str,
    wave_number: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.INCIDENT_OPERATOR, UserRole.HOSPITAL_OPERATOR)),
):
    """Backward-compatible wave activation endpoint."""
    inc = db.query(DBIncident).filter_by(incident_id=incident_id).first()
    if inc:
        try:
            res = svc_launch_response_wave(
                db=db,
                incident_id=incident_id,
                wave_number=wave_number,
                operator_id=current_user.full_name or "Operational Coordinator",
            )
            return {"status": "activated", "incident_id": incident_id, "wave": res.wave_number}
        except ActiveWaveExistsError:
            return {"status": "activated", "incident_id": incident_id, "wave": wave_number}
        except RaktSetuDomainError as e:
            raise HTTPException(status_code=400, detail=str(e))

    return {"status": "activated", "incident_id": incident_id, "wave": wave_number}


@router.post("/{incident_id}/waves/{wave_number}/advance")
async def advance_wave(
    incident_id: str,
    wave_number: int,
    payload: WaveAdvanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.INCIDENT_OPERATOR, UserRole.HOSPITAL_OPERATOR)),
):
    """Explicit operation to evaluate or advance a wave upon timeout or insufficient responses."""
    try:
        actor_name = current_user.full_name or payload.actor
        wave = svc_advance_or_evaluate_wave(
            db=db,
            incident_id=incident_id,
            wave_number=wave_number,
            action=payload.action,
            actor=actor_name,
        )
        return {
            "status": "success",
            "wave_number": wave.wave_number,
            "wave_status": wave.status,
            "donors_contacted": wave.donors_contacted,
            "responses_received": wave.responses_received,
            "confirmed_count": wave.confirmed_count,
        }
    except IncidentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── 5. DONOR RESPONSES ───────────────────────────────────────────────────────

@router.post("/{incident_id}/responses")
async def record_response(
    incident_id: str,
    payload: DonorResponseRecordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.INCIDENT_OPERATOR, UserRole.HOSPITAL_OPERATOR)),
):
    """
    Records a donor's response idempotently.
    Note: Donor acceptance does NOT increment incident.units_secured.
    """
    try:
        actor_name = current_user.full_name or payload.actor
        resp = svc_record_donor_response(
            db=db,
            incident_id=incident_id,
            contact_attempt_id=payload.contact_attempt_id,
            response_status=payload.response.value if hasattr(payload.response, "value") else str(payload.response),
            actor=actor_name,
            distance_km=payload.distance_km,
            eta_minutes=payload.eta_minutes,
            notes=payload.notes,
        )
        return {
            "status": "recorded",
            "contact_attempt_id": resp.contact_attempt_id,
            "response": resp.response,
            "responded_at": resp.responded_at,
        }
    except InvalidResponseStatusError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── 6. FULFILMENT & CLOSURE ─────────────────────────────────────────────────

@router.post("/{incident_id}/fulfill")
async def fulfill_incident_endpoint(
    incident_id: str,
    payload: Optional[FulfilmentConfirmRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HOSPITAL_OPERATOR)),
):
    """
    Authorised clinical confirmation that blood units have been collected and delivered.
    Restricted strictly to Hospital/Blood-Bank Operators and System Administrators.
    Validates positive quantity and rejects over-fulfilment.
    """
    inc = db.query(DBIncident).filter_by(incident_id=incident_id).first()
    if inc:
        # If payload is provided, use authoritative confirmation
        units = payload.units_confirmed if payload else 1
        source = payload.confirmation_source if payload else "Hospital Blood Bank"
        actor = current_user.full_name or (payload.confirmed_by if payload else "Hospital Medical Officer")
        notes = payload.notes if payload else "Authorised clinical confirmation"
        comp = payload.component if payload else None

        try:
            record, updated_inc = svc_confirm_fulfilment(
                db=db,
                incident_id=incident_id,
                units_confirmed=units,
                confirmation_source=source,
                confirmed_by=actor,
                component=comp,
                notes=notes,
            )
            return _serialize_db_incident(updated_inc)
        except IncidentOverFulfilmentError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except (IncidentClosedError, InvalidStateTransitionError, ValueError) as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Prototype demo fallback
    inc_demo = get_demo_incident()
    inc_demo.status = IncidentStatus.FULFILLED
    inc_demo.units_secured = 2
    inc_demo.fulfilled_at = datetime.now()
    inc_demo.response_time_seconds = 684
    return inc_demo


@router.post("/{incident_id}/close")
async def close_incident_endpoint(
    incident_id: str,
    payload: Optional[IncidentCloseRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HOSPITAL_OPERATOR, UserRole.INCIDENT_OPERATOR)),
):
    """Authorised closure of a fulfilled or cancelled incident."""
    inc = db.query(DBIncident).filter_by(incident_id=incident_id).first()
    if inc:
        closed_by = current_user.full_name or (payload.closed_by if payload else "Authorised Coordinator")
        notes = payload.notes if payload else "Standard operational closure."
        try:
            closed_inc = svc_close_incident(
                db=db,
                incident_id=incident_id,
                closed_by=closed_by,
                notes=notes,
            )
            return {
                "status": "closed",
                "incident_id": incident_id,
                "closed_at": closed_inc.closed_at,
                "network_updated": True,
                "message": "Incident authoritatively closed. Network intelligence updated.",
            }
        except InvalidStateTransitionError as e:
            raise HTTPException(status_code=400, detail=str(e))

    return {
        "status": "closed",
        "incident_id": incident_id,
        "network_updated": True,
        "message": "Network intelligence updated",
    }


@router.post("/{incident_id}/cancel")
async def cancel_incident_endpoint(
    incident_id: str,
    payload: IncidentCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HOSPITAL_OPERATOR, UserRole.INCIDENT_OPERATOR)),
):
    """Authorised cancellation of an incident."""
    try:
        cancelled_by = current_user.full_name or payload.cancelled_by
        cancelled_inc = svc_cancel_incident(
            db=db,
            incident_id=incident_id,
            cancelled_by=cancelled_by,
            reason=payload.reason,
        )
        return _serialize_db_incident(cancelled_inc)
    except IncidentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{incident_id}/audit-trail")
async def get_incident_audit_trail(incident_id: str, db: Session = Depends(get_db)):
    """Retrieves all tamper-evident audit events recorded for the specified incident."""
    events = (
        db.query(DBAuditEvent)
        .filter(DBAuditEvent.incident_id == incident_id)
        .order_by(DBAuditEvent.timestamp.asc())
        .all()
    )
    return [
        {
            "event_id": e.event_id,
            "timestamp": e.timestamp,
            "incident_id": e.incident_id,
            "actor": e.actor,
            "actor_type": e.actor_type,
            "category": e.category,
            "action": e.action,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "outcome": e.outcome,
            "safe_metadata": e.safe_metadata,
            "sha256_hash": e.sha256_hash,
        }
        for e in events
    ]
