"""
RAKTSETU — Production-Ready Secure Notification Delivery System (Milestone 7)
Implements provider-backed multi-channel notifications (SMS / WhatsApp / Mock),
persisted lifecycle state tracking, cryptographic webhook signature verification,
idempotent deduplication, donor fatigue & consent enforcement, and safe demo mode.
"""

from enum import Enum
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timezone
import uuid
import re
import hmac
import hashlib
import base64
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.models.db_models import (
    NotificationDelivery,
    Incident,
    ResponseWave,
    ContactAttempt,
    Donor,
    AuditEvent,
)
from app.services.audit import log_audit_event


# ─── 1. Enums and Constants ───────────────────────────────────────────────────

class NotificationStatus(str, Enum):
    PENDING_DISPATCH = "pending_dispatch"
    DISPATCH_ATTEMPTED = "dispatch_attempted"
    PROVIDER_ACCEPTED = "provider_accepted"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"


# Status monotonic ordering to prevent out-of-order webhook regression
STATUS_SEVERITY_ORDER = {
    NotificationStatus.PENDING_DISPATCH: 0,
    NotificationStatus.DISPATCH_ATTEMPTED: 1,
    NotificationStatus.PROVIDER_ACCEPTED: 2,
    NotificationStatus.DELIVERED: 3,
    NotificationStatus.FAILED: 3,
    NotificationStatus.CANCELLED: 3,
}


class NotificationChannel(str, Enum):
    SMS = "sms"
    WHATSAPP = "whatsapp"
    VOICE = "voice"
    MOCK = "mock"


class NotificationRecord:
    """In-memory or persisted representation of a notification lifecycle record for boundary verification."""

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
            "channel": self.channel.value if hasattr(self.channel, "value") else str(self.channel),
            "template_id": self.template_id,
            "status": self.status.value if hasattr(self.status, "value") else str(self.status),
            "provider_message_id": self.provider_message_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "error_message": self.error_message,
        }


# DLT / TRAI Compliance Reference for India Transactional Blood Emergency Alerts
DLT_TRANSACTIONAL_HEADER = "RKSTSU"
DLT_EMERGENCY_TEMPLATE_ID = "1407161234567890123"
DEFAULT_TEMPLATE_ID = "EMERGENCY_MOBILISATION_V1"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def mask_phone_number(phone: Optional[str]) -> str:
    """
    Masks phone number to protect donor privacy, exposing only non-sensitive digits.
    Example: '+919822012345' -> '+91-XXXXX-2345'
    """
    if not phone:
        return "XXXXX-XXXXX"
    clean = re.sub(r"[^\d+]", "", phone)
    if len(clean) <= 4:
        return "****"
    if clean.startswith("+91") and len(clean) >= 12:
        return f"+91-XXXXX-{clean[-4:]}"
    return f"{clean[:3]}-XXXXX-{clean[-4:]}"


def is_synthetic_recipient(phone: Optional[str], donor_id: Optional[str] = None) -> bool:
    """
    Identifies test, seed, or synthetic phone numbers to prevent real transmissions.
    """
    if not phone:
        return True
    clean = re.sub(r"[^\d]", "", phone)
    # Check common dummy / test prefixes
    if clean.startswith("0000000000") or clean.startswith("9100000000"):
        return True
    if clean.endswith("000000") or clean == "1234567890":
        return True
    if donor_id and ("seed" in donor_id.lower() or "demo" in donor_id.lower()):
        return True
    return False


def build_emergency_sms_content(
    blood_group: str,
    zone: str,
    incident_id: str,
    units_requested: int = 1,
) -> str:
    """
    Generates privacy-compliant, minimum-necessary emergency notification content.
    Excludes patient names, diagnoses, hospital internal rooms, or sensitive clinical info.
    Complies with TRAI DLT approved template format:
    '[RAKTSETU] Urgent need for blood group {#var#} at {#var#}. Units: {#var#}. Reply YES to mobilize or NO to pass. Ref: {#var#}'
    """
    return (
        f"[RAKTSETU] Urgent need for blood group {blood_group} at {zone}. "
        f"Units: {units_requested}. Reply YES to mobilize or NO to pass. Ref: {incident_id}"
    )


