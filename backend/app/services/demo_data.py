"""
RAKTSETU - Deterministic Synthetic Data Engine
Generates reproducible mock data for all prototype demonstrations.
All data is purely synthetic — no real people, no real numbers.
"""

import hashlib
import math
from datetime import datetime, timedelta
from typing import List, Dict
from app.models.models import (
    BloodGroup, DonorReadiness, Donor, Location, Incident,
    IncidentRequirement, IncidentUrgency, IncidentStatus,
    ResponseWave, WaveStatus, ResponseEvent, DonorResponse,
    Organisation, NetworkMetrics, BloodGroupResilience, NetworkGap,
    DonorCandidate
)

# ─── Pune Zone Definitions ──────────────────────────────────────────────────

PUNE_ZONES = [
    {"zone": "Wagholi", "district": "Pune", "lat": 18.5593, "lng": 73.9826},
    {"zone": "Kothrud", "district": "Pune", "lat": 18.5074, "lng": 73.8077},
    {"zone": "Baner", "district": "Pune", "lat": 18.5590, "lng": 73.7868},
    {"zone": "Hadapsar", "district": "Pune", "lat": 18.5018, "lng": 73.9260},
    {"zone": "Wakad", "district": "Pune", "lat": 18.5995, "lng": 73.7636},
    {"zone": "Aundh", "district": "Pune", "lat": 18.5584, "lng": 73.8074},
    {"zone": "Viman Nagar", "district": "Pune", "lat": 18.5679, "lng": 73.9143},
    {"zone": "Kondhwa", "district": "Pune", "lat": 18.4678, "lng": 73.8900},
    {"zone": "Pimpri", "district": "Pune", "lat": 18.6280, "lng": 73.7995},
    {"zone": "Chinchwad", "district": "Pune", "lat": 18.6125, "lng": 73.8028},
    {"zone": "Shivajinagar", "district": "Pune", "lat": 18.5308, "lng": 73.8475},
    {"zone": "Deccan", "district": "Pune", "lat": 18.5167, "lng": 73.8405},
    {"zone": "Katraj", "district": "Pune", "lat": 18.4530, "lng": 73.8638},
    {"zone": "Yerawada", "district": "Pune", "lat": 18.5532, "lng": 73.8888},
    {"zone": "Magarpatta", "district": "Pune", "lat": 18.5133, "lng": 73.9270},
]

# Blood group distribution (approximate realistic ratios)
BLOOD_GROUP_DISTRIBUTION = {
    BloodGroup.O_POS: 0.35,
    BloodGroup.A_POS: 0.28,
    BloodGroup.B_POS: 0.22,
    BloodGroup.AB_POS: 0.05,
    BloodGroup.O_NEG: 0.04,
    BloodGroup.A_NEG: 0.03,
    BloodGroup.B_NEG: 0.02,
    BloodGroup.AB_NEG: 0.01,
}

ORGANISATIONS = [
    Organisation(
        org_id="ORG-001", name="UPAY Pune", type="NGO",
        active_donors=1240, zones=["Baner", "Aundh", "Wakad"],
        contact_available=True, lat=18.5590, lng=73.7868
    ),
    Organisation(
        org_id="ORG-002", name="Campus Network", type="University",
        active_donors=684, zones=["Shivajinagar", "Deccan", "Kothrud"],
        contact_available=True, lat=18.5308, lng=73.8475
    ),
    Organisation(
        org_id="ORG-003", name="Pune Community Group", type="Community",
        active_donors=412, zones=["Hadapsar", "Magarpatta", "Kondhwa"],
        contact_available=True, lat=18.5018, lng=73.9260
    ),
    Organisation(
        org_id="ORG-004", name="Blood Bank Network", type="BloodBank",
        active_donors=890, zones=["Yerawada", "Viman Nagar", "Wagholi"],
        contact_available=True, lat=18.5679, lng=73.9143
    ),
    Organisation(
        org_id="ORG-005", name="Rotary Pune East", type="Civic",
        active_donors=320, zones=["Hadapsar", "Wagholi", "Kondhwa"],
        contact_available=True, lat=18.5018, lng=73.9260
    ),
]


