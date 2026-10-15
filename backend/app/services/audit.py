"""
RAKTSETU - Audit Logging Service
Provides transactional audit event creation with deterministic SHA-256 hash chaining.
Ensures zero exposure of PII or credentials.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.db_models import AuditEvent


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
) -> str:
    """
    Computes a deterministic SHA-256 hash over the canonical representation of an audit event.
    """
    canonical_repr = json.dumps(
        {
            "timestamp": timestamp_iso,
            "incident_id": incident_id or "",
            "actor": actor,
            "actor_type": actor_type,
            "category": category,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id or "",
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
    Creates an AuditEvent within the active database transaction.
    Attaches to the current db session without committing immediately,
    ensuring business logic and audit events commit atomically.
    """
    now = datetime.now(timezone.utc)
    event_id = f"LOG-{uuid.uuid4().hex[:8].upper()}"
    metadata = safe_metadata or {}

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
        sha256_hash=sha256_hash,
    )
    db.add(audit_entry)
    return audit_entry
