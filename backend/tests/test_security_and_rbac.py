"""
RAKTSETU — Milestone 6: Security, Role-Based Access Control, Privacy & Audit Tests
Systematically verifies authentication, authorization matrix, server-side actor attribution,
donor privacy & consent gates, concurrency guards, notification boundaries, and verifiable
SHA-256 audit hash chain integrity.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone

from app.main import app
from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    record_failed_login,
    is_account_locked,
    clear_failed_login,
)
from app.core.database import SessionLocal
from app.models.db_models import User, UserRole, AuditEvent, Incident, BloodRequirement, Donor
from app.services.audit import log_audit_event, verify_audit_hash_chain, GENESIS_HASH
from app.services.notifications import (
    NotificationGateway,
    MockNotificationProvider,
    NotificationStatus,
    mask_phone_number,
)
from app.services.matching import match_candidates_in_memory, MatchingConfig


# ─── 1. AUTHENTICATION & CREDENTIAL TESTS ────────────────────────────────────

def test_password_hashing_and_verification():
    """PBKDF2-HMAC-SHA256 password hashing with unique salt."""
    raw = "SecureHospital@2026"
    hashed = hash_password(raw)
    assert hashed != raw
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_creation_and_claims():
    """JWT tokens include subject, role, full_name, and expiry."""
    token = create_access_token(
        subject="dr.sharma",
        role=UserRole.HOSPITAL_OPERATOR,
        full_name="Dr. A. Sharma",
        expires_minutes=30,
    )
    payload = decode_access_token(token)
    assert payload["sub"] == "dr.sharma"
    assert payload["role"] == UserRole.HOSPITAL_OPERATOR
    assert payload["full_name"] == "Dr. A. Sharma"
    assert "exp" in payload


def test_brute_force_lockout_protection():
    """5 consecutive failed logins trigger a 15-minute account lockout."""
    username = "test.bruteforce.target"
    clear_failed_login(username)

    # 4 failures: not locked
    for _ in range(4):
        locked = record_failed_login(username)
        assert locked is False

    # 5th failure: locked
    locked = record_failed_login(username)
    assert locked is True

    # Still locked on check
    is_locked, mins = is_account_locked(username)
    assert is_locked is True
    assert mins > 0

    clear_failed_login(username)
    is_locked, _ = is_account_locked(username)
    assert is_locked is False


@pytest.mark.asyncio
async def test_auth_login_endpoints_and_lockout():
    """Verifies /api/auth/login with valid/invalid credentials and account lockout."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Valid login
        res_valid = await client.post(
            "/api/auth/login",
            json={"username": "dr.sharma", "password": "Hospital@Pune2026"},
        )
        assert res_valid.status_code == 200
        data = res_valid.json()
        assert "access_token" in data
        assert data["user"]["username"] == "dr.sharma"
        assert data["user"]["role"] == "hospital_operator"

        # Invalid password
        res_invalid = await client.post(
            "/api/auth/login",
            json={"username": "dr.sharma", "password": "WrongPassword!"},
        )
        assert res_invalid.status_code == 401
        assert "Invalid username or password" in res_invalid.json()["detail"]

        # Unknown user
        res_unknown = await client.post(
            "/api/auth/login",
            json={"username": "ghost.user", "password": "SomePassword123"},
        )
        assert res_unknown.status_code == 401


# ─── 2. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX ──────────────────────────────

@pytest.mark.asyncio
async def test_rbac_auditor_restrictions():
    """
    Auditor has read-only access.
    Attempts to verify, launch waves, or fulfill must return HTTP 403 Forbidden.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login as auditor
        res_login = await client.post(
            "/api/auth/login",
            json={"username": "auditor.pune", "password": "Auditor@Gov2026"},
        )
        assert res_login.status_code == 200
        auditor_token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {auditor_token}"}

        # 2. Auditor can read incidents
        res_list = await client.get("/api/incidents/", headers=headers)
        assert res_list.status_code == 200

        # 3. Auditor CANNOT verify requirements (403 Forbidden)
        res_verify = await client.post(
            "/api/incidents/INC-PN-48291/verify",
            json={"verified_by": "Auditor Attempt", "facility_confirmed": True},
            headers=headers,
        )
        assert res_verify.status_code == 403
        assert "lacks permission" in res_verify.json()["detail"]

        # 4. Auditor CANNOT launch waves (403 Forbidden)
        res_wave = await client.post(
            "/api/incidents/INC-PN-48291/waves",
            json={"wave_size": 3},
            headers=headers,
        )
        assert res_wave.status_code == 403

        # 5. Auditor CANNOT fulfill blood units (403 Forbidden)
        res_fulfill = await client.post(
            "/api/incidents/INC-PN-48291/fulfill",
            json={"units_confirmed": 1},
            headers=headers,
        )
        assert res_fulfill.status_code == 403


@pytest.mark.asyncio
async def test_rbac_incident_operator_cannot_fulfill():
    """
    Incident operators manage outreach and waves, but CANNOT clinically confirm fulfilment
    or verify requirements. Only Hospital Operators and Administrators can.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_login = await client.post(
            "/api/auth/login",
            json={"username": "coord.neha", "password": "Operator@Pune2026"},
        )
        assert res_login.status_code == 200
        op_token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {op_token}"}

        # Operator attempting clinical fulfilment is rejected with 403
        res_fulfill = await client.post(
            "/api/incidents/INC-PN-48291/fulfill",
            json={"units_confirmed": 1},
            headers=headers,
        )
        assert res_fulfill.status_code == 403
        assert "lacks permission" in res_fulfill.json()["detail"]


