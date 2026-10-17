"""
RAKTSETU API — Secure Notification Delivery Router (Milestone 7)
Provides endpoints to inspect notification delivery states, retry failed dispatches,
and securely process carrier webhook delivery receipts with cryptographic signature verification.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles
from app.models.db_models import NotificationDelivery, User, UserRole, Incident
from app.services.notifications import notification_gateway, NotificationStatus

router = APIRouter()


# ─── 1. Query Notification States ─────────────────────────────────────────────

@router.get("/incident/{incident_id}")
async def get_incident_notifications(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves all notification delivery records for a specific incident.
    Exposes only privacy-masked recipient phone numbers.
    Accessible to all authenticated platform roles.
    """
    incident = db.query(Incident).filter_by(incident_id=incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    notifications = (
        db.query(NotificationDelivery)
        .filter_by(incident_id=incident.id)
        .order_by(desc(NotificationDelivery.created_at))
        .all()
    )

    return [
        {
            "dispatch_id": n.dispatch_id,
            "idempotency_key": n.idempotency_key,
            "incident_id": incident.incident_id,
            "wave_id": n.wave_id,
            "channel": n.channel,
            "provider": n.provider,
            "recipient_phone_masked": n.recipient_phone_masked,
            "status": n.status,
            "provider_message_id": n.provider_message_id,
            "attempt_count": n.attempt_count,
            "max_retries": n.max_retries,
            "created_at": n.created_at,
            "dispatched_at": n.dispatched_at,
            "delivered_at": n.delivered_at,
            "failed_at": n.failed_at,
            "last_error": n.last_error,
        }
        for n in notifications
    ]


@router.get("/{dispatch_id}")
async def get_notification_record(
    dispatch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves a single notification delivery record by its unique dispatch_id."""
    record = db.query(NotificationDelivery).filter_by(dispatch_id=dispatch_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Notification '{dispatch_id}' not found.")

    return {
        "dispatch_id": record.dispatch_id,
        "idempotency_key": record.idempotency_key,
        "channel": record.channel,
        "provider": record.provider,
        "recipient_phone_masked": record.recipient_phone_masked,
        "status": record.status,
        "provider_message_id": record.provider_message_id,
        "attempt_count": record.attempt_count,
        "max_retries": record.max_retries,
        "created_at": record.created_at,
        "dispatched_at": record.dispatched_at,
        "delivered_at": record.delivered_at,
        "failed_at": record.failed_at,
        "last_error": record.last_error,
    }


# ─── 2. Authorised Retries ───────────────────────────────────────────────────

@router.post("/{dispatch_id}/retry")
async def retry_notification(
    dispatch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.INCIDENT_OPERATOR)),
):
    """
    Authorised operation allowing an Incident Operator or Platform Administrator
    to retry a failed notification dispatch within permitted retry boundaries.
    """
    try:
        updated = notification_gateway.retry_failed_notification(
            db=db,
            dispatch_id=dispatch_id,
            operator_username=current_user.full_name or current_user.username,
        )
        return {
            "status": "retried",
            "dispatch_id": updated.dispatch_id,
            "delivery_status": updated.status,
            "attempt_count": updated.attempt_count,
            "provider_message_id": updated.provider_message_id,
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── 3. Carrier Webhooks & Delivery Receipts ─────────────────────────────────

@router.post("/webhook/delivery")
async def process_delivery_webhook_endpoint(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Receives carrier delivery receipts (DLR callbacks) from telecommunications providers.
    Verifies cryptographic signature, parses delivery status, and updates delivery record monotonically.
    """
    raw_body = await request.body()
    headers_dict = dict(request.headers)

    # Attempt to parse json or form-encoded data
    payload_json: Dict[str, Any] = {}
    try:
        payload_json = await request.json()
    except Exception:
        # Form-urlencoded data (typical for Twilio DLR callbacks)
        try:
            form = await request.form()
            payload_json = dict(form)
        except Exception:
            payload_json = {}

    success, message, record = notification_gateway.process_delivery_webhook(
        db=db,
        payload_bytes=raw_body,
        payload_json=payload_json,
        headers=headers_dict,
        request_url=str(request.url),
    )

    if not success:
        # Reject invalid signatures with 403 Forbidden
        if "signature" in message.lower() or "unauthorized" in message.lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return {
        "status": "acknowledged",
        "detail": message,
        "dispatch_id": record.dispatch_id if record else None,
        "delivery_status": record.status if record else None,
    }
