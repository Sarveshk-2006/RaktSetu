"""
RAKTSETU - Deterministic Idempotent Database Seed Script
Populates the canonical SQLite / PostgreSQL database with deterministic,
realistic synthetic Pune operational data for development and testing.

Safe to run repeatedly without creating duplicate records.
Run with:
    python -m app.db.seed
Optional flags:
    --large : Populates extended donor capacity pool (5,000 donors)
"""

import sys
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal, create_all_tables
from app.models.db_models import (
    Organisation,
    Donor,
    BloodRequirement,
    Incident,
    ResponseWave,
    ContactAttempt,
    DonorResponse,
    FulfilmentRecord,
    AuditEvent,
    User,
    UserRole,
)
from app.core.security import hash_password

# ─── Reference Geographic Zones in Pune ───────────────────────────────────────

PUNE_ZONES_SEED = [
    {"zone": "Wagholi", "district": "Pune", "lat": 18.5593, "lng": 73.9826},
    {"zone": "Kothrud", "district": "Pune", "lat": 18.5074, "lng": 73.8077},
    {"zone": "Baner", "district": "Pune", "lat": 18.5590, "lng": 73.7868},
    {"zone": "Hadapsar", "district": "Pune", "lat": 18.5018, "lng": 73.9260},
    {"zone": "Wakad", "district": "Pune", "lat": 18.5995, "lng": 73.7636},
    {"zone": "Aundh", "district": "Pune", "lat": 18.5584, "lng": 73.8074},
    {"zone": "Viman Nagar", "district": "Pune", "lat": 18.5679, "lng": 73.9143},
    {"zone": "Kondhwa", "district": "Pune", "lat": 18.4678, "lng": 73.8900},
    {"zone": "Pimpri", "district": "Pune", "lat": 18.6280, "lng": 73.7995},
    {"zone": "Shivajinagar", "district": "Pune", "lat": 18.5308, "lng": 73.8475},
]

ORGANISATIONS_SEED = [
    {
        "org_id": "ORG-001",
        "name": "UPAY Pune",
        "type": "NGO",
        "status": "Active",
        "coverage_zones": ["Baner", "Aundh", "Wakad"],
        "contact_available": True,
        "lat": 18.5590,
        "lng": 73.7868,
        "active_donors_count": 1240,
    },
    {
        "org_id": "ORG-002",
        "name": "Campus Network",
        "type": "University",
        "status": "Active",
        "coverage_zones": ["Shivajinagar", "Deccan", "Kothrud"],
        "contact_available": True,
        "lat": 18.5308,
        "lng": 73.8475,
        "active_donors_count": 684,
    },
    {
        "org_id": "ORG-003",
        "name": "Pune Community Group",
        "type": "Community",
        "status": "Active",
        "coverage_zones": ["Hadapsar", "Magarpatta", "Kondhwa"],
        "contact_available": True,
        "lat": 18.5018,
        "lng": 73.9260,
        "active_donors_count": 412,
    },
    {
        "org_id": "ORG-004",
        "name": "Blood Bank Network",
        "type": "BloodBank",
        "status": "Active",
        "coverage_zones": ["Yerawada", "Viman Nagar", "Wagholi"],
        "contact_available": True,
        "lat": 18.5679,
        "lng": 73.9143,
        "active_donors_count": 890,
    },
    {
        "org_id": "ORG-005",
        "name": "Rotary Pune East",
        "type": "Civic",
        "status": "Active",
        "coverage_zones": ["Hadapsar", "Wagholi", "Kondhwa"],
        "contact_available": True,
        "lat": 18.5018,
        "lng": 73.9260,
        "active_donors_count": 320,
    },
]