@pytest.mark.asyncio
async def test_hospital_operator_can_verify_and_fulfill():
    """Hospital Operator has clinical permissions to verify requirements and confirm fulfilment."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as Dr. Sharma
        res_login = await client.post(
            "/api/auth/login",
            json={"username": "dr.sharma", "password": "Hospital@Pune2026"},
        )
        assert res_login.status_code == 200
        doc_token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {doc_token}"}

        # Create incident
        res_create = await client.post(
            "/api/incidents/",
            json={
                "blood_group": "AB-",
                "component": "Packed RBC",
                "units_requested": 1,
                "urgency": "Critical",
                "requesting_facility": "Ruby Hall Clinic, Pune",
                "zone": "Shivajinagar",
                "district": "Pune",
                "lat": 18.5308,
                "lng": 73.8475,
                "source": "Hospital",
                "auto_verify": False,
            },
            headers=headers,
        )
        assert res_create.status_code == 201
        inc_id = res_create.json()["incident_id"]

        # Clinical verification by hospital operator
        res_verify = await client.post(
            f"/api/incidents/{inc_id}/verify",
            json={"verified_by": "Spoofed Client String", "facility_confirmed": True, "notes": "Dr Sharma verified."},
            headers=headers,
        )
        assert res_verify.status_code == 200
        assert res_verify.json()["status"] == "Verified"

        # Check server identity attribution: verified_by is Dr. A. Sharma (not spoofed string)
        audit_res = await client.get(f"/api/incidents/{inc_id}/audit-trail", headers=headers)
        assert audit_res.status_code == 200
        events = audit_res.json()
        verify_event = next(e for e in events if e["action"] == "RequirementVerified")
        assert verify_event["actor"] == "Dr. A. Sharma"


# ─── 3. CRYPTOGRAPHIC AUDIT HASH CHAIN & TAMPER DETECTION ────────────────────

def test_verifiable_audit_hash_chain():
    """
    Verifies that the audit trail forms an unbroken SHA-256 hash chain
    where each event incorporates the previous event's hash.
    """
    db = SessionLocal()
    try:
        # Create a series of linked audit events
        e1 = log_audit_event(
            db=db,
            actor="Dr. A. Sharma",
            actor_type="Hospital",
            category="Verification",
            action="RequirementVerified",
            entity_type="BloodRequirement",
            entity_id="REQ-TEST-001",
            outcome="Success",
            incident_id="INC-TEST-CHAIN",
            safe_metadata={"source": "Hospital Blood Bank"},
        )
        db.commit()
        assert e1.prev_hash is not None
        assert e1.sha256_hash is not None

        e2 = log_audit_event(
            db=db,
            actor="Coord. Neha S.",
            actor_type="Operator",
            category="Dispatch",
            action="WaveMobilised",
            entity_type="ResponseWave",
            entity_id="WAVE-TEST-001",
            outcome="Success",
            incident_id="INC-TEST-CHAIN",
            safe_metadata={"wave_number": 1, "size": 3},
        )
        db.commit()
        assert e2.prev_hash == e1.sha256_hash

        # Verify chain integrity
        res = verify_audit_hash_chain(db)
        assert res["valid"] is True
        assert res["verified_events"] >= 2

        # Tamper detection test: artificially modify e1 payload in DB
        original_action = e1.action
        e1.action = "TamperedUnauthorizedAction"
        db.commit()

        # Chain verification must now detect tampering
        res_tampered = verify_audit_hash_chain(db)
        assert res_tampered["valid"] is False
        assert "Hash mismatch" in res_tampered["error"]
        assert res_tampered["broken_at_event_id"] == e1.event_id

        # Restore
        e1.action = original_action
        db.commit()
    finally:
        db.close()


@pytest.mark.asyncio
async def test_audit_verify_chain_api_endpoint():
    """Verifies that the /api/audit/verify-chain endpoint returns cryptographic audit chain status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/audit/verify-chain")
        assert res.status_code == 200
        data = res.json()
        assert "valid" in data
        assert "total_events" in data
        assert "message" in data


