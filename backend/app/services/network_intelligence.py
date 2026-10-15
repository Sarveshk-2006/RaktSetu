"""
RAKTSETU - Network Intelligence Domain Service
Calculates authoritative network metrics, blood group resilience, regional capacity gaps,
and partner organization performance directly from canonical persistence.
Excludes unavailable or unverified donors from usable capacity.
Never exposes private donor identities, phone numbers, or exact coordinates in aggregate metrics.
"""

from typing import List, Dict, Any, Optional
import statistics
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.db_models import (
    Donor,
    Organisation,
    Incident,
    ContactAttempt,
    FulfilmentRecord,
    BloodRequirement,
)
from app.models.models import (
    NetworkMetrics,
    BloodGroupResilience,
    NetworkGap,
    BloodGroup,
    SeverityLevel,
)
from app.services.matching import VALID_BLOOD_GROUPS

# Target baseline donor readiness per blood group to consider a metropolitan area resilient
# Common groups (O+, A+, B+) have higher routine hospital demand; rare groups have lower volume but high fragility
TARGET_USABLE_BENCHMARKS = {
    "O+": 20,
    "A+": 20,
    "B+": 20,
    "O-": 10,
    "A-": 10,
    "B-": 10,
    "AB+": 10,
    "AB-": 10,
}

ALL_STANDARD_BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]

ACTIVE_INCIDENT_STATUSES = [
    "PendingVerification",
    "Verified",
    "Matching",
    "Mobilising",
    "Partially Fulfilled",
    "Escalated",
]


# ─── 1. CORE NETWORK METRICS ─────────────────────────────────────────────────

def calculate_network_metrics(db: Session) -> NetworkMetrics:
    """
    Computes system-wide network intelligence metrics from persisted records.
    - Usable capacity strictly requires active state, confirmed consent, and Ready status.
    - Unavailable and unknown donors are tracked separately and not counted as usable.
    """
    all_donors = db.query(Donor).all()

    ready_donors = 0
    maybe_available = 0
    temporarily_unavailable = 0
    status_unknown = 0
    response_times: List[float] = []

    for d in all_donors:
        if not d.is_active or not d.consent_given or not d.contact_permission:
            temporarily_unavailable += 1
            continue

        readiness_lower = (d.readiness or "").strip().lower()
        if readiness_lower == "ready":
            ready_donors += 1
            if d.avg_response_time_minutes:
                response_times.append(d.avg_response_time_minutes)
        elif readiness_lower in ["maybe", "available_within_1hr", "standby"]:
            maybe_available += 1
        elif readiness_lower in ["unavailable", "temporarily_unavailable", "paused"]:
            temporarily_unavailable += 1
        else:
            status_unknown += 1

    # Median response time
    if response_times:
        try:
            median_response_minutes = round(statistics.median(response_times), 1)
        except Exception:
            median_response_minutes = 12.0
    else:
        median_response_minutes = 12.0

    # Active incidents
    active_incidents_count = (
        db.query(Incident)
        .filter(Incident.status.in_(ACTIVE_INCIDENT_STATUSES))
        .count()
    )

    # Blood group resilience
    resilience_list = calculate_blood_group_resilience(db)

    # Overall network coverage percentage: average of all 8 blood groups
    if resilience_list:
        network_coverage_percent = round(
            sum(r.coverage_percent for r in resilience_list) / len(resilience_list),
            1,
        )
    else:
        network_coverage_percent = 0.0

    # Regional gaps
    gaps_list = calculate_network_gaps(db)

    return NetworkMetrics(
        ready_donors=ready_donors,
        maybe_available=maybe_available,
        temporarily_unavailable=temporarily_unavailable,
        status_unknown=status_unknown,
        network_coverage_percent=network_coverage_percent,
        median_response_minutes=median_response_minutes,
        active_incidents=active_incidents_count,
        blood_group_resilience=resilience_list,
        gaps=gaps_list,
    )


# ─── 2. BLOOD GROUP RESILIENCE ───────────────────────────────────────────────

def calculate_blood_group_resilience(db: Session) -> List[BloodGroupResilience]:
    """
    Evaluates operational capacity and supply resilience for each of the 8 blood groups.
    Computes absolute ready count, coverage against benchmark target, and operational risk category.
    """
    # Query ready donors grouped by blood group
    ready_counts_by_bg: Dict[str, int] = {bg: 0 for bg in ALL_STANDARD_BLOOD_GROUPS}

    donors = (
        db.query(Donor.blood_group)
        .filter(
            Donor.is_active == True,
            Donor.consent_given == True,
            Donor.contact_permission == True,
            func.lower(Donor.readiness) == "ready",
        )
        .all()
    )

    for (bg,) in donors:
        bg_clean = (bg or "").strip().upper()
        if bg_clean in ready_counts_by_bg:
            ready_counts_by_bg[bg_clean] += 1

    resilience_results: List[BloodGroupResilience] = []

    for bg in ALL_STANDARD_BLOOD_GROUPS:
        ready_cnt = ready_counts_by_bg[bg]
        target = TARGET_USABLE_BENCHMARKS.get(bg, 15)
        cov_pct = min(100.0, round((ready_cnt / target) * 100.0, 1)) if target > 0 else 0.0

        if cov_pct < 40.0:
            status_level = "Critical"
        elif cov_pct < 70.0:
            status_level = "High Risk"
        elif cov_pct < 90.0:
            status_level = "Stable"
        else:
            status_level = "Strong"

        resilience_results.append(
            BloodGroupResilience(
                blood_group=bg,
                status=status_level,
                ready_count=ready_cnt,
                coverage_percent=cov_pct,
            )
        )

    return resilience_results