# Core demo candidates with specific operational metrics
CORE_DONORS_SEED = [
    {
        "donor_id": "D1042",
        "blood_group": "O-",
        "readiness": "Ready",
        "zone": "Wagholi",
        "district": "Pune",
        "lat": 18.5593,
        "lng": 73.9826,
        "response_rate": 0.92,
        "avg_response_time_minutes": 5.4,
        "recent_load": 0,
        "contact_reliability": 0.98,
        "org_id": "ORG-004",
    },
    {
        "donor_id": "D3819",
        "blood_group": "O-",
        "readiness": "Ready",
        "zone": "Kothrud",
        "district": "Pune",
        "lat": 18.5074,
        "lng": 73.8077,
        "response_rate": 0.86,
        "avg_response_time_minutes": 8.1,
        "recent_load": 0,
        "contact_reliability": 0.94,
        "org_id": "ORG-002",
    },
    {
        "donor_id": "D5127",
        "blood_group": "O-",
        "readiness": "Ready",
        "zone": "Baner",
        "district": "Pune",
        "lat": 18.5590,
        "lng": 73.7868,
        "response_rate": 0.81,
        "avg_response_time_minutes": 11.2,
        "recent_load": 1,
        "contact_reliability": 0.88,
        "org_id": "ORG-001",
    },
    {
        "donor_id": "D8821",
        "blood_group": "O-",
        "readiness": "Maybe",
        "zone": "Hadapsar",
        "district": "Pune",
        "lat": 18.5018,
        "lng": 73.9260,
        "response_rate": 0.78,
        "avg_response_time_minutes": 14.5,
        "recent_load": 0,
        "contact_reliability": 0.82,
        "org_id": "ORG-003",
    },
    {
        "donor_id": "D2234",
        "blood_group": "O-",
        "readiness": "Maybe",
        "zone": "Wagholi",
        "district": "Pune",
        "lat": 18.5593,
        "lng": 73.9826,
        "response_rate": 0.73,
        "avg_response_time_minutes": 16.0,
        "recent_load": 2,
        "contact_reliability": 0.75,
        "org_id": "ORG-005",
    },
]