def _deterministic_int(seed: str, min_val: int, max_val: int) -> int:
    """Generate a deterministic integer from a seed string."""
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    return min_val + (h % (max_val - min_val + 1))


def _deterministic_float(seed: str, min_val: float, max_val: float) -> float:
    """Generate a deterministic float from a seed string."""
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    return min_val + (h % 10000) / 10000.0 * (max_val - min_val)


def _assign_blood_group(donor_idx: int) -> BloodGroup:
    """Assign blood group deterministically based on realistic distribution."""
    val = (donor_idx * 7919) % 10000 / 10000.0
    cumulative = 0.0
    for bg, prob in BLOOD_GROUP_DISTRIBUTION.items():
        cumulative += prob
        if val < cumulative:
            return bg
    return BloodGroup.O_POS


def generate_donors(count: int = 20000) -> List[Donor]:
    """Generate deterministic synthetic donor pool."""
    donors = []
    base_date = datetime(2026, 9, 30)

    for i in range(count):
        zone_idx = (i * 31) % len(PUNE_ZONES)
        zone = PUNE_ZONES[zone_idx]

        blood_group = _assign_blood_group(i)
        response_rate = _deterministic_float(f"rr_{i}", 0.55, 0.95)
        avg_response = _deterministic_float(f"art_{i}", 4.0, 35.0)
        recent_load = _deterministic_int(f"rl_{i}", 0, 8)
        contact_rel = _deterministic_float(f"cr_{i}", 0.60, 1.0)

        # Readiness distribution: 45% Ready, 20% Maybe, 22% Unavailable, 13% Unknown
        r_val = (i * 13337) % 100
        if r_val < 45:
            availability = DonorReadiness.READY
        elif r_val < 65:
            availability = DonorReadiness.MAYBE
        elif r_val < 87:
            availability = DonorReadiness.UNAVAILABLE
        else:
            availability = DonorReadiness.UNKNOWN

        days_ago = _deterministic_int(f"la_{i}", 1, 180)
        org_idx = _deterministic_int(f"org_{i}", 0, 100)
        org_id = ORGANISATIONS[org_idx % len(ORGANISATIONS)].org_id if org_idx < 60 else None

        donors.append(Donor(
            donor_id=f"D{str(i + 1000).zfill(4)}",
            blood_group=blood_group,
            location=Location(
                zone=zone["zone"],
                district=zone["district"],
                lat=zone["lat"] + _deterministic_float(f"lat_{i}", -0.02, 0.02),
                lng=zone["lng"] + _deterministic_float(f"lng_{i}", -0.02, 0.02),
            ),
            availability=availability,
            response_rate=round(response_rate, 2),
            avg_response_time_minutes=round(avg_response, 1),
            recent_load=recent_load,
            contact_reliability=round(contact_rel, 2),
            organisation_id=org_id,
            last_activity=base_date - timedelta(days=days_ago),
            is_active=True,
        ))

    return donors


def get_demo_incident() -> Incident:
    """
    The primary demo incident — always reproducible.
    INC-PN-48291 · O− · 2 units · Critical · Wagholi
    """
    created = datetime(2026, 9, 30, 21, 30, 0)
    return Incident(
        incident_id="INC-PN-48291",
        requirement=IncidentRequirement(
            blood_group=BloodGroup.O_NEG,
            units_required=2,
            urgency=IncidentUrgency.CRITICAL,
            location=Location(
                zone="Wagholi", district="Pune",
                lat=18.5593, lng=73.9826
            ),
            requesting_facility="Sahyadri Hospital, Hadapsar",
            source="Hospital",
        ),
        status=IncidentStatus.MOBILISING,
        units_secured=1,
        created_at=created,
        updated_at=created + timedelta(minutes=8),
        elapsed_seconds=522,
        donors_contacted=5,
        duplicate_outreach_avoided=6,
        waves=[
            ResponseWave(
                wave_number=1,
                status=WaveStatus.INSUFFICIENT,
                donors_contacted=5,
                responses_received=2,
                confirmed=1,
                units_secured=1,
            ),
            ResponseWave(
                wave_number=2,
                status=WaveStatus.ACTIVE,
                donors_contacted=4,
                responses_received=0,
                confirmed=0,
                units_secured=0,
            ),
        ],
        response_events=[
            ResponseEvent(
                timestamp=datetime(2026, 9, 30, 21, 41, 12),
                donor_id="D1042",
                response=DonorResponse.ACCEPTED,
                blood_group=BloodGroup.O_NEG,
                distance_km=3.2,
            ),
            ResponseEvent(
                timestamp=datetime(2026, 9, 30, 21, 41, 17),
                donor_id="D3819",
                response=DonorResponse.DECLINED,
                blood_group=BloodGroup.O_NEG,
                distance_km=5.7,
            ),
            ResponseEvent(
                timestamp=datetime(2026, 9, 30, 21, 41, 24),
                donor_id="D5127",
                response=DonorResponse.NO_RESPONSE,
                blood_group=BloodGroup.O_NEG,
                distance_km=7.1,
            ),
        ],
    )


