"""
RAKTSETU - Cryptographic Audit Logging Service
Provides transactional audit event creation with deterministic SHA-256 hash chaining.
Every event cryptographically incorporates the previous event's hash (prev_hash).
Ensures tamper detection, provenance, and zero exposure of PII or credentials.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models.db_models import AuditEvent

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def compute_audit_hash(
    timestamp_iso: str,
    incident_id: Optional[str],
    actor: str,
    actor_type: str,
    category: str,
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    outcome: str,
    safe_metadata: Dict[str, Any],
    prev_hash: Optional[str] = None,
) -> str:
    """
    Computes a deterministic SHA-256 hash over the canonical representation of an audit event,
    incorporating the cryptographic hash of the preceding event in the chain.
    """
    canonical_repr = json.dumps(
        {
            "prev_hash": prev_hash or GENESIS_HASH,
            "timestamp": timestamp_iso,
            "incident_id": incident_id or "",
            "actor": actor,
            "actor_type": actor_type,
            "category": category,
            "action": action,
            "entity_type": entity_type,
            "entity_id": str(entity_id) if entity_id is not None else "",
            "outcome": outcome,
            "safe_metadata": safe_metadata or {},
        },
        sort_keys=True,
    )
    return hashlib.sha256(canonical_repr.encode("utf-8")).hexdigest()


def log_audit_event(
    db: Session,
    actor: str,
    action: str,
    entity_type: str,
    incident_id: Optional[str] = None,
    actor_type: str = "System",
    category: str = "Lifecycle",
    entity_id: Optional[str] = None,
    outcome: str = "Success",
    safe_metadata: Optional[Dict[str, Any]] = None,
) -> AuditEvent:
    """
    Creates an AuditEvent linked to the preceding event in the immutable hash chain.
    Attaches to the active database transaction without committing immediately,
    ensuring business logic and audit events commit atomically.
    """
    now = datetime.now(timezone.utc)
    event_id = f"LOG-{uuid.uuid4().hex[:8].upper()}"
    metadata = safe_metadata or {}

    # Query latest audit entry to establish cryptographic hash link
    last_event = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
    prev_hash = last_event.sha256_hash if (last_event and last_event.sha256_hash) else GENESIS_HASH

    sha256_hash = compute_audit_hash(
        timestamp_iso=now.isoformat(),
        incident_id=incident_id,
        actor=actor,
        actor_type=actor_type,
        category=category,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        outcome=outcome,
        safe_metadata=metadata,
        prev_hash=prev_hash,
    )

    audit_entry = AuditEvent(
        event_id=event_id,
        timestamp=now,
        incident_id=incident_id,
        actor=actor,
        actor_type=actor_type,
        category=category,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        outcome=outcome,
        safe_metadata=metadata,
        prev_hash=prev_hash,
        sha256_hash=sha256_hash,
    )
    db.add(audit_entry)
    return audit_entry


def verify_audit_hash_chain(db: Session) -> Dict[str, Any]:
    """
    Traverses the audit event ledger chronologically from genesis to tip,
    cryptographically validating each link in the hash chain.
    Returns structured verification results and identifies broken links on tampering.
    """
    chained_events = (
        db.query(AuditEvent)
        .filter(AuditEvent.prev_hash.isnot(None))
        .order_by(AuditEvent.id.asc())
        .all()
    )
    total_in_db = db.query(AuditEvent).count()
    if not chained_events:
        return {
            "valid": True,
            "verified_events": 0,
            "total_events": total_in_db,
            "broken_at_event_id": None,
            "error": None,
        }

    for idx, ev in enumerate(chained_events):
        # 1. Check prev_hash pointer consistency
        if idx > 0:
            expected_prev = chained_events[idx - 1].sha256_hash
            if ev.prev_hash != expected_prev:
                return {
                    "valid": False,
                    "verified_events": idx,
                    "total_events": total_in_db,
                    "broken_at_event_id": ev.event_id,
                    "error": f"Broken chain pointer at event {ev.event_id}: expected prev_hash '{expected_prev}', found '{ev.prev_hash}'",
                }

        # 2. Recompute hash
        ts_iso = ev.timestamp.isoformat() if ev.timestamp.tzinfo else ev.timestamp.replace(tzinfo=timezone.utc).isoformat()
        recomputed = compute_audit_hash(
            timestamp_iso=ts_iso,
            incident_id=ev.incident_id,
            actor=ev.actor,
            actor_type=ev.actor_type,
            category=ev.category,
            action=ev.action,
            entity_type=ev.entity_type,
            entity_id=ev.entity_id,
            outcome=ev.outcome,
            safe_metadata=ev.safe_metadata or {},
            prev_hash=ev.prev_hash,
        )

        if ev.sha256_hash and ev.sha256_hash != recomputed:
            return {
                "valid": False,
                "verified_events": idx,
                "total_events": total_in_db,
                "broken_at_event_id": ev.event_id,
                "error": f"Hash mismatch at event {ev.event_id}: record hash '{ev.sha256_hash}' != recomputed '{recomputed}'",
            }

    return {
        "valid": True,
        "verified_events": len(chained_events),
        "total_events": total_in_db,
        "broken_at_event_id": None,
        "error": None,
    }