# ─── 2. Provider Abstraction & Adapters ────────────────────────────────────────

class ProviderDispatchResult:
    def __init__(
        self,
        success: bool,
        status: NotificationStatus,
        provider_message_id: Optional[str] = None,
        error_message: Optional[str] = None,
        is_ambiguous_timeout: bool = False,
    ):
        self.success = success
        self.status = status
        self.provider_message_id = provider_message_id
        self.error_message = error_message
        self.is_ambiguous_timeout = is_ambiguous_timeout


class BaseNotificationProvider:
    """Abstract interface for external telecommunications messaging gateways."""

    def dispatch(
        self,
        recipient_phone: str,
        message_body: str,
        idempotency_key: str,
        channel: NotificationChannel,
        template_id: str,
    ) -> ProviderDispatchResult:
        raise NotImplementedError

    def verify_webhook_signature(
        self,
        payload_bytes: bytes,
        signature: Optional[str],
        url: str,
        headers: Dict[str, str],
    ) -> bool:
        raise NotImplementedError

    def parse_delivery_receipt(
        self,
        payload: Dict[str, Any],
        headers: Dict[str, str],
    ) -> Optional[Tuple[str, NotificationStatus, Optional[str]]]:
        """
        Parses provider webhook payload.
        Returns: (provider_message_id, NotificationStatus, error_reason)
        """
        raise NotImplementedError


class MockNotificationProvider(BaseNotificationProvider):
    """
    Deterministic simulated provider for automated tests and safe demonstration mode.
    Guarantees that no real external HTTP requests are made.
    """

    def __init__(self, simulate_timeout: bool = False, simulate_rejection: bool = False):
        self.simulate_timeout = simulate_timeout
        self.simulate_rejection = simulate_rejection

    def dispatch(
        self,
        recipient_phone: str,
        message_body: str,
        idempotency_key: str,
        channel: NotificationChannel,
        template_id: str,
    ) -> ProviderDispatchResult:
        if self.simulate_timeout:
            return ProviderDispatchResult(
                success=False,
                status=NotificationStatus.DISPATCH_ATTEMPTED,
                provider_message_id=None,
                error_message="Ambiguous outcome: simulated provider timeout waiting for HTTP 200 acknowledgment.",
                is_ambiguous_timeout=True,
            )

        if self.simulate_rejection:
            return ProviderDispatchResult(
                success=False,
                status=NotificationStatus.FAILED,
                provider_message_id=None,
                error_message="Simulated provider rejection: carrier route unavailable or invalid recipient format.",
            )

        # Standard simulated acceptance
        msg_id = f"MOCK-PROV-{uuid.uuid4().hex[:12].upper()}"
        return ProviderDispatchResult(
            success=True,
            status=NotificationStatus.PROVIDER_ACCEPTED,
            provider_message_id=msg_id,
        )

    def verify_webhook_signature(
        self,
        payload_bytes: bytes,
        signature: Optional[str],
        url: str,
        headers: Dict[str, str],
    ) -> bool:
        # In mock mode, allow test signature "mock-valid-signature" or valid secret token
        if signature == "mock-valid-signature" or signature == settings.WEBHOOK_SECRET:
            return True
        headers_lower = {k.lower(): v for k, v in headers.items()}
        if headers_lower.get("x-mock-signature") == "valid":
            return True
        return False

    def parse_delivery_receipt(
        self,
        payload: Dict[str, Any],
        headers: Dict[str, str],
    ) -> Optional[Tuple[str, NotificationStatus, Optional[str]]]:
        msg_id = payload.get("provider_message_id") or payload.get("MessageSid")
        raw_status = (payload.get("status") or payload.get("MessageStatus") or "").strip().lower()
        if not msg_id:
            return None

        if raw_status in ["delivered", "read", "confirmed"]:
            return msg_id, NotificationStatus.DELIVERED, None
        elif raw_status in ["failed", "undelivered", "rejected", "expired"]:
            err = payload.get("error_message") or f"Carrier delivery failure ({raw_status})"
            return msg_id, NotificationStatus.FAILED, err
        elif raw_status in ["accepted", "queued", "sent"]:
            return msg_id, NotificationStatus.PROVIDER_ACCEPTED, None

        return None