def get_all_incidents() -> List[Incident]:
    """Return list of synthetic incidents for the incidents page."""
    base = datetime(2026, 9, 30, 20, 0, 0)
    return [
        get_demo_incident(),
        Incident(
            incident_id="INC-PN-48287",
            requirement=IncidentRequirement(
                blood_group=BloodGroup.B_POS,
                units_required=3,
                urgency=IncidentUrgency.HIGH,
                location=Location(zone="Kothrud", district="Pune", lat=18.5074, lng=73.8077),
                requesting_facility="Ruby Hall Clinic",
                source="Hospital",
            ),
            status=IncidentStatus.MOBILISING,
            units_secured=1,
            created_at=base - timedelta(minutes=45),
            updated_at=base - timedelta(minutes=20),
            elapsed_seconds=2700,
            donors_contacted=8,
            duplicate_outreach_avoided=4,
            waves=[
                ResponseWave(wave_number=1, status=WaveStatus.INSUFFICIENT,
                             donors_contacted=5, responses_received=2, confirmed=1, units_secured=1),
                ResponseWave(wave_number=2, status=WaveStatus.ACTIVE,
                             donors_contacted=3, responses_received=0, confirmed=0, units_secured=0),
            ],
        ),
        Incident(
            incident_id="INC-PN-48279",
            requirement=IncidentRequirement(
                blood_group=BloodGroup.A_POS,
                units_required=1,
                urgency=IncidentUrgency.MODERATE,
                location=Location(zone="Baner", district="Pune", lat=18.5590, lng=73.7868),
                requesting_facility="Deenanath Mangeshkar Hospital",
                source="Hospital",
            ),
            status=IncidentStatus.MATCHING,
            units_secured=0,
            created_at=base - timedelta(minutes=20),
            updated_at=base - timedelta(minutes=12),
            elapsed_seconds=1200,
            donors_contacted=0,
            duplicate_outreach_avoided=0,
            waves=[],
        ),
        Incident(
            incident_id="INC-PN-48265",
            requirement=IncidentRequirement(
                blood_group=BloodGroup.AB_POS,
                units_required=2,
                urgency=IncidentUrgency.HIGH,
                location=Location(zone="Hadapsar", district="Pune", lat=18.5018, lng=73.9260),
                requesting_facility="Sahyadri Hospital",
                source="Hospital",
            ),
            status=IncidentStatus.FULFILLED,
            units_secured=2,
            created_at=base - timedelta(hours=3),
            updated_at=base - timedelta(hours=1),
            elapsed_seconds=7200,
            donors_contacted=7,
            duplicate_outreach_avoided=3,
            fulfilled_at=base - timedelta(hours=1),
            response_time_seconds=684,
            waves=[
                ResponseWave(wave_number=1, status=WaveStatus.COMPLETE,
                             donors_contacted=4, responses_received=3, confirmed=2, units_secured=2),
            ],
        ),
    ]


