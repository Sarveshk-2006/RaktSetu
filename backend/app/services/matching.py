"""
RAKTSETU - Deterministic Donor Candidate Matching Engine
Production-grade domain service for:
1. Component-specific blood compatibility validation
2. Hard eligibility & exclusion gating (prior to any ranking)
3. Geodetic Haversine distance calculation
4. Explainable, normalized multi-factor scoring
5. Deterministic tie-breaking and structured recommendation reasons
6. Incident-scoped duplicate outreach protection
"""

import math
from typing import List, Dict, Optional, Tuple, Set, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.db_models import (
    Donor,
    Incident,
    BloodRequirement,
    ResponseWave,
    ContactAttempt,
)


# ─── 1. COMPATIBILITY RULESETS & MATRIX ───────────────────────────────────────

RULESET_VERSION = "RAKTSETU-COMPAT-2026.1"

# Red Blood Cells (Packed RBC) and Whole Blood compatibility matrix:
# Maps recipient blood group -> set of compatible donor blood groups
RBC_COMPATIBILITY_MATRIX: Dict[str, Set[str]] = {
    "O-": {"O-"},
    "O+": {"O-", "O+"},
    "A-": {"O-", "A-"},
    "A+": {"O-", "O+", "A-", "A+"},
    "B-": {"O-", "B-"},
    "B+": {"O-", "O+", "B-", "B+"},
    "AB-": {"O-", "A-", "B-", "AB-"},
    "AB+": {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},
}

# Plasma (Fresh Frozen Plasma - FFP) compatibility matrix:
# Notice: Inverted ABO relationship relative to RBCs
PLASMA_COMPATIBILITY_MATRIX: Dict[str, Set[str]] = {
    "O-": {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},
    "O+": {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},
    "A-": {"A-", "A+", "AB-", "AB+"},
    "A+": {"A-", "A+", "AB-", "AB+"},
    "B-": {"B-", "B+", "AB-", "AB+"},
    "B+": {"B-", "B+", "AB-", "AB+"},
    "AB-": {"AB-", "AB+"},
    "AB+": {"AB-", "AB+"},
}

# Platelets compatibility matrix (ABO-identical preferred, acceptable compatible):
PLATELETS_COMPATIBILITY_MATRIX: Dict[str, Set[str]] = {
    "O-": {"O-", "O+"},
    "O+": {"O+", "O-"},
    "A-": {"A-", "A+", "O-", "O+"},
    "A+": {"A+", "A-", "O+", "O-"},
    "B-": {"B-", "B+", "O-", "O+"},
    "B+": {"B+", "B-", "O+", "O-"},
    "AB-": {"AB-", "AB+", "A-", "B-", "O-"},
    "AB+": {"AB+", "AB-", "A+", "B+", "O+", "A-", "B-", "O-"},
}

VALID_BLOOD_GROUPS = set(RBC_COMPATIBILITY_MATRIX.keys())

CLINICAL_DISCLAIMER = (
    "Algorithmic compatibility matching does NOT replace laboratory immunohematological "
    "testing, ABO/Rh crossmatching, or physician clearance. All transfusions require "
    "standard clinical blood bank verification."
)


def evaluate_compatibility(
    donor_bg: str, recipient_bg: str, component: str = "Packed RBC"
) -> Tuple[bool, str, List[str]]:
    """
    Evaluates ABO/Rh blood compatibility based on the requested blood component.
    Returns: (is_compatible, ruleset_id, warnings)
    Fails safely if blood group is invalid or component is unvalidated.
    """
    donor_clean = (donor_bg or "").strip().upper()
    recipient_clean = (recipient_bg or "").strip().upper()
    comp_clean = (component or "").strip().lower()

    if donor_clean not in VALID_BLOOD_GROUPS or recipient_clean not in VALID_BLOOD_GROUPS:
        return False, RULESET_VERSION, [f"Invalid blood group provided (donor='{donor_bg}', recipient='{recipient_bg}')"]

    # Component-specific compatibility check
    if comp_clean in ["packed rbc", "packed red blood cells", "whole blood", "rbc"]:
        matrix = RBC_COMPATIBILITY_MATRIX
    elif comp_clean in ["plasma", "ffp", "fresh frozen plasma"]:
        matrix = PLASMA_COMPATIBILITY_MATRIX
    elif comp_clean in ["platelets", "platelet concentrate", "sdp", "rdp"]:
        matrix = PLATELETS_COMPATIBILITY_MATRIX
    else:
        # Fail safely for unvalidated component
        return (
            False,
            RULESET_VERSION,
            [f"Component '{component}' has not been clinically validated in matching ruleset. Manual crossmatch required."],
        )

    allowed_donors = matrix.get(recipient_clean, set())
    is_compatible = donor_clean in allowed_donors
    return is_compatible, RULESET_VERSION, []