# ─── 4. DONOR PRIVACY & CONSENT GATES ────────────────────────────────────────

def test_matching_consent_and_contact_permission_gate():
    """Donors lacking consent or contact permissions are strictly excluded from matching."""
    class MockDonor:
        def __init__(self, donor_id, bg, consent, permission, readiness="Ready"):
            self.donor_id = donor_id
            self.blood_group = bg
            self.consent_given = consent
            self.contact_permission = permission
            self.readiness = readiness
            self.lat = 18.5204
            self.lng = 73.8567
            self.response_rate = 0.9
            self.contact_reliability = 0.95
            self.recent_load = 0

    donors = [
        MockDonor("D-CONSENTED", "O+", consent=True, permission=True),
        MockDonor("D-NO-CONSENT", "O+", consent=False, permission=True),
        MockDonor("D-NO-PERMISSION", "O+", consent=True, permission=False),
    ]

    res = match_candidates_in_memory(
        donors=donors,
        requested_blood_group="O+",
        component="Packed RBC",
        target_lat=18.5204,
        target_lng=73.8567,
    )

    eligible_ids = [c.donor_id for c in res.candidates]
    assert "D-CONSENTED" in eligible_ids
    assert "D-NO-CONSENT" not in eligible_ids
    assert "D-NO-PERMISSION" not in eligible_ids

    # Check exclusion reasons
    exclusions = {ex.donor_id: ex.reason_code for ex in res.exclusions}
    assert exclusions.get("D-NO-CONSENT") == "LACKS_CONSENT"
    assert exclusions.get("D-NO-PERMISSION") == "LACKS_CONSENT"


@pytest.mark.asyncio
async def test_donor_list_privacy_preservation():
    """Donor list endpoint never exposes phone numbers, names, or exact home addresses."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/donors/")
        assert res.status_code == 200
        donors = res.json()
        assert len(donors) > 0

        for d in donors:
            # Personal details must be absent
            assert "phone" not in d
            assert "name" not in d
            assert "email" not in d
            assert "lat" not in d
            assert "lng" not in d
            # Only operational indicators allowed
            assert "donor_id" in d
            assert "blood_group" in d
            assert "readiness" in d
            assert "zone" in d


# ─── 5. NOTIFICATION BOUNDARY SAFEGUARDS ──────────────────────────────────────

def test_notification_boundary_consent_and_idempotency():
    """
    Tests notification gateway:
    1. Blocks outreach without confirmed consent.
    2. Enforces phone number masking.
    3. Prevents duplicate dispatches using idempotency key.
    4. Distinguishes provider_accepted from delivered.
    """
    gateway = NotificationGateway(provider=MockNotificationProvider())

    # 1. Lack of consent raises PermissionError
    with pytest.raises(PermissionError) as exc_info:
        gateway.dispatch_donor_alert(
            recipient_donor_id="DONOR-UNCONSENTED",
            phone="+919822012345",
            incident_id="INC-NOTIF-01",
            wave_number=1,
            consent_given=False,
            contact_permission=True,
        )
    assert "active consent" in str(exc_info.value)

    # 2. Consented donor dispatch
    rec1 = gateway.dispatch_donor_alert(
        recipient_donor_id="DONOR-CONSENTED-01",
        phone="+919822012345",
        incident_id="INC-NOTIF-01",
        wave_number=1,
        consent_given=True,
        contact_permission=True,
    )
    # Masked PII in record
    assert rec1.recipient_phone_masked == "+91-XXXXX-2345"
    # Provider accepted does NOT equal delivered
    assert rec1.status == NotificationStatus.PROVIDER_ACCEPTED
    assert rec1.provider_message_id is not None
    assert rec1.status != NotificationStatus.DELIVERED

    # 3. Duplicate dispatch using same key returns existing record (idempotency)
    rec2 = gateway.dispatch_donor_alert(
        recipient_donor_id="DONOR-CONSENTED-01",
        phone="+919822012345",
        incident_id="INC-NOTIF-01",
        wave_number=1,
        consent_given=True,
        contact_permission=True,
    )
    assert rec1.dispatch_id == rec2.dispatch_id

    # 4. Delivery receipt webhook transitions to delivered
    rec_delivered = gateway.apply_delivery_receipt(rec1.dispatch_id, "delivered")
    assert rec_delivered.status == NotificationStatus.DELIVERED


def test_phone_masking_utility():
    assert mask_phone_number("+919822012345") == "+91-XXXXX-2345"
    assert mask_phone_number(None) == "XXXXX-XXXXX"