def get_donor_candidates_for_incident(incident_id: str) -> List[DonorCandidate]:
    """Return deterministic donor candidates for the demo incident."""
    return [
        DonorCandidate(
            donor_id="D1042", blood_group=BloodGroup.O_NEG,
            distance_km=3.2, response_likelihood=0.92, match_confidence=0.94,
            availability=DonorReadiness.READY,
            recent_load_level="LOW", contact_reliability_level="HIGH", wave=1
        ),
        DonorCandidate(
            donor_id="D3819", blood_group=BloodGroup.O_NEG,
            distance_km=5.7, response_likelihood=0.86, match_confidence=0.88,
            availability=DonorReadiness.READY,
            recent_load_level="LOW", contact_reliability_level="HIGH", wave=1
        ),
        DonorCandidate(
            donor_id="D5127", blood_group=BloodGroup.O_NEG,
            distance_km=7.1, response_likelihood=0.81, match_confidence=0.83,
            availability=DonorReadiness.READY,
            recent_load_level="MEDIUM", contact_reliability_level="MEDIUM", wave=1
        ),
        DonorCandidate(
            donor_id="D8821", blood_group=BloodGroup.O_NEG,
            distance_km=6.1, response_likelihood=0.78, match_confidence=0.80,
            availability=DonorReadiness.MAYBE,
            recent_load_level="LOW", contact_reliability_level="MEDIUM", wave=2
        ),
        DonorCandidate(
            donor_id="D2234", blood_group=BloodGroup.O_NEG,
            distance_km=8.9, response_likelihood=0.73, match_confidence=0.75,
            availability=DonorReadiness.MAYBE,
            recent_load_level="MEDIUM", contact_reliability_level="LOW", wave=2
        ),
    ]


def get_network_metrics() -> NetworkMetrics:
    """Return current network capacity metrics."""
    return NetworkMetrics(
        ready_donors=4218,
        maybe_available=1842,
        temporarily_unavailable=2104,
        status_unknown=1086,
        network_coverage_percent=87.0,
        median_response_minutes=8.7,
        active_incidents=4,
        blood_group_resilience=[
            BloodGroupResilience(blood_group=BloodGroup.O_POS, status="Strong", ready_count=1476, coverage_percent=94.0),
            BloodGroupResilience(blood_group=BloodGroup.A_POS, status="Strong", ready_count=1180, coverage_percent=91.0),
            BloodGroupResilience(blood_group=BloodGroup.B_POS, status="Strong", ready_count=927, coverage_percent=89.0),
            BloodGroupResilience(blood_group=BloodGroup.AB_POS, status="Stable", ready_count=211, coverage_percent=78.0),
            BloodGroupResilience(blood_group=BloodGroup.O_NEG, status="Critical", ready_count=168, coverage_percent=41.0),
            BloodGroupResilience(blood_group=BloodGroup.A_NEG, status="High Risk", ready_count=127, coverage_percent=54.0),
            BloodGroupResilience(blood_group=BloodGroup.B_NEG, status="High Risk", ready_count=84, coverage_percent=48.0),
            BloodGroupResilience(blood_group=BloodGroup.AB_NEG, status="Critical", ready_count=42, coverage_percent=29.0),
        ],
        gaps=[
            NetworkGap(
                blood_group=BloodGroup.O_NEG, zone="Wagholi", severity="Critical",
                active_donors=42, ready_now=11, median_response_minutes=17.0, re_engageable=26
            ),
            NetworkGap(
                blood_group=BloodGroup.AB_NEG, zone="Hadapsar", severity="Critical",
                active_donors=18, ready_now=4, median_response_minutes=22.0, re_engageable=9
            ),
            NetworkGap(
                blood_group=BloodGroup.A_NEG, zone="Baner", severity="High Risk",
                active_donors=31, ready_now=8, median_response_minutes=14.0, re_engageable=15
            ),
        ],
    )


# Pre-generate donor pool at module load (deterministic, cached)
_DONOR_POOL: List[Donor] = []


def get_donor_pool() -> List[Donor]:
    global _DONOR_POOL
    if not _DONOR_POOL:
        _DONOR_POOL = generate_donors(20000)
    return _DONOR_POOL