def _hash_event(event_dict: Dict[str, Any]) -> str:
    raw = f"{event_dict.get('event_id')}:{event_dict.get('action')}:{event_dict.get('actor')}:{event_dict.get('timestamp')}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def seed_database(db: Session, donor_count: int = 100, allow_production: bool = False) -> Dict[str, int]:
    """
    Idempotent seeding function.
    Returns counts of inserted records.
    """
    if settings.ENVIRONMENT.lower() in ["production", "prod"] and not allow_production:
        raise RuntimeError(
            "CRITICAL SAFEGUARD: Seed script cannot be run in PRODUCTION environment! "
            "Predictable synthetic accounts and seed donors must not be injected into a live database. "
            "Use 'python -m app.cli.create_admin' to provision authenticated administrative personnel."
        )
    counts = {
        "organisations": 0,
        "donors": 0,
        "requirements": 0,
        "incidents": 0,
        "waves": 0,
        "contact_attempts": 0,
        "donor_responses": 0,
        "fulfilments": 0,
        "audit_events": 0,
    }

    # 1. Organisations
    org_map = {}
    for o_data in ORGANISATIONS_SEED:
        existing = db.query(Organisation).filter_by(org_id=o_data["org_id"]).first()
        if not existing:
            org = Organisation(**o_data, is_synthetic=True)
            db.add(org)
            db.flush()
            org_map[o_data["org_id"]] = org.id
            counts["organisations"] += 1
        else:
            org_map[o_data["org_id"]] = existing.id

    # 2. Donors (Core Donors first)
    for d_data in CORE_DONORS_SEED:
        existing = db.query(Donor).filter_by(donor_id=d_data["donor_id"]).first()
        if not existing:
            org_id_fk = org_map.get(d_data.get("org_id"))
            donor = Donor(
                donor_id=d_data["donor_id"],
                blood_group=d_data["blood_group"],
                readiness=d_data["readiness"],
                consent_given=True,
                contact_permission=True,
                organisation_id=org_id_fk,
                zone=d_data["zone"],
                district=d_data["district"],
                lat=d_data["lat"],
                lng=d_data["lng"],
                response_rate=d_data["response_rate"],
                avg_response_time_minutes=d_data["avg_response_time_minutes"],
                recent_load=d_data["recent_load"],
                contact_reliability=d_data["contact_reliability"],
                is_active=True,
                is_synthetic=True,
            )
            db.add(donor)
            counts["donors"] += 1

    # Additional representative donors across blood groups and zones
    all_blood_groups = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]
    readiness_states = ["Ready", "Ready", "Maybe", "Unavailable", "Unknown"]
    core_ids = {d["donor_id"] for d in CORE_DONORS_SEED}

    target_additional = max(0, donor_count - len(CORE_DONORS_SEED))
    created_additional = 0
    curr_idx = 1001

    while created_additional < target_additional:
        d_id = f"D{str(curr_idx).zfill(4)}"
        curr_idx += 1
        if d_id in core_ids:
            continue

        existing = db.query(Donor).filter_by(donor_id=d_id).first()
        if not existing:
            i = created_additional
            zone_info = PUNE_ZONES_SEED[i % len(PUNE_ZONES_SEED)]
            bg = all_blood_groups[i % len(all_blood_groups)]
            readiness = readiness_states[i % len(readiness_states)]
            org_code = list(org_map.keys())[i % len(org_map)]

            # Small offset to simulate dispersed donors across zone
            lat_offset = ((i * 17) % 20 - 10) * 0.001
            lng_offset = ((i * 23) % 20 - 10) * 0.001

            donor = Donor(
                donor_id=d_id,
                blood_group=bg,
                readiness=readiness,
                consent_given=True,
                contact_permission=True,
                organisation_id=org_map.get(org_code),
                zone=zone_info["zone"],
                district="Pune",
                lat=round(zone_info["lat"] + lat_offset, 6),
                lng=round(zone_info["lng"] + lng_offset, 6),
                response_rate=round(0.65 + ((i % 30) * 0.01), 2),
                avg_response_time_minutes=round(6.0 + (i % 25), 1),
                recent_load=i % 4,
                contact_reliability=round(0.70 + ((i % 28) * 0.01), 2),
                is_active=True,
                is_synthetic=True,
            )
            db.add(donor)
            counts["donors"] += 1

        created_additional += 1

    db.flush()

    # 3. Canonical Blood Requirements & Incidents
    # Incident 1: INC-PN-48291 (Active Emergency / Mobilising)
    req1 = db.query(BloodRequirement).filter_by(requirement_id="REQ-PN-48291").first()
    if not req1:
        req1 = BloodRequirement(
            requirement_id="REQ-PN-48291",
            blood_group="O-",
            component="Packed RBC",
            units_requested=2,
            urgency="Critical",
            requesting_facility="Sahyadri Hospital, Hadapsar",
            zone="Wagholi",
            district="Pune",
            lat=18.5593,
            lng=73.9826,
            source="Hospital",
            verification_status="Verified",
            verified_at=datetime.utcnow() - timedelta(minutes=25),
            created_at=datetime.utcnow() - timedelta(minutes=30),
            is_synthetic=True,
        )
        db.add(req1)
        db.flush()
        counts["requirements"] += 1

    inc1 = db.query(Incident).filter_by(incident_id="INC-PN-48291").first()
    if not inc1:
        inc1 = Incident(
            incident_id="INC-PN-48291",
            requirement_id=req1.id,
            status="Mobilising",
            units_requested=2,
            units_secured=1,
            response_stage="Wave 2",
            operator_id="OP-PUNE-CENTRAL",
            is_synthetic=True,
            created_at=datetime.utcnow() - timedelta(minutes=24),
        )
        db.add(inc1)
        db.flush()
        counts["incidents"] += 1

        # Wave 1 (Insufficient)
        wave1 = ResponseWave(
            incident_id=inc1.id,
            wave_number=1,
            status="Insufficient",
            donors_contacted=3,
            responses_received=2,
            confirmed_count=1,
            units_secured=1,
            launched_at=datetime.utcnow() - timedelta(minutes=20),
            completed_at=datetime.utcnow() - timedelta(minutes=10),
            escalation_reason="1 of 2 units confirmed; launching Wave 2",
        )
        db.add(wave1)
        db.flush()
        counts["waves"] += 1

        # Wave 2 (Active)
        wave2 = ResponseWave(
            incident_id=inc1.id,
            wave_number=2,
            status="Active",
            donors_contacted=2,
            responses_received=0,
            confirmed_count=0,
            units_secured=0,
            launched_at=datetime.utcnow() - timedelta(minutes=8),
        )
        db.add(wave2)
        db.flush()
        counts["waves"] += 1

        # Contact Attempts for Wave 1
        d1042 = db.query(Donor).filter_by(donor_id="D1042").first()
        d3819 = db.query(Donor).filter_by(donor_id="D3819").first()
        d5127 = db.query(Donor).filter_by(donor_id="D5127").first()

        if d1042:
            ca1 = ContactAttempt(
                incident_id=inc1.id,
                wave_id=wave1.id,
                donor_id=d1042.id,
                status="Delivered",
                attempted_at=datetime.utcnow() - timedelta(minutes=19),
            )
            db.add(ca1)
            db.flush()
            counts["contact_attempts"] += 1

            dr1 = DonorResponse(
                contact_attempt_id=ca1.id,
                donor_id=d1042.id,
                response="Accepted",
                responded_at=datetime.utcnow() - timedelta(minutes=16),
                response_time_seconds=180,
                distance_km=3.2,
                eta_minutes=18,
                notes="Donor accepted and en route to facility",
            )
            db.add(dr1)
            counts["donor_responses"] += 1

        if d3819:
            ca2 = ContactAttempt(
                incident_id=inc1.id,
                wave_id=wave1.id,
                donor_id=d3819.id,
                status="Delivered",
                attempted_at=datetime.utcnow() - timedelta(minutes=19),
            )
            db.add(ca2)
            db.flush()
            counts["contact_attempts"] += 1

            dr2 = DonorResponse(
                contact_attempt_id=ca2.id,
                donor_id=d3819.id,
                response="Declined",
                responded_at=datetime.utcnow() - timedelta(minutes=15),
                response_time_seconds=240,
                distance_km=5.7,
                notes="Donor unavailable due to travel",
            )
            db.add(dr2)
            counts["donor_responses"] += 1

        if d5127:
            ca3 = ContactAttempt(
                incident_id=inc1.id,
                wave_id=wave1.id,
                donor_id=d5127.id,
                status="Delivered",
                attempted_at=datetime.utcnow() - timedelta(minutes=19),
            )
            db.add(ca3)
            db.flush()
            counts["contact_attempts"] += 1

            dr3 = DonorResponse(
                contact_attempt_id=ca3.id,
                donor_id=d5127.id,
                response="NoResponse",
                responded_at=datetime.utcnow() - timedelta(minutes=10),
                notes="Response window expired (9m timeout)",
            )
            db.add(dr3)
            counts["donor_responses"] += 1

        # Contact Attempts for Wave 2
        d8821 = db.query(Donor).filter_by(donor_id="D8821").first()
        d2234 = db.query(Donor).filter_by(donor_id="D2234").first()

        if d8821:
            ca4 = ContactAttempt(
                incident_id=inc1.id,
                wave_id=wave2.id,
                donor_id=d8821.id,
                status="Delivered",
                attempted_at=datetime.utcnow() - timedelta(minutes=7),
            )
            db.add(ca4)
            counts["contact_attempts"] += 1

        if d2234:
            ca5 = ContactAttempt(
                incident_id=inc1.id,
                wave_id=wave2.id,
                donor_id=d2234.id,
                status="Dispatched",
                attempted_at=datetime.utcnow() - timedelta(minutes=6),
            )
            db.add(ca5)
            counts["contact_attempts"] += 1

    # Incident 2: INC-PN-48287 (B+ High Urgency, Ruby Hall Clinic)
    req2 = db.query(BloodRequirement).filter_by(requirement_id="REQ-PN-48287").first()
    if not req2:
        req2 = BloodRequirement(
            requirement_id="REQ-PN-48287",
            blood_group="B+",
            component="Whole Blood",
            units_requested=3,
            urgency="High",
            requesting_facility="Ruby Hall Clinic, Kothrud",
            zone="Kothrud",
            district="Pune",
            lat=18.5074,
            lng=73.8077,
            source="Hospital",
            verification_status="Verified",
            verified_at=datetime.utcnow() - timedelta(minutes=75),
            created_at=datetime.utcnow() - timedelta(minutes=80),
            is_synthetic=True,
        )
        db.add(req2)
        db.flush()
        counts["requirements"] += 1

    inc2 = db.query(Incident).filter_by(incident_id="INC-PN-48287").first()
    if not inc2:
        inc2 = Incident(
            incident_id="INC-PN-48287",
            requirement_id=req2.id,
            status="Mobilising",
            units_requested=3,
            units_secured=1,
            response_stage="Wave 2",
            operator_id="OP-PUNE-CENTRAL",
            is_synthetic=True,
            created_at=datetime.utcnow() - timedelta(minutes=74),
        )
        db.add(inc2)
        db.flush()
        counts["incidents"] += 1

    # Incident 3: INC-PN-48279 (A+ Moderate, Deenanath Mangeshkar Hospital)
    req3 = db.query(BloodRequirement).filter_by(requirement_id="REQ-PN-48279").first()
    if not req3:
        req3 = BloodRequirement(
            requirement_id="REQ-PN-48279",
            blood_group="A+",
            component="Packed RBC",
            units_requested=1,
            urgency="Moderate",
            requesting_facility="Deenanath Mangeshkar Hospital",
            zone="Baner",
            district="Pune",
            lat=18.5590,
            lng=73.7868,
            source="Hospital",
            verification_status="Verified",
            verified_at=datetime.utcnow() - timedelta(minutes=45),
            created_at=datetime.utcnow() - timedelta(minutes=50),
            is_synthetic=True,
        )
        db.add(req3)
        db.flush()
        counts["requirements"] += 1

    inc3 = db.query(Incident).filter_by(incident_id="INC-PN-48279").first()
    if not inc3:
        inc3 = Incident(
            incident_id="INC-PN-48279",
            requirement_id=req3.id,
            status="Matching",
            units_requested=1,
            units_secured=0,
            response_stage="Wave 1",
            operator_id="OP-PUNE-CENTRAL",
            is_synthetic=True,
            created_at=datetime.utcnow() - timedelta(minutes=44),
        )
        db.add(inc3)
        db.flush()
        counts["incidents"] += 1

    # Incident 4: INC-PN-48265 (Fulfilled with verified FulfilmentRecord)
    req4 = db.query(BloodRequirement).filter_by(requirement_id="REQ-PN-48265").first()
    if not req4:
        req4 = BloodRequirement(
            requirement_id="REQ-PN-48265",
            blood_group="AB-",
            component="Packed RBC",
            units_requested=1,
            urgency="Routine",
            requesting_facility="Noble Hospital, Hadapsar",
            zone="Hadapsar",
            district="Pune",
            lat=18.5018,
            lng=73.9260,
            source="Hospital",
            verification_status="Verified",
            verified_at=datetime.utcnow() - timedelta(hours=3),
            created_at=datetime.utcnow() - timedelta(hours=3, minutes=10),
            is_synthetic=True,
        )
        db.add(req4)
        db.flush()
        counts["requirements"] += 1

    inc4 = db.query(Incident).filter_by(incident_id="INC-PN-48265").first()
    if not inc4:
        inc4 = Incident(
            incident_id="INC-PN-48265",
            requirement_id=req4.id,
            status="Fulfilled",
            units_requested=1,
            units_secured=1,
            response_stage="Fulfilled",
            operator_id="OP-PUNE-CENTRAL",
            is_synthetic=True,
            created_at=datetime.utcnow() - timedelta(hours=3),
            fulfilled_at=datetime.utcnow() - timedelta(hours=1, minutes=30),
        )
        db.add(inc4)
        db.flush()
        counts["incidents"] += 1

        # Clinical Fulfilment Record
        fulfilment = FulfilmentRecord(
            incident_id=inc4.id,
            units_confirmed=1,
            component="Packed RBC",
            confirmation_source="Noble Hospital Blood Centre",
            confirmed_by="Dr. V. Deshmukh (Transfusion Officer)",
            confirmed_at=datetime.utcnow() - timedelta(hours=1, minutes=30),
            notes="Transfusion pre-check completed successfully.",
        )
        db.add(fulfilment)
        counts["fulfilments"] += 1

    # 4. Audit Events
    audit_events_seed = [
        {
            "event_id": "LOG-9941",
            "timestamp": datetime.utcnow() - timedelta(minutes=24),
            "incident_id": "INC-PN-48291",
            "actor": "Dr. S. Kulkarni",
            "actor_type": "Operator",
            "category": "Verification",
            "action": "INCIDENT_VERIFIED",
            "entity_type": "Incident",
            "entity_id": "INC-PN-48291",
            "outcome": "Success",
            "safe_metadata": {
                "blood_group": "O-",
                "units": 2,
                "urgency": "Critical",
                "facility": "Sahyadri Hospital, Hadapsar",
            },
        },
        {
            "event_id": "LOG-9942",
            "timestamp": datetime.utcnow() - timedelta(minutes=20),
            "incident_id": "INC-PN-48291",
            "actor": "System / Dispatch Engine",
            "actor_type": "System",
            "category": "Dispatch",
            "action": "WAVE_1_ACTIVATION",
            "entity_type": "ResponseWave",
            "entity_id": "Wave-1",
            "outcome": "Success",
            "safe_metadata": {
                "wave_number": 1,
                "donors_contacted": 3,
                "target_blood_group": "O-",
            },
        },
        {
            "event_id": "LOG-9943",
            "timestamp": datetime.utcnow() - timedelta(minutes=16),
            "incident_id": "INC-PN-48291",
            "actor": "Donor D1042",
            "actor_type": "Donor",
            "category": "Donor Response",
            "action": "DONOR_RESPONSE_ACCEPTED",
            "entity_type": "DonorResponse",
            "entity_id": "D1042",
            "outcome": "Success",
            "safe_metadata": {
                "response": "Accepted",
                "eta_minutes": 18,
                "distance_km": 3.2,
            },
        },
        {
            "event_id": "LOG-9944",
            "timestamp": datetime.utcnow() - timedelta(hours=1, minutes=30),
            "incident_id": "INC-PN-48265",
            "actor": "Dr. V. Deshmukh",
            "actor_type": "Hospital",
            "category": "Fulfilment",
            "action": "INCIDENT_FULFILLED",
            "entity_type": "FulfilmentRecord",
            "entity_id": "INC-PN-48265",
            "outcome": "Success",
            "safe_metadata": {
                "units_confirmed": 1,
                "component": "Packed RBC",
                "confirmation_source": "Noble Hospital Blood Centre",
            },
        },
    ]

    for ae in audit_events_seed:
        existing = db.query(AuditEvent).filter_by(event_id=ae["event_id"]).first()
        if not existing:
            sha = _hash_event(ae)
            audit = AuditEvent(**ae, sha256_hash=sha)
            db.add(audit)
            counts["audit_events"] += 1

    # ─── 8. Operational Users (RBAC) ──────────────────────────────────────────
    counts["users"] = 0
    users_seed = [
        {
            "username": "admin",
            "email": "admin@raktsetu.internal",
            "full_name": "System Administrator",
            "role": UserRole.ADMIN,
            "password": "Admin@RaktSetu2026",
            "organisation_id": None,
        },
        {
            "username": "dr.sharma",
            "email": "a.sharma@sahyadri.org",
            "full_name": "Dr. A. Sharma",
            "role": UserRole.HOSPITAL_OPERATOR,
            "password": "Hospital@Pune2026",
            "organisation_id": None,
        },
        {
            "username": "coord.neha",
            "email": "neha.s@raktsetu.internal",
            "full_name": "Coord. Neha S.",
            "role": UserRole.INCIDENT_OPERATOR,
            "password": "Operator@Pune2026",
            "organisation_id": None,
        },
        {
            "username": "upay.lead",
            "email": "lead@upaypune.org",
            "full_name": "UPAY Coordinator",
            "role": UserRole.ORG_COORDINATOR,
            "password": "Partner@Upay2026",
            "organisation_id": 1,
        },
        {
            "username": "auditor.pune",
            "email": "auditor@maharashtra.gov.in",
            "full_name": "Healthcare Compliance Auditor",
            "role": UserRole.AUDITOR,
            "password": "Auditor@Gov2026",
            "organisation_id": None,
        },
    ]

    for u in users_seed:
        existing = db.query(User).filter_by(username=u["username"]).first()
        if not existing:
            user = User(
                username=u["username"],
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                hashed_password=hash_password(u["password"]),
                organisation_id=u["organisation_id"],
                is_active=True,
            )
            db.add(user)
            counts["users"] += 1

    db.commit()
    return counts


if __name__ == "__main__":
    create_all_tables()
    session = SessionLocal()
    try:
        large_flag = "--large" in sys.argv
        donor_count = 5000 if large_flag else 100
        print(f"[*] Seeding RAKTSETU database (mode: {'large (5,000)' if large_flag else 'standard (100)'})...")
        res = seed_database(session, donor_count=donor_count)
        print("[+] Seeding complete! Inserted records:")
        for k, v in res.items():
            print(f"    - {k}: {v}")
    finally:
        session.close()