# ─── 3. REGIONAL COVERAGE & CAPACITY GAPS ────────────────────────────────────

def calculate_network_gaps(db: Session) -> List[NetworkGap]:
    """
    Identifies geographic zones with fragile donor coverage or insufficient capacity.
    Preserves donor privacy by returning strictly aggregated counts per zone.
    """
    all_donors = db.query(Donor).all()

    # Aggregate by zone
    zone_stats: Dict[str, Dict[str, Any]] = {}
    for d in all_donors:
        z = d.zone or "Unknown"
        if z not in zone_stats:
            zone_stats[z] = {
                "active_donors": 0,
                "ready_now": 0,
                "re_engageable": 0,
                "response_times": [],
                "bg_ready_counts": {bg: 0 for bg in ALL_STANDARD_BLOOD_GROUPS},
            }

        stats = zone_stats[z]
        if d.is_active:
            stats["active_donors"] += 1

        r_lower = (d.readiness or "").strip().lower()
        if d.is_active and d.consent_given and d.contact_permission and r_lower == "ready":
            stats["ready_now"] += 1
            if d.avg_response_time_minutes:
                stats["response_times"].append(d.avg_response_time_minutes)
            bg_clean = (d.blood_group or "").strip().upper()
            if bg_clean in stats["bg_ready_counts"]:
                stats["bg_ready_counts"][bg_clean] += 1
        elif r_lower in ["maybe", "unavailable", "standby"] and d.recent_load <= 2:
            stats["re_engageable"] += 1

    gaps: List[NetworkGap] = []
    for zone, stats in zone_stats.items():
        median_time = (
            round(statistics.median(stats["response_times"]), 1)
            if stats["response_times"]
            else 10.0
        )
        ready_cnt = stats["ready_now"]

        # Determine most fragile blood group in zone
        most_fragile_bg = "O-"
        lowest_count = 999999
        for bg in ["O-", "B-", "A-", "AB-", "O+", "A+", "B+", "AB+"]:
            cnt = stats["bg_ready_counts"].get(bg, 0)
            if cnt < lowest_count:
                lowest_count = cnt
                most_fragile_bg = bg

        if ready_cnt < 20:
            severity = "Critical"
        elif ready_cnt < 60:
            severity = "High Risk"
        elif ready_cnt < 120:
            severity = "Stable"
        else:
            severity = "Strong"

        gaps.append(
            NetworkGap(
                blood_group=most_fragile_bg,
                zone=zone,
                severity=severity,
                active_donors=stats["active_donors"],
                ready_now=stats["ready_now"],
                median_response_minutes=median_time,
                re_engageable=stats["re_engageable"],
            )
        )

    # Sort so most critical gaps appear first
    severity_order = {"Critical": 0, "High Risk": 1, "Stable": 2, "Strong": 3}
    gaps.sort(key=lambda g: (severity_order.get(g.severity, 4), g.ready_now))
    return gaps


# ─── 4. PARTNER ORGANISATION ANALYTICS ───────────────────────────────────────

def calculate_partner_analytics(db: Session) -> List[Dict[str, Any]]:
    """
    Computes organization-level operational metrics based on actual donor linkages,
    coverage areas, and incident outreach participation.
    """
    organisations = db.query(Organisation).all()
    results = []

    for org in organisations:
        linked_donors = db.query(Donor).filter(Donor.organisation_id == org.id).all()
        total_donors = len(linked_donors)
        ready_donors = sum(
            1 for d in linked_donors
            if d.is_active and d.consent_given and d.contact_permission and (d.readiness or "").lower() == "ready"
        )

        # Count active contact attempts for this partner's donors
        donor_ids = [d.id for d in linked_donors]
        participation_count = 0
        if donor_ids:
            participation_count = (
                db.query(ContactAttempt)
                .filter(ContactAttempt.donor_id.in_(donor_ids))
                .count()
            )

        # Data completeness: percent with non-null coordinates, blood group, and readiness
        complete_count = sum(
            1 for d in linked_donors
            if d.lat is not None and d.lng is not None and d.blood_group and d.readiness
        )
        data_completeness = round((complete_count / total_donors * 100.0), 1) if total_donors > 0 else 100.0

        results.append({
            "org_id": org.org_id,
            "name": org.name,
            "type": org.type,
            "status": org.status,
            "active_donors": total_donors if total_donors > 0 else org.active_donors_count,
            "ready_donors": ready_donors,
            "zones": org.coverage_zones or [],
            "contact_available": org.contact_available,
            "lat": org.lat,
            "lng": org.lng,
            "participation_count": participation_count,
            "data_completeness_percent": data_completeness,
        })

    return results


def calculate_partner_detail(db: Session, org_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves operational details for a specific partner organisation."""
    org = db.query(Organisation).filter_by(org_id=org_id).first()
    if not org:
        return None

    linked_donors = db.query(Donor).filter(Donor.organisation_id == org.id).all()
    bg_breakdown: Dict[str, int] = {bg: 0 for bg in ALL_STANDARD_BLOOD_GROUPS}
    ready_count = 0
    for d in linked_donors:
        bg = (d.blood_group or "").strip().upper()
        if bg in bg_breakdown:
            bg_breakdown[bg] += 1
        if d.is_active and (d.readiness or "").lower() == "ready":
            ready_count += 1

    return {
        "org_id": org.org_id,
        "name": org.name,
        "type": org.type,
        "status": org.status,
        "active_donors": len(linked_donors) if linked_donors else org.active_donors_count,
        "ready_donors": ready_count,
        "zones": org.coverage_zones or [],
        "contact_available": org.contact_available,
        "lat": org.lat,
        "lng": org.lng,
        "blood_group_distribution": bg_breakdown,
    }
