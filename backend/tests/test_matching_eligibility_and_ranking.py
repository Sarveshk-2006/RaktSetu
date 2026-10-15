"""
RAKTSETU - Unit Tests for Hard Eligibility Gating, Ranking Weights, and Explainability
Tests:
- Incompatible candidates gated before scoring
- Unavailable / Blocked candidates gated
- Consent-lacking candidates gated
- Already-contacted donors excluded from matching
- Multi-factor ranking: readiness, proximity, load penalty, response rate
- Neutral defaults & warnings for missing data
- Strict deterministic ordering and stable tie-breaking
"""

import pytest
from types import SimpleNamespace
from app.services.matching import (
    match_candidates_in_memory,
    MatchingConfig,
)


def _make_donor(
    donor_id: str,
    blood_group: str = "O-",
    readiness: str = "Ready",
    lat: float = 18.5593,
    lng: float = 73.9826,
    response_rate: float = 0.90,
    contact_reliability: float = 0.95,
    recent_load: int = 0,
    consent_given: bool = True,
    contact_permission: bool = True,
):
    """Helper creating a donor-like object for in-memory domain tests."""
    return SimpleNamespace(
        donor_id=donor_id,
        blood_group=blood_group,
        readiness=readiness,
        lat=lat,
        lng=lng,
        response_rate=response_rate,
        contact_reliability=contact_reliability,
        recent_load=recent_load,
        consent_given=consent_given,
        contact_permission=contact_permission,
    )


def test_incompatible_blood_group_gated_before_scoring():
    """Incompatible blood group donors must be excluded and never receive a rank."""
    donors = [
        _make_donor("D-COMPAT", blood_group="O-"),
        _make_donor("D-INCOMPAT", blood_group="B+"),
    ]

    res = match_candidates_in_memory(
        donors=donors,
        requested_blood_group="O-",
        component="Packed RBC",
        target_lat=18.5593,
        target_lng=73.9826,
    )

    assert res.total_evaluated == 2
    assert res.total_eligible == 1
    assert res.total_excluded == 1
    assert len(res.candidates) == 1
    assert res.candidates[0].donor_id == "D-COMPAT"
    assert res.exclusions[0].donor_id == "D-INCOMPAT"
    assert res.exclusions[0].reason_code == "INCOMPATIBLE_BLOOD_GROUP"


def test_unavailable_and_consent_gates():
    """Donors marked Unavailable or lacking consent must be excluded."""
    donors = [
        _make_donor("D-READY", readiness="Ready"),
        _make_donor("D-UNAVAIL", readiness="Unavailable"),
        _make_donor("D-NO-CONSENT", consent_given=False),
    ]

    res = match_candidates_in_memory(
        donors=donors,
        requested_blood_group="O-",
        component="Packed RBC",
    )

    assert res.total_eligible == 1
    assert res.candidates[0].donor_id == "D-READY"
    excluded_ids = {e.donor_id for e in res.exclusions}
    assert "D-UNAVAIL" in excluded_ids
    assert "D-NO-CONSENT" in excluded_ids


def test_already_contacted_donor_exclusion():
    """Donors already contacted for this incident must be excluded."""
    donors = [
        _make_donor("D1042"),
        _make_donor("D3819"),
    ]

    res = match_candidates_in_memory(
        donors=donors,
        requested_blood_group="O-",
        component="Packed RBC",
        already_contacted_donor_ids={"D1042"},
    )

    assert len(res.candidates) == 1
    assert res.candidates[0].donor_id == "D3819"
    assert res.exclusions[0].donor_id == "D1042"
    assert res.exclusions[0].reason_code == "ALREADY_CONTACTED"


def test_readiness_weight_ranking():
    """Ready Now donor must rank above a Maybe donor at the exact same location and stats."""
    donors = [
        _make_donor("D-MAYBE", readiness="Maybe", lat=18.55, lng=73.98),
        _make_donor("D-READY", readiness="Ready", lat=18.55, lng=73.98),
    ]

    res = match_candidates_in_memory(
        donors=donors,
        requested_blood_group="O-",
        component="Packed RBC",
        target_lat=18.55,
        target_lng=73.98,
    )

    assert res.candidates[0].donor_id == "D-READY"
    assert res.candidates[1].donor_id == "D-MAYBE"
    assert res.candidates[0].score > res.candidates[1].score


