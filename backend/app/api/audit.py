"""
RAKTSETU API — Audit Trail Router
Provides verified accountability and audit event retrieval across the network.
Never exposes credentials, passwords, or personal donor contact details.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.db_models import AuditEvent as DBAuditEvent
from app.services.audit import verify_audit_hash_chain

router = APIRouter()


@router.get("/verify-chain")
async def verify_chain_endpoint(db: Session = Depends(get_db)):
    """
    Cryptographically verifies the SHA-256 hash chain of the audit trail.
    Ensures that no past record has been tampered with or modified.
    """
    res = verify_audit_hash_chain(db)
    res["message"] = (
        f"Cryptographic SHA-256 audit hash chain verified successfully ({res['verified_events']} events verified)."
        if res["valid"]
        else f"Audit chain verification failure: {res['error']}"
    )
    return res


@router.get("/")
async def list_audit_events(
    category: Optional[str] = Query(None, description="Filter by category (Verification, Dispatch, Donor Response, Fulfilment, Lifecycle)"),
    incident_id: Optional[str] = Query(None, description="Filter by public incident ID"),
    actor_type: Optional[str] = Query(None, description="Filter by actor type (System, Operator, Donor, Hospital)"),
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Retrieves global audit events from persistence.
    Returns deterministic SHA-256 hashes for cryptographic traceability.
    """
    query = db.query(DBAuditEvent)

    if category:
        query = query.filter(DBAuditEvent.category == category)
    if incident_id:
        query = query.filter(DBAuditEvent.incident_id == incident_id)
    if actor_type:
        query = query.filter(DBAuditEvent.actor_type == actor_type)

    total = query.count()
    events = query.order_by(desc(DBAuditEvent.timestamp)).offset(skip).limit(limit).all()

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


@router.get("/{event_id}")
async def get_audit_event(
    event_id: str,
    db: Session = Depends(get_db),
):
    """Retrieves a single verified audit event by its event ID."""
    event = db.query(DBAuditEvent).filter_by(event_id=event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Audit event '{event_id}' not found.")

    return {
        "event_id": event.event_id,
        "timestamp": event.timestamp,
        "incident_id": event.incident_id,
        "actor": event.actor,
        "actor_type": event.actor_type,
        "category": event.category,
        "action": event.action,
        "entity_type": event.entity_type,
        "entity_id": event.entity_id,
        "outcome": event.outcome,
        "safe_metadata": event.safe_metadata,
        "sha256_hash": event.sha256_hash,
    }
