"""
RAKTSETU — Notification Boundary & Provider-Independent Gateway
Milestone 6: Security, Operational Safeguards & Notification Abstraction.

Implements a provider-independent notification interface with explicit lifecycle states:
- pending_dispatch
- dispatch_attempted
- provider_accepted
- delivered (only upon explicit provider delivery receipt)
- failed
- cancelled

Operational Safeguards:
1. Real donor outreach is strictly disabled during Milestone 6 to prevent contacting seed donors.
2. Consent and contact-permission checks are mandatory before any outreach attempt.
3. Phone numbers are masked in all logs and persisted records (minimum necessary disclosure).
4. Idempotency keys prevent duplicate transmissions.
5. Explicit distinction: Provider acceptance is NOT proof of delivery.
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid
import re


class NotificationStatus(str, Enum):
    PENDING_DISPATCH = "pending_dispatch"
    DISPATCH_ATTEMPTED = "dispatch_attempted"
    PROVIDER_ACCEPTED = "provider_accepted"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"


class NotificationChannel(str, Enum):
    SMS = "sms"
    WHATSAPP = "whatsapp"
    VOICE = "voice"
    MOCK = "mock"


def mask_phone_number(phone: Optional[str]) -> str:
    """Masks phone number leaving only the last 4 digits visible."""
    if not phone:
        return "XXXXX-XXXXX"
    clean = re.sub(r"[^\d+]", "", phone)
    if len(clean) <= 4:
        return "****"
    return f"{clean[:3]}-XXXXX-{clean[-4:]}"


class NotificationRecord:
    """In-memory or persisted representation of a notification lifecycle record."""

    def __init__(
        self,
        dispatch_id: str,
        idempotency_key: str,
        recipient_donor_id: str,
        recipient_phone_masked: str,
        incident_id: str,
        wave_number: int,
        channel: NotificationChannel,
        template_id: str,
        status: NotificationStatus = NotificationStatus.PENDING_DISPATCH,
        provider_message_id: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        error_message: Optional[str] = None,
    ):
        now = datetime.now(timezone.utc)
        self.dispatch_id = dispatch_id
        self.idempotency_key = idempotency_key
        self.recipient_donor_id = recipient_donor_id
        self.recipient_phone_masked = recipient_phone_masked
        self.incident_id = incident_id
        self.wave_number = wave_number
        self.channel = channel
        self.template_id = template_id
        self.status = status
        self.provider_message_id = provider_message_id
        self.created_at = created_at or now
        self.updated_at = updated_at or now
        self.error_message = error_message

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dispatch_id": self.dispatch_id,
            "idempotency_key": self.idempotency_key,
            "recipient_donor_id": self.recipient_donor_id,
            "recipient_phone_masked": self.recipient_phone_masked,
            "incident_id": self.incident_id,
            "wave_number": self.wave_number,
            "channel": self.channel.value,
            "template_id": self.template_id,
            "status": self.status.value,
            "provider_message_id": self.provider_message_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "error_message": self.error_message,
        }


class BaseNotificationProvider:
    """Abstract interface for telecommunications / messaging providers."""

    def send(self, record: NotificationRecord, message_body: str) -> NotificationRecord:
        raise NotImplementedError

    def process_delivery_receipt(self, record: NotificationRecord, receipt_status: str) -> NotificationRecord:
        raise NotImplementedError


class MockNotificationProvider(BaseNotificationProvider):
    """
    Mock notification adapter for tests and local development.
    Transitions through pending -> dispatch_attempted -> provider_accepted.
    Never automatically fakes 'delivered' status without an explicit delivery receipt webhook.
    """

    def send(self, record: NotificationRecord, message_body: str) -> NotificationRecord:
        now = datetime.now(timezone.utc)
        record.status = NotificationStatus.DISPATCH_ATTEMPTED
        record.updated_at = now

        # Provider acknowledges request
        record.provider_message_id = f"MOCK-PROV-{uuid.uuid4().hex[:12].upper()}"
        record.status = NotificationStatus.PROVIDER_ACCEPTED
        record.updated_at = datetime.now(timezone.utc)
        return record

    def process_delivery_receipt(self, record: NotificationRecord, receipt_status: str) -> NotificationRecord:
        now = datetime.now(timezone.utc)
        clean = receipt_status.strip().lower()
        if clean in ["delivered", "read", "confirmed"]:
            record.status = NotificationStatus.DELIVERED
        elif clean in ["failed", "undelivered", "expired", "rejected"]:
            record.status = NotificationStatus.FAILED
            record.error_message = f"Provider reported delivery failure: {receipt_status}"
        record.updated_at = now
        return record


class NotificationGateway:
    """
    Central operational boundary service for dispatching donor alerts.
    Enforces idempotency, consent verification, recipient masking, and lifecycle tracking.
    """

    def __init__(self, provider: Optional[BaseNotificationProvider] = None):
        self.provider = provider or MockNotificationProvider()
        # In-memory registry for idempotency & status tracking in test/dev
        self._registry_by_idempotency: Dict[str, NotificationRecord] = {}
        self._registry_by_id: Dict[str, NotificationRecord] = {}

    def dispatch_donor_alert(
        self,
        recipient_donor_id: str,
        phone: Optional[str],
        incident_id: str,
        wave_number: int,
        consent_given: bool,
        contact_permission: bool,
        template_id: str = "EMERGENCY_MOBILISATION_V1",
        channel: NotificationChannel = NotificationChannel.MOCK,
        message_body: str = "Urgent blood requirement matching your profile. Please reply YES to accept.",
        idempotency_key: Optional[str] = None,
    ) -> NotificationRecord:
        """
        Dispatches an emergency alert to an eligible donor.
        Rejects immediately if consent or contact permission is not active.
        Deduplicates requests matching an existing idempotency key.
        """
        # 1. Enforce donor consent gate
        if not consent_given or not contact_permission:
            raise PermissionError(
                f"Outreach blocked: Donor '{recipient_donor_id}' has not granted active consent or contact permission."
            )

        # 2. Check Idempotency Key
        key = idempotency_key or f"{incident_id}-W{wave_number}-{recipient_donor_id}"
        if key in self._registry_by_idempotency:
            # Duplicate outreach detected: return existing record without dispatching again
            return self._registry_by_idempotency[key]

        # 3. Create initial pending record with masked PII
        dispatch_id = f"NOTIF-{uuid.uuid4().hex[:10].upper()}"
        masked_phone = mask_phone_number(phone)
        record = NotificationRecord(
            dispatch_id=dispatch_id,
            idempotency_key=key,
            recipient_donor_id=recipient_donor_id,
            recipient_phone_masked=masked_phone,
            incident_id=incident_id,
            wave_number=wave_number,
            channel=channel,
            template_id=template_id,
            status=NotificationStatus.PENDING_DISPATCH,
        )

        # 4. Dispatch through boundary provider
        updated_record = self.provider.send(record, message_body)

        # 5. Persist record in registry
        self._registry_by_idempotency[key] = updated_record
        self._registry_by_id[dispatch_id] = updated_record

        return updated_record

    def apply_delivery_receipt(self, dispatch_id: str, receipt_status: str) -> NotificationRecord:
        """Simulates or applies an external carrier delivery webhook."""
        if dispatch_id not in self._registry_by_id:
            raise KeyError(f"Notification record '{dispatch_id}' not found.")

        record = self._registry_by_id[dispatch_id]
        updated = self.provider.process_delivery_receipt(record, receipt_status)
        return updated

    def get_record(self, dispatch_id: str) -> Optional[NotificationRecord]:
        return self._registry_by_id.get(dispatch_id)


# Global singleton instance for operational boundary
notification_gateway = NotificationGateway()
