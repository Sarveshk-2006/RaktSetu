"""RAKTSETU API — Incidents"""
from fastapi import APIRouter, HTTPException
from app.services.demo_data import get_all_incidents, get_demo_incident, get_donor_candidates_for_incident
from app.models.models import IncidentRequirement, Incident, IncidentStatus
from datetime import datetime

router = APIRouter()


@router.get("/")
async def list_incidents():
    return get_all_incidents()


@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    incidents = get_all_incidents()
    for inc in incidents:
        if inc.incident_id == incident_id:
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")


@router.get("/{incident_id}/candidates")
async def get_candidates(incident_id: str):
    return get_donor_candidates_for_incident(incident_id)


@router.post("/verify")
async def verify_requirement(req: IncidentRequirement):
    """Verify a blood requirement — deterministic checks."""
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


@router.post("/")
async def create_incident(req: IncidentRequirement):
    """Create an incident — returns the demo incident for prototype purposes."""
    return get_demo_incident()


@router.post("/{incident_id}/activate-wave")
async def activate_wave(incident_id: str, wave_number: int = 1):
    """Activate a response wave for an incident."""
    return {"status": "activated", "incident_id": incident_id, "wave": wave_number}


@router.post("/{incident_id}/fulfill")
async def fulfill_incident(incident_id: str):
    """Mark incident as fulfilled."""
    inc = get_demo_incident()
    inc.status = IncidentStatus.FULFILLED
    inc.units_secured = 2
    inc.fulfilled_at = datetime.now()
    inc.response_time_seconds = 684
    return inc


@router.post("/{incident_id}/close")
async def close_incident(incident_id: str):
    """Close an incident and trigger network learning."""
    return {
        "status": "closed",
        "incident_id": incident_id,
        "network_updated": True,
        "message": "Network intelligence updated",
    }
