"""
RAKTSETU — Milestone 7: Secure Notification Delivery Test Suite
Validates provider-backed notification lifecycle, TRAI / DLT template compliance,
consent & contact permissions, donor fatigue safeguards, cryptographic webhook signatures,
idempotency, out-of-order delivery receipts, ambiguous timeout handling, and retry policies.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone

from app.main import app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.db_models import (
    Incident,
    BloodRequirement,
    ResponseWave,
    ContactAttempt,
    Donor,
    NotificationDelivery,
    User,
    UserRole,
)
from app.services.notifications import (
    NotificationGateway,
    MockNotificationProvider,
    TwilioNotificationProvider,
    NotificationStatus,
    NotificationChannel,
    mask_phone_number,
    build_emergency_sms_content,
    is_synthetic_recipient,
)


@pytest.fixture
def clean_db(db_session):
    """Use the isolated in-memory test database session with all tables created."""
    yield db_session


@pytest.fixture
def setup_incident_and_wave(clean_db):
    """Creates a deterministic verified incident with wave 1 and test donors."""
    db = clean_db
    now = datetime.now(timezone.utc)

    # 1. Create or get test donors
    donor_consented = db.query(Donor).filter_by(donor_id="D-NOTIF-CONSENT").first()
    if not donor_consented:
        donor_consented = Donor(
            donor_id="D-NOTIF-CONSENT",
            blood_group="O+",
            readiness="Ready",
            zone="Kothrud",
            district="Pune",
            lat=18.5074,
            lng=73.8077,
            consent_given=True,
            contact_permission=True,
            recent_load=0,
            is_active=True,
        )
        db.add(donor_consented)

    donor_no_consent = db.query(Donor).filter_by(donor_id="D-NOTIF-NOCONSENT").first()
    if not donor_no_consent:
        donor_no_consent = Donor(
            donor_id="D-NOTIF-NOCONSENT",
            blood_group="O+",
            readiness="Ready",
            zone="Kothrud",
            district="Pune",
            lat=18.5074,
            lng=73.8077,
            consent_given=False,
            contact_permission=True,
            recent_load=0,
            is_active=True,
        )
        db.add(donor_no_consent)

    donor_fatigued = db.query(Donor).filter_by(donor_id="D-NOTIF-FATIGUED").first()
    if not donor_fatigued:
        donor_fatigued = Donor(
            donor_id="D-NOTIF-FATIGUED",
            blood_group="O+",
            readiness="Ready",
            zone="Kothrud",
            district="Pune",
            lat=18.5074,
            lng=73.8077,
            consent_given=True,
            contact_permission=True,
            recent_load=5,  # Exceeds max load threshold
            is_active=True,
        )
        db.add(donor_fatigued)

    db.commit()

    # 2. Create Incident & Requirement
    inc_id = f"INC-NOTIF-{datetime.now().strftime('%M%S%f')[:8]}"
    req = BloodRequirement(
        requirement_id=f"REQ-{inc_id}",
        blood_group="O+",
        component="Packed RBC",
        units_requested=2,
        urgency="Critical",
        requesting_facility="KEM Hospital Pune",
        zone="Kothrud",
        district="Pune",
        lat=18.5074,
        lng=73.8077,
        source="Hospital",
        verification_status="Verified",
        verified_at=now,
    )
    db.add(req)
    db.flush()

    incident = Incident(
        incident_id=inc_id,
        requirement_id=req.id,
        status="Mobilising",
        units_requested=2,
        units_secured=0,
        response_stage="Wave 1",
        created_at=now,
    )
    db.add(incident)
    db.flush()

    wave = ResponseWave(
        incident_id=incident.id,
        wave_number=1,
        status="Active",
        donors_contacted=1,
        launched_at=now,
    )
    db.add(wave)
    db.commit()

    return {
        "incident_id": inc_id,
        "wave_number": 1,
        "donor_consented": donor_consented.donor_id,
        "donor_no_consent": donor_no_consent.donor_id,
        "donor_fatigued": donor_fatigued.donor_id,
    }


# ─── 1. Dispatch with Valid Consent & Permissions ─────────────────────────────

def test_dispatch_with_valid_consent(clean_db, setup_incident_and_wave):
    """
    Test 1: Dispatches notification with valid consent.
    Verifies state transitions to provider_accepted and persists delivery record.
    """
    db = clean_db
    fixture = setup_incident_and_wave
    gateway = NotificationGateway(provider=MockNotificationProvider())

    record = gateway.dispatch_wave_notification(
        db=db,
        incident_id=fixture["incident_id"],
        wave_number=fixture["wave_number"],
        donor_id_str=fixture["donor_consented"],
        operator_username="Coord. Neha S.",
        phone="+919822012345",
    )

    assert record.id is not None
    assert record.dispatch_id.startswith("NOTIF-")
    assert record.status == NotificationStatus.PROVIDER_ACCEPTED.value
    assert record.provider_message_id is not None
    assert record.recipient_phone_masked == "+91-XXXXX-2345"
    assert record.attempt_count == 1


# ─── 2. Dispatch Blocked by Missing or Revoked Consent ────────────────────────

def test_dispatch_blocked_without_consent(clean_db, setup_incident_and_wave):
    """
    Test 2: Dispatch must be blocked if donor has not given active consent.
    """
    db = clean_db
    fixture = setup_incident_and_wave
    gateway = NotificationGateway(provider=MockNotificationProvider())

    with pytest.raises(PermissionError) as exc_info:
        gateway.dispatch_wave_notification(
            db=db,
            incident_id=fixture["incident_id"],
            wave_number=fixture["wave_number"],
            donor_id_str=fixture["donor_no_consent"],
            operator_username="Coord. Neha S.",
            phone="+919822099999",
        )
    assert "active consent" in str(exc_info.value).lower()


# ─── 3. Dispatch Blocked for Unauthorised Operators ──────────────────────────

@pytest.mark.asyncio
async def test_retry_blocked_for_unauthorised_roles(clean_db, setup_incident_and_wave):
    """
    Test 3: Auditors or unauthorised users cannot retry or mutate dispatches (HTTP 403).
    """
    db = clean_db
    fixture = setup_incident_and_wave
    gateway = NotificationGateway(provider=MockNotificationProvider())

    record = gateway.dispatch_wave_notification(
        db=db,
        incident_id=fixture["incident_id"],
        wave_number=fixture["wave_number"],
        donor_id_str=fixture["donor_consented"],
        operator_username="Coord. Neha S.",
    )
    # Manually set to failed for retry test
    record.status = NotificationStatus.FAILED.value
    db.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as read-only auditor
        res_login = await client.post(
            "/api/auth/login",
            json={"username": "auditor.pune", "password": "Auditor@Gov2026"},
        )
        assert res_login.status_code == 200
        token = res_login.json()["access_token"]

        # Auditor trying to trigger retry gets 403 Forbidden
        res_retry = await client.post(
            f"/api/notifications/{record.dispatch_id}/retry",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res_retry.status_code == 403


# ─── 4. Duplicate Dispatch Requests (Idempotency) ────────────────────────────

def test_idempotent_duplicate_dispatch_prevention(clean_db, setup_incident_and_wave):
    """
    Test 4: Subsequent dispatch requests with the same idempotency key return
    the existing record without creating duplicate transmissions.
    """
    db = clean_db
    fixture = setup_incident_and_wave
    gateway = NotificationGateway(provider=MockNotificationProvider())

    rec1 = gateway.dispatch_wave_notification(
        db=db,
        incident_id=fixture["incident_id"],
        wave_number=fixture["wave_number"],
        donor_id_str=fixture["donor_consented"],
        operator_username="Coord. Neha S.",
    )

    rec2 = gateway.dispatch_wave_notification(
        db=db,
        incident_id=fixture["incident_id"],
        wave_number=fixture["wave_number"],
        donor_id_str=fixture["donor_consented"],
        operator_username="Coord. Neha S.",
    )

    assert rec1.id == rec2.id
    assert rec1.dispatch_id == rec2.dispatch_id
    assert rec2.attempt_count == 1  # Not incremented on duplicate


# ─── 5. Provider Timeout & Ambiguous Outcomes ────────────────────────────────

def test_provider_timeout_ambiguous_outcome(clean_db, setup_incident_and_wave):
    """
    Test 5: When provider times out, status becomes dispatch_attempted.
    System halts automatic blind retry to prevent duplicate SMS transmissions.
    """
    db = clean_db
    fixture = setup_incident_and_wave
    timeout_provider = MockNotificationProvider(simulate_timeout=True)
    gateway = NotificationGateway(provider=timeout_provider)

    record = gateway.dispatch_wave_notification(
        db=db,
        incident_id=fixture["incident_id"],
        wave_number=fixture["wave_number"],
        donor_id_str=fixture["donor_consented"],
        operator_username="Coord. Neha S.",
    )

    assert record.status == NotificationStatus.DISPATCH_ATTEMPTED.value
    assert "ambiguous outcome" in record.last_error.lower()
    assert record.provider_message_id is None


# ─── 6. Provider Rejection and Authorised Retry ──────────────────────────────

def test_provider_rejection_and_retry(clean_db, setup_incident_and_wave):
    """
    Test 6: Provider rejection marks status as failed. Authorised operator
    can retry the dispatch, incrementing attempt_count.
    """
    db = clean_db
    fixture = setup_incident_and_wave
    rejection_provider = MockNotificationProvider(simulate_rejection=True)
    gateway = NotificationGateway(provider=rejection_provider)

    # Initial dispatch fails
    record = gateway.dispatch_wave_notification(
        db=db,
        incident_id=fixture["incident_id"],
        wave_number=fixture["wave_number"],
        donor_id_str=fixture["donor_consented"],
        operator_username="Coord. Neha S.",
    )
    assert record.status == NotificationStatus.FAILED.value
    assert record.attempt_count == 1

    # Switch to healthy provider and retry
    gateway.set_provider(MockNotificationProvider())
    retried = gateway.retry_failed_notification(
        db=db,
        dispatch_id=record.dispatch_id,
        operator_username="Coord. Neha S.",
    )
    assert retried.status == NotificationStatus.PROVIDER_ACCEPTED.value
    assert retried.attempt_count == 2


# ─── 7. Valid and Invalid Webhook Signatures ─────────────────────────────────

@pytest.mark.asyncio
async def test_webhook_signature_verification(clean_db, setup_incident_and_wave):
    """
    Test 7: Carrier delivery receipts must be rejected with HTTP 403 on invalid signature,
    and accepted with HTTP 200 on valid signature.
    """
    db = clean_db
    fixture = setup_incident_and_wave
    gateway = NotificationGateway(provider=MockNotificationProvider())

    record = gateway.dispatch_wave_notification(
        db=db,
        incident_id=fixture["incident_id"],
        wave_number=fixture["wave_number"],
        donor_id_str=fixture["donor_consented"],
        operator_username="Coord. Neha S.",
    )
    msg_id = record.provider_message_id

    from app.core.database import get_db
    app.dependency_overrides[get_db] = lambda: db

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Invalid signature -> 403 Forbidden
            res_invalid = await client.post(
                "/api/notifications/webhook/delivery",
                json={"provider_message_id": msg_id, "status": "delivered"},
                headers={"X-Webhook-Signature": "invalid-tampered-signature"},
            )
            assert res_invalid.status_code == 403

            # Valid signature -> 200 OK
            res_valid = await client.post(
                "/api/notifications/webhook/delivery",
                json={"provider_message_id": msg_id, "status": "delivered"},
                headers={"X-Mock-Signature": "valid"},
            )
            assert res_valid.status_code == 200
            assert res_valid.json()["delivery_status"] == "delivered"
    finally:
        app.dependency_overrides.pop(get_db, None)


# ─── 8. Duplicate & Out-of-Order Delivery Receipts ───────────────────────────

def test_out_of_order_and_duplicate_delivery_receipts(clean_db, setup_incident_and_wave):
    """
    Test 8: Monotonic state transitions. Once marked 'delivered', an out-of-order
    'provider_accepted' receipt will not regress the record's status.
    """
    db = clean_db
    fixture = setup_incident_and_wave
    gateway = NotificationGateway(provider=MockNotificationProvider())

    record = gateway.dispatch_wave_notification(
        db=db,
        incident_id=fixture["incident_id"],
        wave_number=fixture["wave_number"],
        donor_id_str=fixture["donor_consented"],
        operator_username="Coord. Neha S.",
    )
    msg_id = record.provider_message_id

    # 1. Delivery receipt arrives
    success, _, updated = gateway.process_delivery_webhook(
        db=db,
        payload_bytes=b"{}",
        payload_json={"provider_message_id": msg_id, "status": "delivered"},
        headers={"X-Mock-Signature": "valid"},
    )
    assert success is True
    assert updated.status == NotificationStatus.DELIVERED.value

    # 2. Duplicate or delayed 'provider_accepted' receipt arrives later
    success_delayed, msg, current = gateway.process_delivery_webhook(
        db=db,
        payload_bytes=b"{}",
        payload_json={"provider_message_id": msg_id, "status": "accepted"},
        headers={"X-Mock-Signature": "valid"},
    )
    assert success_delayed is True
    assert current.status == NotificationStatus.DELIVERED.value  # Monotonic: Did NOT regress!


# ─── 9. Incident Fulfilment or Cancellation Halts Pending Notifications ──────

def test_incident_fulfilment_halts_pending_notifications(clean_db, setup_incident_and_wave):
    """
    Test 9: When an incident is fulfilled or cancelled, all pending notifications
    are automatically cancelled.
    """
    db = clean_db
    fixture = setup_incident_and_wave
    gateway = NotificationGateway(provider=MockNotificationProvider())

    # Create a pending notification
    dispatch_id = f"NOTIF-HALT-{datetime.now().strftime('%f')}"
    incident = db.query(Incident).filter_by(incident_id=fixture["incident_id"]).first()
    donor = db.query(Donor).filter_by(donor_id=fixture["donor_consented"]).first()

    pending_rec = NotificationDelivery(
        dispatch_id=dispatch_id,
        idempotency_key=f"{fixture['incident_id']}-W1-HALT",
        incident_id=incident.id,
        wave_id=1,
        donor_id=donor.id,
        channel="sms",
        recipient_phone_masked="+91-XXXXX-1234",
        status=NotificationStatus.PENDING_DISPATCH.value,
    )
    db.add(pending_rec)
    db.commit()

    # Cancel pending notifications for incident
    cancelled_count = NotificationGateway.cancel_pending_notifications_for_incident(
        db=db,
        incident_id=fixture["incident_id"],
        reason="Incident fulfilled",
    )
    assert cancelled_count >= 1

    db.refresh(pending_rec)
    assert pending_rec.status == NotificationStatus.CANCELLED.value


# ─── 10. Donor Fatigue & Outreach Restrictions ───────────────────────────────

def test_donor_fatigue_safeguard(clean_db, setup_incident_and_wave):
    """
    Test 10: Donors exceeding recent outreach load thresholds are rejected.
    """
    db = clean_db
    fixture = setup_incident_and_wave
    gateway = NotificationGateway(provider=MockNotificationProvider())

    with pytest.raises(ValueError) as exc_info:
        gateway.dispatch_wave_notification(
            db=db,
            incident_id=fixture["incident_id"],
            wave_number=fixture["wave_number"],
            donor_id_str=fixture["donor_fatigued"],
            operator_username="Coord. Neha S.",
        )
    assert "fatigue" in str(exc_info.value).lower()


# ─── 11. Provider Outage and Recovery ────────────────────────────────────────

def test_provider_outage_and_recovery(clean_db, setup_incident_and_wave):
    """
    Test 11: Simulates temporary provider connection failure followed by recovery.
    """
    db = clean_db
    fixture = setup_incident_and_wave

    # 1. Outage
    failing_gateway = NotificationGateway(provider=MockNotificationProvider(simulate_rejection=True))
    record = failing_gateway.dispatch_wave_notification(
        db=db,
        incident_id=fixture["incident_id"],
        wave_number=fixture["wave_number"],
        donor_id_str=fixture["donor_consented"],
        operator_username="Coord. Neha S.",
    )
    assert record.status == NotificationStatus.FAILED.value

    # 2. Recovery
    healthy_gateway = NotificationGateway(provider=MockNotificationProvider())
    recovered = healthy_gateway.retry_failed_notification(
        db=db,
        dispatch_id=record.dispatch_id,
        operator_username="Coord. Neha S.",
    )
    assert recovered.status == NotificationStatus.PROVIDER_ACCEPTED.value


# ─── 12. Privacy of Logs and API Responses ───────────────────────────────────

def test_privacy_preservation_and_dlt_compliance():
    """
    Test 12: Verifies that phone numbers are masked and message template contains
    no clinical diagnosis, patient names, or hospital internal rooms.
    """
    masked = mask_phone_number("+919822012345")
    assert masked == "+91-XXXXX-2345"

    msg = build_emergency_sms_content("O-", "Deccan, Pune", "INC-PN-9999", 2)
    assert "O-" in msg
    assert "Deccan, Pune" in msg
    assert "INC-PN-9999" in msg
    # Verify absence of private clinical data
    assert "cancer" not in msg.lower()
    assert "hiv" not in msg.lower()
    assert "diagnosis" not in msg.lower()
    assert "patient" not in msg.lower()

    # Synthetic number check
    assert is_synthetic_recipient("0000000000") is True
    assert is_synthetic_recipient("+919822012345") is False