# ─── 2. GEODETIC HAVERSINE DISTANCE ───────────────────────────────────────────

EARTH_RADIUS_KM = 6371.0088


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two coordinate pairs in kilometres.
    Validates latitude [-90.0, 90.0] and longitude [-180.0, 180.0].
    """
    for name, val in [("lat1", lat1), ("lat2", lat2)]:
        if val is None or not (-90.0 <= val <= 90.0):
            raise ValueError(f"Invalid latitude {name}={val}. Must be in [-90.0, 90.0].")
    for name, val in [("lon1", lon1), ("lon2", lon2)]:
        if val is None or not (-180.0 <= val <= 180.0):
            raise ValueError(f"Invalid longitude {name}={val}. Must be in [-180.0, 180.0].")

    # Identical coordinates check
    if lat1 == lat2 and lon1 == lon2:
        return 0.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    a = min(1.0, max(0.0, a))  # Clamp numerical floating point error
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(EARTH_RADIUS_KM * c, 2)


# ─── 3. RANKING WEIGHTS CONFIGURATION ─────────────────────────────────────────

class MatchingConfig(BaseModel):
    """
    Central configurable weights and operational thresholds for candidate scoring.
    All factor scores are normalised to [0.0, 1.0]. Total score sum of weights = 1.0.
    """
    weight_readiness: float = 0.30       # Confidence in donor's immediate availability
    weight_distance: float = 0.25        # Proximity to medical facility (transit latency)
    weight_response_rate: float = 0.20   # Historical response track record
    weight_reliability: float = 0.15     # Contact reliability & arrival track record
    weight_load_relief: float = 0.10     # Prioritising fresh donors; avoiding donor fatigue

    # Operational thresholds
    max_distance_km: float = 25.0        # Pune metropolitan response perimeter
    require_confirmed_consent: bool = True
    exclude_unavailable: bool = True
    exclude_unknown_readiness: bool = False


DEFAULT_MATCHING_CONFIG = MatchingConfig()


# ─── 4. STRUCTURED MATCH RESULTS (Pydantic Models) ───────────────────────────

class FactorBreakdown(BaseModel):
    readiness_score: float = Field(ge=0.0, le=1.0)
    distance_score: float = Field(ge=0.0, le=1.0)
    response_rate_score: float = Field(ge=0.0, le=1.0)
    reliability_score: float = Field(ge=0.0, le=1.0)
    load_relief_score: float = Field(ge=0.0, le=1.0)


class MatchCandidateResult(BaseModel):
    donor_id: str
    rank: int
    score: float = Field(ge=0.0, le=1.0)
    blood_group: str
    readiness: str
    distance_km: Optional[float]
    distance_source: str  # "coordinates_haversine" | "zone_estimated" | "unknown"
    component: str
    ruleset_id: str
    factors: FactorBreakdown
    reasons: List[str]
    warnings: List[str] = []


class MatchExclusionResult(BaseModel):
    donor_id: str
    reason_code: str  # INCOMPATIBLE_BLOOD_GROUP | UNAVAILABLE_STATUS | ALREADY_CONTACTED | LACKS_CONSENT | MISSING_MANDATORY_DATA
    detail: str


class MatchingResponse(BaseModel):
    incident_id: Optional[str]
    requirement_id: Optional[str]
    blood_group_requested: str
    component_requested: str
    facility_name: Optional[str]
    ruleset_id: str = RULESET_VERSION
    clinical_disclaimer: str = CLINICAL_DISCLAIMER
    total_evaluated: int
    total_eligible: int
    total_excluded: int
    candidates: List[MatchCandidateResult]
    exclusions: List[MatchExclusionResult] = []


from app.core.exceptions import DuplicateOutreachError


# ─── 5. SCORING & EXPLAINABILITY ENGINE ───────────────────────────────────────

def _score_readiness(readiness: str) -> Tuple[float, Optional[str]]:
    val = (readiness or "").strip().capitalize()
    if val == "Ready":
        return 1.0, "Ready Now status"
    elif val == "Maybe":
        return 0.5, "Conditional / Standby status"
    else:
        return 0.0, None


def _score_distance(distance_km: Optional[float], max_dist: float) -> Tuple[float, Optional[str]]:
    if distance_km is None:
        return 0.3, "Estimated zone proximity (coordinates unavailable)"
    if distance_km <= 2.0:
        return 1.0, f"Immediate proximity ({distance_km} km)"
    if distance_km <= max_dist:
        score = 1.0 - ((distance_km - 2.0) / (max_dist - 2.0) * 0.9)
        return max(0.1, round(score, 4)), f"Within target response radius ({distance_km} km)"
    # Beyond metropolitan perimeter
    decayed = max(0.02, 1.0 - (distance_km / 50.0))
    return round(decayed, 4), f"Extended distance ({distance_km} km)"


def _score_load_relief(recent_load: int) -> Tuple[float, Optional[str]]:
    load = max(0, recent_load or 0)
    if load == 0:
        return 1.0, "Fresh capacity: 0 contact attempts in last 90 days"
    elif load == 1:
        return 0.75, "Low recent load: 1 outreach in last 90 days"
    elif load == 2:
        return 0.50, "Moderate recent load: 2 outreaches in last 90 days"
    elif load == 3:
        return 0.25, "High load: 3 outreaches in last 90 days"
    else:
        return 0.0, f"Heavy load penalty: {load} outreaches in last 90 days"


def score_donor_candidate(
    donor: Any,
    target_lat: Optional[float],
    target_lng: Optional[float],
    requested_bg: str,
    component: str,
    config: MatchingConfig = DEFAULT_MATCHING_CONFIG,
) -> Tuple[float, FactorBreakdown, List[str], List[str], Optional[float], str]:
    """
    Computes explainable deterministic score for an eligible donor candidate.
    Returns: (total_score, factor_breakdown, reasons, warnings, distance_km, distance_source)
    """
    reasons = []
    warnings = []

    # 1. Readiness score
    r_score, r_reason = _score_readiness(donor.readiness)
    if r_reason:
        reasons.append(r_reason)

    # 2. Distance calculation
    dist_km = None
    dist_source = "unknown"
    if (
        donor.lat is not None
        and donor.lng is not None
        and target_lat is not None
        and target_lng is not None
    ):
        try:
            dist_km = haversine_distance(donor.lat, donor.lng, target_lat, target_lng)
            dist_source = "coordinates_haversine"
        except ValueError as err:
            warnings.append(f"Geodetic coordinate error: {err}")
    else:
        warnings.append("Coordinates missing; geographic distance estimated from zone centroid")
        dist_source = "zone_estimated"

    d_score, d_reason = _score_distance(dist_km, config.max_distance_km)
    if d_reason:
        reasons.append(d_reason)

    # 3. Response rate (historical indicator, not calibrated prediction)
    if donor.response_rate is not None:
        rr_score = max(0.0, min(1.0, float(donor.response_rate)))
        if rr_score >= 0.8:
            reasons.append(f"Strong response track record ({int(rr_score * 100)}%)")
    else:
        rr_score = 0.5  # Neutral default for untested donors
        warnings.append("No response history on file; assigned neutral default")

    # 4. Contact reliability
    if donor.contact_reliability is not None:
        rel_score = max(0.0, min(1.0, float(donor.contact_reliability)))
        if rel_score >= 0.85:
            reasons.append(f"High contact reliability ({int(rel_score * 100)}%)")
    else:
        rel_score = 0.5  # Neutral default
        warnings.append("No contact reliability history on file; assigned neutral default")

    # 5. Load relief / capacity protection
    load_val = getattr(donor, "recent_load", 0)
    load_score, load_reason = _score_load_relief(load_val)
    if load_reason:
        reasons.append(load_reason)

    # Weighted sum
    total_score = (
        config.weight_readiness * r_score
        + config.weight_distance * d_score
        + config.weight_response_rate * rr_score
        + config.weight_reliability * rel_score
        + config.weight_load_relief * load_score
    )
    total_score = round(max(0.0, min(1.0, total_score)), 4)

    factors = FactorBreakdown(
        readiness_score=round(r_score, 4),
        distance_score=round(d_score, 4),
        response_rate_score=round(rr_score, 4),
        reliability_score=round(rel_score, 4),
        load_relief_score=round(load_score, 4),
    )

    return total_score, factors, reasons, warnings, dist_km, dist_source


# ─── 6. DOMAIN MATCHING PIPELINE ──────────────────────────────────────────────

def match_candidates_in_memory(
    donors: List[Any],
    requested_blood_group: str,
    component: str = "Packed RBC",
    target_lat: Optional[float] = None,
    target_lng: Optional[float] = None,
    already_contacted_donor_ids: Optional[Set[str]] = None,
    config: MatchingConfig = DEFAULT_MATCHING_CONFIG,
    limit: int = 20,
    incident_id: Optional[str] = None,
    requirement_id: Optional[str] = None,
    facility_name: Optional[str] = None,
) -> MatchingResponse:
    """
    Pure domain matching function callable with any sequence of donor objects.
    Enforces hard eligibility gates before ranking.
    """
    already_contacted = already_contacted_donor_ids or set()
    total_evaluated = len(donors)
    exclusions: List[MatchExclusionResult] = []
    eligible_scored: List[Tuple[float, Optional[float], str, MatchCandidateResult]] = []

    for d in donors:
        d_id = getattr(d, "donor_id", str(getattr(d, "id", "UNKNOWN")))

        # Gate 1: Check consent & contact permissions
        if config.require_confirmed_consent:
            if not getattr(d, "consent_given", True) or not getattr(d, "contact_permission", True):
                exclusions.append(
                    MatchExclusionResult(
                        donor_id=d_id,
                        reason_code="LACKS_CONSENT",
                        detail="Donor consent or contact permission is not active.",
                    )
                )
                continue

        # Gate 2: Check duplicate outreach prevention for incident
        if d_id in already_contacted:
            exclusions.append(
                MatchExclusionResult(
                    donor_id=d_id,
                    reason_code="ALREADY_CONTACTED",
                    detail=f"Donor {d_id} has already been contacted for this incident workflow.",
                )
            )
            continue

        # Gate 3: Check readiness state
        d_readiness = getattr(d, "readiness", "Unknown")
        if config.exclude_unavailable and d_readiness in ["Unavailable", "Blocked"]:
            exclusions.append(
                MatchExclusionResult(
                    donor_id=d_id,
                    reason_code="UNAVAILABLE_STATUS",
                    detail=f"Donor readiness is currently {d_readiness}.",
                )
            )
            continue

        if config.exclude_unknown_readiness and d_readiness in ["Unknown"]:
            exclusions.append(
                MatchExclusionResult(
                    donor_id=d_id,
                    reason_code="UNKNOWN_READINESS",
                    detail="Donor readiness status is unknown and policy requires confirmed availability.",
                )
            )
            continue

        # Gate 4: Component-specific ABO/Rh blood compatibility
        d_bg = getattr(d, "blood_group", "")
        is_compat, ruleset_id, compat_warnings = evaluate_compatibility(
            donor_bg=d_bg, recipient_bg=requested_blood_group, component=component
        )
        if not is_compat:
            exclusions.append(
                MatchExclusionResult(
                    donor_id=d_id,
                    reason_code="INCOMPATIBLE_BLOOD_GROUP",
                    detail=f"Donor blood group '{d_bg}' is incompatible with recipient '{requested_blood_group}' for {component}.",
                )
            )
            continue

        # Candidate passed all gates: calculate explainable ranking score
        score, factors, reasons, warnings, dist_km, dist_source = score_donor_candidate(
            donor=d,
            target_lat=target_lat,
            target_lng=target_lng,
            requested_bg=requested_blood_group,
            component=component,
            config=config,
        )
        if compat_warnings:
            warnings.extend(compat_warnings)

        # Structure candidate (Rank will be set after sorting)
        candidate_item = MatchCandidateResult(
            donor_id=d_id,
            rank=0,
            score=score,
            blood_group=d_bg,
            readiness=d_readiness,
            distance_km=dist_km,
            distance_source=dist_source,
            component=component,
            ruleset_id=ruleset_id,
            factors=factors,
            reasons=reasons,
            warnings=warnings,
        )

        # Store with tie-breaking tuple: (score DESC, distance_km ASC, donor_id ASC)
        # Using 999.0 for None distance in sort
        sort_dist = dist_km if dist_km is not None else 999.0
        eligible_scored.append((score, sort_dist, d_id, candidate_item))

    # Deterministic Sort:
    # 1. Score descending (-score)
    # 2. Distance ascending (sort_dist)
    # 3. Donor ID ascending (d_id)
    eligible_scored.sort(key=lambda x: (-x[0], x[1], x[2]))

    # Assign 1-indexed ranks and slice by limit
    final_candidates: List[MatchCandidateResult] = []
    for rank_idx, (_, _, _, cand) in enumerate(eligible_scored[:limit], start=1):
        cand.rank = rank_idx
        final_candidates.append(cand)

    return MatchingResponse(
        incident_id=incident_id,
        requirement_id=requirement_id,
        blood_group_requested=requested_blood_group,
        component_requested=component,
        facility_name=facility_name,
        ruleset_id=RULESET_VERSION,
        total_evaluated=total_evaluated,
        total_eligible=len(eligible_scored),
        total_excluded=len(exclusions),
        candidates=final_candidates,
        exclusions=exclusions,
    )


# ─── 7. DATABASE INTEGRATION ──────────────────────────────────────────────────

def match_donors_for_incident(
    db: Session,
    incident_id: str,
    limit: int = 20,
    config: MatchingConfig = DEFAULT_MATCHING_CONFIG,
) -> MatchingResponse:
    """
    Executes matching against the canonical database for an existing Incident.
    1. Loads incident & blood requirement
    2. Identifies already-contacted donor IDs (across all waves)
    3. Queries candidate donors with SQL pre-filtering
    4. Evaluates and returns structured MatchingResponse
    """
    incident = db.query(Incident).filter_by(incident_id=incident_id).first()
    if not incident:
        raise ValueError(f"Incident with ID '{incident_id}' not found.")

    req = incident.requirement
    if not req:
        raise ValueError(f"Incident '{incident_id}' has no associated BloodRequirement.")

    # Find all donors already contacted for this incident (across any wave)
    contacted_attempts = (
        db.query(ContactAttempt.donor_id)
        .filter(ContactAttempt.incident_id == incident.id)
        .all()
    )
    # Map internal DB IDs to donor_id string
    contacted_internal_ids = {row[0] for row in contacted_attempts}
    contacted_donor_records = (
        db.query(Donor.donor_id)
        .filter(Donor.id.in_(contacted_internal_ids))
        .all()
    )
    already_contacted_donor_ids = {row[0] for row in contacted_donor_records}

    # Query candidate donors from DB: pre-filter active and permitted donors
    donors = (
        db.query(Donor)
        .filter(Donor.is_active == True)
        .filter(Donor.consent_given == True)
        .filter(Donor.contact_permission == True)
        .all()
    )

    return match_candidates_in_memory(
        donors=donors,
        requested_blood_group=req.blood_group,
        component=req.component,
        target_lat=req.lat,
        target_lng=req.lng,
        already_contacted_donor_ids=already_contacted_donor_ids,
        config=config,
        limit=limit,
        incident_id=incident.incident_id,
        requirement_id=req.requirement_id,
        facility_name=req.requesting_facility,
    )


def record_contact_attempt_safe(
    db: Session,
    incident_id: int,
    wave_id: int,
    donor_id: int,
    status: str = "Dispatched",
) -> ContactAttempt:
    """
    Dispatches a contact attempt enforcing persistence-level idempotency.
    Catches duplicate outreach constraint violation and raises DuplicateOutreachError.
    """
    attempt = ContactAttempt(
        incident_id=incident_id,
        wave_id=wave_id,
        donor_id=donor_id,
        status=status,
    )
    db.add(attempt)
    try:
        db.commit()
        db.refresh(attempt)
        return attempt
    except IntegrityError as err:
        db.rollback()
        raise DuplicateOutreachError(
            f"Duplicate outreach blocked: Donor {donor_id} has already been contacted for Incident {incident_id}."
        ) from err