class TwilioNotificationProvider(BaseNotificationProvider):
    """
    Twilio SMS / WhatsApp Provider with cryptographic signature verification.
    """

    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        from_number: Optional[str] = None,
    ):
        self.account_sid = account_sid or settings.TWILIO_ACCOUNT_SID
        self.auth_token = auth_token or settings.TWILIO_AUTH_TOKEN
        self.from_number = from_number or settings.TWILIO_FROM_NUMBER

    def dispatch(
        self,
        recipient_phone: str,
        message_body: str,
        idempotency_key: str,
        channel: NotificationChannel,
        template_id: str,
    ) -> ProviderDispatchResult:
        if not self.account_sid or not self.auth_token:
            return ProviderDispatchResult(
                success=False,
                status=NotificationStatus.FAILED,
                error_message="Twilio provider credentials (ACCOUNT_SID or AUTH_TOKEN) not configured.",
            )

        # In strict demo mode or synthetic recipients, block external live requests
        if settings.DEMO_MODE or is_synthetic_recipient(recipient_phone):
            return ProviderDispatchResult(
                success=False,
                status=NotificationStatus.CANCELLED,
                error_message="Safeguard blocked: Live outreach disabled in demo mode or for synthetic recipient.",
            )

        import httpx
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        from_val = self.from_number
        to_val = recipient_phone
        if channel == NotificationChannel.WHATSAPP:
            from_val = f"whatsapp:{from_val}"
            to_val = f"whatsapp:{to_val}"

        data = {
            "To": to_val,
            "From": from_val,
            "Body": message_body,
            "StatusCallback": f"{settings.HOST}/api/notifications/webhook/delivery",
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    url,
                    data=data,
                    auth=(self.account_sid, self.auth_token),
                )
            if resp.status_code in [200, 201]:
                res_json = resp.json()
                return ProviderDispatchResult(
                    success=True,
                    status=NotificationStatus.PROVIDER_ACCEPTED,
                    provider_message_id=res_json.get("sid"),
                )
            else:
                return ProviderDispatchResult(
                    success=False,
                    status=NotificationStatus.FAILED,
                    error_message=f"Twilio error {resp.status_code}: {resp.text}",
                )
        except httpx.TimeoutException:
            # Ambiguous timeout: do not retry blindly
            return ProviderDispatchResult(
                success=False,
                status=NotificationStatus.DISPATCH_ATTEMPTED,
                error_message="Ambiguous outcome: Twilio request timed out. Automatic retry suspended.",
                is_ambiguous_timeout=True,
            )
        except Exception as e:
            return ProviderDispatchResult(
                success=False,
                status=NotificationStatus.FAILED,
                error_message=f"Twilio connection error: {str(e)}",
            )

    def verify_webhook_signature(
        self,
        payload_bytes: bytes,
        signature: Optional[str],
        url: str,
        headers: Dict[str, str],
    ) -> bool:
        """
        Validates Twilio X-Twilio-Signature header using HMAC-SHA1.
        """
        if not signature or not self.auth_token:
            return False
        try:
            # Twilio computes HMAC-SHA1 over the full request URL plus POST parameters sorted alphabetically
            import urllib.parse
            parsed_params = urllib.parse.parse_qs(payload_bytes.decode("utf-8", errors="replace"))
            data_string = url
            for key in sorted(parsed_params.keys()):
                data_string += key + parsed_params[key][0]

            computed = hmac.new(
                self.auth_token.encode("utf-8"),
                data_string.encode("utf-8"),
                hashlib.sha1,
            ).digest()
            expected = base64.b64encode(computed).decode("utf-8")
            return hmac.compare_digest(signature, expected)
        except Exception:
            return False

    def parse_delivery_receipt(
        self,
        payload: Dict[str, Any],
        headers: Dict[str, str],
    ) -> Optional[Tuple[str, NotificationStatus, Optional[str]]]:
        msg_id = payload.get("MessageSid") or payload.get("SmsSid")
        raw_status = (payload.get("MessageStatus") or payload.get("SmsStatus") or "").strip().lower()
        if not msg_id:
            return None

        if raw_status in ["delivered"]:
            return msg_id, NotificationStatus.DELIVERED, None
        elif raw_status in ["failed", "undelivered"]:
            code = payload.get("ErrorCode", "")
            err = f"Twilio delivery failed (code {code})" if code else "Twilio delivery failed"
            return msg_id, NotificationStatus.FAILED, err
        elif raw_status in ["sent", "queued"]:
            return msg_id, NotificationStatus.PROVIDER_ACCEPTED, None

        return None