def test_distance_proximity_ranking():
    """Closer donor must rank above a farther donor when other stats are identical."""
    target_lat, target_lng = 18.5593, 73.9826  # Wagholi facility
    donors = [
        _make_donor("D-FAR", lat=18.5074, lng=73.8077),   # Kothrud (~19 km away)
        _make_donor("D-NEAR", lat=18.5580, lng=73.9810),  # Wagholi (~0.2 km away)
    ]

    res = match_candidates_in_memory(
        donors=donors,
        requested_blood_group="O-",
        component="Packed RBC",
        target_lat=target_lat,
        target_lng=target_lng,
    )

    assert res.candidates[0].donor_id == "D-NEAR"
    assert res.candidates[1].donor_id == "D-FAR"
    assert res.candidates[0].score > res.candidates[1].score


def test_recent_load_penalty():
    """Fresh donor (0 recent outreach) must outrank an over-contacted donor (3 outreaches)."""
    donors = [
        _make_donor("D-OVERLOAD", recent_load=3),
        _make_donor("D-FRESH", recent_load=0),
    ]

    res = match_candidates_in_memory(
        donors=donors,
        requested_blood_group="O-",
        component="Packed RBC",
        target_lat=18.5593,
        target_lng=73.9826,
    )

    assert res.candidates[0].donor_id == "D-FRESH"
    assert res.candidates[1].donor_id == "D-OVERLOAD"
    assert res.candidates[0].score > res.candidates[1].score
    assert res.candidates[0].factors.load_relief_score > res.candidates[1].factors.load_relief_score


def test_missing_data_neutral_defaults_and_warnings():
    """Missing response_rate and missing coordinates must yield warnings and neutral scores."""
    donor = _make_donor("D-UNTESTED", response_rate=None, lat=None, lng=None)
    res = match_candidates_in_memory(
        donors=[donor],
        requested_blood_group="O-",
        component="Packed RBC",
        target_lat=18.5593,
        target_lng=73.9826,
    )

    cand = res.candidates[0]
    assert cand.factors.response_rate_score == 0.5  # Neutral default
    assert cand.distance_km is None
    assert cand.distance_source == "zone_estimated"
    assert any("response history" in w.lower() for w in cand.warnings)
    assert any("coordinates missing" in w.lower() for w in cand.warnings)


def test_explainable_reasons_generation():
    """Candidates must include human-readable recommendation reasons."""
    donor = _make_donor(
        "D-STRONG",
        readiness="Ready",
        lat=18.5593,
        lng=73.9826,
        response_rate=0.92,
        contact_reliability=0.98,
        recent_load=0,
    )
    res = match_candidates_in_memory(
        donors=[donor],
        requested_blood_group="O-",
        component="Packed RBC",
        target_lat=18.5593,
        target_lng=73.9826,
    )

    reasons = res.candidates[0].reasons
    assert len(reasons) >= 3
    assert any("ready" in r.lower() for r in reasons)
    assert any("fresh" in r.lower() or "0 contact" in r.lower() for r in reasons)


def test_deterministic_ranking_and_tie_breaking():
    """Repeated matching runs on identical data must return identical candidate ranks."""
    # Create 3 identical donors except for donor_id
    donors = [
        _make_donor("D-ZULU"),
        _make_donor("D-ALPHA"),
        _make_donor("D-BRAVO"),
    ]

    res1 = match_candidates_in_memory(donors=donors, requested_blood_group="O-")
    res2 = match_candidates_in_memory(donors=donors, requested_blood_group="O-")

    ranks1 = [c.donor_id for c in res1.candidates]
    ranks2 = [c.donor_id for c in res2.candidates]

    assert ranks1 == ranks2
    # Tie-breaking by donor_id ascending when scores & distances are equal
    assert ranks1 == ["D-ALPHA", "D-BRAVO", "D-ZULU"]