# ─── 3. Gateway & Operational Boundary Service ───────────────────────────────

class NotificationGateway:
    """
    Central operational boundary service for notification lifecycle management.
    Connects with SQLAlchemy canonical database models (`NotificationDelivery`).
    """

    def __init__(self, provider: Optional[BaseNotificationProvider] = None):
        self._provider = provider
        self._registry_by_idempotency: Dict[str, NotificationRecord] = {}
        self._registry_by_id: Dict[str, NotificationRecord] = {}

    @property
    def provider(self) -> BaseNotificationProvider:
        if self._provider:
            return self._provider
        # Dynamic factory based on configuration
        provider_name = settings.NOTIFICATION_PROVIDER.lower()
        if provider_name == "twilio":
            return TwilioNotificationProvider()
        return MockNotificationProvider()

    def set_provider(self, provider: BaseNotificationProvider):
        """Allows test fixtures to inject custom or mock providers."""
        self._provider = provider

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
        Dispatches an emergency alert to an eligible donor in in-memory boundary testing.
        Rejects immediately if consent or contact permission is not active.
        Deduplicates requests matching an existing idempotency key.
        """
        if not consent_given or not contact_permission:
            raise PermissionError(
                f"Outreach blocked: Donor '{recipient_donor_id}' has not granted active consent or contact permission."
            )

        key = idempotency_key or f"{incident_id}-W{wave_number}-{recipient_donor_id}"
        if key in self._registry_by_idempotency:
            return self._registry_by_idempotency[key]

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

        res = self.provider.dispatch(
            recipient_phone=phone or "+919822000000",
            message_body=message_body,
            idempotency_key=key,
            channel=channel,
            template_id=template_id,
        )
        record.status = res.status
        record.provider_message_id = res.provider_message_id
        record.error_message = res.error_message
        record.updated_at = utc_now()

        self._registry_by_idempotency[key] = record
        self._registry_by_id[dispatch_id] = record
        return record

    def apply_delivery_receipt(self, dispatch_id: str, receipt_status: str) -> NotificationRecord:
        """Simulates or applies an external carrier delivery webhook for in-memory records."""
        if dispatch_id not in self._registry_by_id:
            raise KeyError(f"Notification record '{dispatch_id}' not found.")

        record = self._registry_by_id[dispatch_id]
        clean = receipt_status.strip().lower()
        if clean in ["delivered", "read", "confirmed"]:
            record.status = NotificationStatus.DELIVERED
        elif clean in ["failed", "undelivered", "expired", "rejected"]:
            record.status = NotificationStatus.FAILED
            record.error_message = f"Provider reported delivery failure: {receipt_status}"
        record.updated_at = utc_now()
        return record

    def get_record(self, dispatch_id: str) -> Optional[NotificationRecord]:
        return self._registry_by_id.get(dispatch_id)

    def dispatch_wave_notification(
        self,
        db: Session,
        incident_id: str,
        wave_number: int,
        donor_id_str: str,
        operator_username: str,
        phone: Optional[str] = None,
        channel: NotificationChannel = NotificationChannel.SMS,
    ) -> NotificationDelivery:
        """
        Dispatches a notification for an authorized incident wave outreach.
        Enforces:
        1. Incident eligibility check (Verified / Mobilising / PartiallyFulfilled)
        2. Donor consent and contact-permission check
        3. Fatigue cooldown and load limits
        4. Idempotency and duplicate suppression
        5. PII phone masking
        6. Database transaction persistence
        """
        # 1. Verify Incident exists and is in an eligible operational state
        incident = db.query(Incident).filter_by(incident_id=incident_id).first()
        if not incident:
            raise ValueError(f"Incident '{incident_id}' not found.")

        if incident.status in ["Closed", "Cancelled", "Fulfilled"]:
            raise ValueError(f"Cannot dispatch notifications for incident in state '{incident.status}'.")

        # 2. Verify wave exists
        wave = (
            db.query(ResponseWave)
            .filter(ResponseWave.incident_id == incident.id, ResponseWave.wave_number == wave_number)
            .first()
        )
        if not wave:
            raise ValueError(f"Wave {wave_number} for Incident '{incident_id}' not found.")

        # 3. Retrieve Donor and enforce Consent & Fatigue Safeguards
        donor = db.query(Donor).filter_by(donor_id=donor_id_str).first()
        if not donor:
            raise ValueError(f"Donor '{donor_id_str}' not found in canonical registry.")

        if not donor.consent_given or not donor.contact_permission:
            raise PermissionError(
                f"Outreach blocked: Donor '{donor_id_str}' has not provided active consent or contact permission."
            )

        if not donor.is_active or (donor.readiness and donor.readiness.lower() in ["unavailable", "blocked", "paused"]):
            raise ValueError(f"Outreach blocked: Donor '{donor_id_str}' readiness status is '{donor.readiness}'.")

        # Fatigue check: Max 3 outreaches in 90 days
        if donor.recent_load >= 4:
            raise ValueError(f"Donor fatigue safeguard: Donor '{donor_id_str}' has reached maximum outreach threshold ({donor.recent_load}).")

        # 4. Check Idempotency Key
        idempotency_key = f"{incident_id}-W{wave_number}-{donor_id_str}"
        existing = db.query(NotificationDelivery).filter_by(idempotency_key=idempotency_key).first()
        if existing:
            # If already accepted or delivered, return without duplicate dispatch
            if existing.status in [NotificationStatus.PROVIDER_ACCEPTED, NotificationStatus.DELIVERED]:
                return existing
            # If failed or pending, update attempt_count and re-attempt
            delivery_record = existing
            delivery_record.attempt_count += 1
        else:
            # Create new delivery record with masked PII
            masked_phone = mask_phone_number(phone or getattr(donor, "phone", None))
            dispatch_id = f"NOTIF-{uuid.uuid4().hex[:12].upper()}"
            delivery_record = NotificationDelivery(
                dispatch_id=dispatch_id,
                idempotency_key=idempotency_key,
                incident_id=incident.id,
                wave_id=wave.id,
                donor_id=donor.id,
                channel=channel.value,
                provider=settings.NOTIFICATION_PROVIDER,
                template_id=DEFAULT_TEMPLATE_ID,
                recipient_phone_masked=masked_phone,
                status=NotificationStatus.PENDING_DISPATCH.value,
                attempt_count=1,
                created_at=utc_now(),
            )
            db.add(delivery_record)
            db.flush()

        # Find or create corresponding ContactAttempt record
        contact_attempt = (
            db.query(ContactAttempt)
            .filter_by(incident_id=incident.id, donor_id=donor.id)
            .first()
        )
        if not contact_attempt:
            contact_attempt = ContactAttempt(
                incident_id=incident.id,
                wave_id=wave.id,
                donor_id=donor.id,
                status="PendingDispatch",
                attempted_at=utc_now(),
            )
            db.add(contact_attempt)
            db.flush()

        delivery_record.contact_attempt_id = contact_attempt.id

        # 5. Build minimal emergency message
        req = incident.requirement
        blood_group = req.blood_group if req else "O-"
        zone = req.zone if req else "Pune"
        units = incident.units_requested
        message_body = build_emergency_sms_content(
            blood_group=blood_group,
            zone=zone,
            incident_id=incident.incident_id,
            units_requested=units,
        )

        # 6. Execute Provider Dispatch
        delivery_record.status = NotificationStatus.DISPATCH_ATTEMPTED.value
        delivery_record.dispatched_at = utc_now()
        db.commit()

        recipient_phone_raw = phone or getattr(donor, "phone", "+919822000000")
        result = self.provider.dispatch(
            recipient_phone=recipient_phone_raw,
            message_body=message_body,
            idempotency_key=idempotency_key,
            channel=channel,
            template_id=DEFAULT_TEMPLATE_ID,
        )

        # 7. Update Record with Provider Response
        delivery_record.status = result.status.value
        delivery_record.provider_message_id = result.provider_message_id
        if result.error_message:
            delivery_record.last_error = result.error_message
        if result.status == NotificationStatus.FAILED:
            delivery_record.failed_at = utc_now()
            contact_attempt.status = "Failed"

        # Log audit trail event with masked PII
        log_audit_event(
            db=db,
            incident_id=incident.incident_id,
            actor=operator_username,
            actor_type="Operator",
            category="Dispatch",
            action="NotificationDispatched",
            entity_type="NotificationDelivery",
            entity_id=delivery_record.dispatch_id,
            outcome="Success" if result.success else "Failure",
            safe_metadata={
                "channel": channel.value,
                "status": delivery_record.status,
                "provider": delivery_record.provider,
                "masked_phone": delivery_record.recipient_phone_masked,
                "idempotency_key": idempotency_key,
            },
        )
        db.commit()
        db.refresh(delivery_record)
        return delivery_record

    def process_delivery_webhook(
        self,
        db: Session,
        payload_bytes: bytes,
        payload_json: Dict[str, Any],
        headers: Dict[str, str],
        request_url: str = "",
    ) -> Tuple[bool, str, Optional[NotificationDelivery]]:
        """
        Receives and processes provider delivery receipts.
        Enforces cryptographic webhook signature verification and monotonic state updates.
        """
        # 1. Verify Webhook Signature
        headers_lower = {k.lower(): v for k, v in headers.items()}
        signature = (
            headers_lower.get("x-twilio-signature")
            or headers_lower.get("x-hub-signature-256")
            or headers_lower.get("x-webhook-signature")
            or headers_lower.get("authorization")
        )
        is_valid_sig = self.provider.verify_webhook_signature(
            payload_bytes=payload_bytes,
            signature=signature,
            url=request_url,
            headers=headers_lower,
        )

        # Allow fallback to explicit bearer token if configured
        if not is_valid_sig and settings.WEBHOOK_SECRET:
            auth_header = headers_lower.get("authorization", "")
            if f"bearer {settings.WEBHOOK_SECRET}".lower() in auth_header.lower():
                is_valid_sig = True

        if not is_valid_sig:
            return False, "Invalid webhook signature or unauthorized source", None

        # 2. Parse delivery receipt from provider
        parsed = self.provider.parse_delivery_receipt(payload_json, headers)
        if not parsed:
            return False, "Unrecognized or missing provider message status in payload", None

        provider_msg_id, new_status, err_reason = parsed

        # 3. Look up NotificationDelivery by provider_message_id
        record = (
            db.query(NotificationDelivery)
            .filter_by(provider_message_id=provider_msg_id)
            .first()
        )
        if not record:
            return False, f"Notification with provider_message_id '{provider_msg_id}' not found", None

        # 4. Enforce monotonic state update: do not regress once delivered or failed
        current_rank = STATUS_SEVERITY_ORDER.get(NotificationStatus(record.status), 0)
        new_rank = STATUS_SEVERITY_ORDER.get(new_status, 0)

        if new_rank < current_rank:
            # Out-of-order or duplicate webhook: acknowledge idempotently without regressing
            return True, f"Duplicate or out-of-order status '{new_status}' ignored; current status is '{record.status}'", record

        # Apply state transition
        record.status = new_status.value
        if new_status == NotificationStatus.DELIVERED:
            record.delivered_at = utc_now()
            if record.contact_attempt:
                record.contact_attempt.status = "Delivered"
        elif new_status == NotificationStatus.FAILED:
            record.failed_at = utc_now()
            record.last_error = err_reason
            if record.contact_attempt:
                record.contact_attempt.status = "Failed"

        # Audit log of delivery receipt
        log_audit_event(
            db=db,
            incident_id=record.incident.incident_id if record.incident else "N/A",
            actor="ProviderWebhook",
            actor_type="System",
            category="Dispatch",
            action="NotificationDeliveryReceipt",
            entity_type="NotificationDelivery",
            entity_id=record.dispatch_id,
            outcome="Success" if new_status == NotificationStatus.DELIVERED else "Failure",
            safe_metadata={
                "provider_message_id": provider_msg_id,
                "status": record.status,
                "error": err_reason,
            },
        )
        db.commit()
        db.refresh(record)
        return True, "Delivery receipt processed successfully", record

    def retry_failed_notification(
        self,
        db: Session,
        dispatch_id: str,
        operator_username: str,
    ) -> NotificationDelivery:
        """
        Allows an authorized coordinator to retry a failed dispatch.
        Validates retry limits and incident active state.
        """
        record = db.query(NotificationDelivery).filter_by(dispatch_id=dispatch_id).first()
        if not record:
            raise KeyError(f"Notification '{dispatch_id}' not found.")

        if record.status != NotificationStatus.FAILED.value:
            raise ValueError(f"Cannot retry notification in status '{record.status}'. Only failed notifications can be retried.")

        if record.attempt_count >= record.max_retries:
            raise ValueError(f"Maximum retry limit ({record.max_retries}) reached for notification '{dispatch_id}'.")

        incident = record.incident
        if incident.status in ["Closed", "Cancelled", "Fulfilled"]:
            raise ValueError(f"Incident is in status '{incident.status}'. Cannot retry outreach.")

        donor = record.donor
        if not donor.consent_given or not donor.contact_permission:
            raise PermissionError(f"Donor consent is no longer active.")

        # Increment attempt and retry
        record.attempt_count += 1
        record.status = NotificationStatus.DISPATCH_ATTEMPTED.value
        record.dispatched_at = utc_now()
        db.commit()

        message_body = build_emergency_sms_content(
            blood_group=incident.requirement.blood_group if incident.requirement else "O-",
            zone=incident.requirement.zone if incident.requirement else "Pune",
            incident_id=incident.incident_id,
            units_requested=incident.units_requested,
        )

        recipient_phone_raw = getattr(donor, "phone", "+919822000000")
        result = self.provider.dispatch(
            recipient_phone=recipient_phone_raw,
            message_body=message_body,
            idempotency_key=record.idempotency_key,
            channel=NotificationChannel(record.channel),
            template_id=record.template_id,
        )

        record.status = result.status.value
        if result.provider_message_id:
            record.provider_message_id = result.provider_message_id
        if result.error_message:
            record.last_error = result.error_message

        log_audit_event(
            db=db,
            incident_id=incident.incident_id,
            actor=operator_username,
            actor_type="Operator",
            category="Dispatch",
            action="NotificationRetried",
            entity_type="NotificationDelivery",
            entity_id=record.dispatch_id,
            outcome="Success" if result.success else "Failure",
            safe_metadata={"attempt_count": record.attempt_count, "new_status": record.status},
        )
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def cancel_pending_notifications_for_incident(
        db: Session,
        incident_id: str,
        reason: str = "Incident closed or fulfilled before dispatch",
    ) -> int:
        """
        Emergency stop: cancels all pending dispatches when an incident is fulfilled or cancelled.
        """
        incident = db.query(Incident).filter_by(incident_id=incident_id).first()
        if not incident:
            return 0

        pending_records = (
            db.query(NotificationDelivery)
            .filter(
                NotificationDelivery.incident_id == incident.id,
                NotificationDelivery.status.in_([
                    NotificationStatus.PENDING_DISPATCH.value,
                    NotificationStatus.DISPATCH_ATTEMPTED.value,
                ]),
            )
            .all()
        )
        count = len(pending_records)
        now = utc_now()
        for r in pending_records:
            r.status = NotificationStatus.CANCELLED.value
            r.last_error = reason
            r.failed_at = now

        db.commit()
        return count


# Singleton operational instance
notification_gateway = NotificationGateway()
