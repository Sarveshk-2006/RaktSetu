"""
RAKTSETU - Unit & Service Tests for Network Intelligence Engine
Tests usable-capacity definitions, blood group resilience, regional gaps,
partner operational analytics, missing data handling, and privacy preservation.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.db_models import Donor, Organisation, Incident, BloodRequirement
from app.services.network_intelligence import (
    calculate_network_metrics,
    calculate_blood_group_resilience,
    calculate_network_gaps,
    calculate_partner_analytics,
    calculate_partner_detail,
    TARGET_USABLE_BENCHMARKS,
)


@pytest.fixture
def analytics_db():
    """Provides an isolated database populated with known synthetic donor records."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # 1. Add 2 Organisations
    org1 = Organisation(
        org_id="ORG-TEST-1",
        name="Pune Youth NGO",
        type="NGO",
        status="Active",
        coverage_zones=["Wagholi", "Hadapsar"],
        contact_available=True,
        lat=18.5593,
        lng=73.9826,
        active_donors_count=10,
    )
    org2 = Organisation(
        org_id="ORG-TEST-2",
        name="Deccan Health Volunteers",
        type="Community",
        status="Active",
        coverage_zones=["Deccan", "Kothrud"],
        contact_available=True,
        lat=18.5167,
        lng=73.8405,
        active_donors_count=5,
    )
    session.add_all([org1, org2])
    session.commit()

    # 2. Add Donors with explicit readiness states
    # - 5 Ready O- donors (all active, consent=True)
    # - 2 Unavailable O- donors
    # - 1 Unknown readiness O- donor
    # - 1 Inactive O- donor
    # - 1 Donor without consent
    for i in range(5):
        session.add(Donor(
            donor_id=f"D-O-NEG-READY-{i+1}",
            blood_group="O-",
            readiness="Ready",
            consent_given=True,
            contact_permission=True,
            organisation_id=org1.id,
            zone="Wagholi",
            district="Pune",
            lat=18.5593 + (i * 0.001),
            lng=73.9826,
            response_rate=0.90,
            avg_response_time_minutes=8.0,
            recent_load=0,
            contact_reliability=0.95,
            is_active=True,
        ))

    # 2 Unavailable donors
    for i in range(2):
        session.add(Donor(
            donor_id=f"D-O-NEG-UNAVAIL-{i+1}",
            blood_group="O-",
            readiness="Unavailable",
            consent_given=True,
            contact_permission=True,
            organisation_id=org1.id,
            zone="Wagholi",
            district="Pune",
            lat=18.5593,
            lng=73.9826,
            is_active=True,
        ))

    # 1 Unknown readiness
    session.add(Donor(
        donor_id="D-O-NEG-UNKNOWN-1",
        blood_group="O-",
        readiness="Unknown",
        consent_given=True,
        contact_permission=True,
        organisation_id=org1.id,
        zone="Wagholi",
        district="Pune",
        lat=18.5593,
        lng=73.9826,
        is_active=True,
    ))

    # 1 Inactive donor
    session.add(Donor(
        donor_id="D-O-NEG-INACTIVE-1",
        blood_group="O-",
        readiness="Ready",
        consent_given=True,
        contact_permission=True,
        zone="Wagholi",
        district="Pune",
        lat=18.5593,
        lng=73.9826,
        is_active=False,
    ))

    # 1 Lacks consent
    session.add(Donor(
        donor_id="D-O-NEG-NOCONSENT-1",
        blood_group="O-",
        readiness="Ready",
        consent_given=False,
        contact_permission=True,
        zone="Wagholi",
        district="Pune",
        lat=18.5593,
        lng=73.9826,
        is_active=True,
    ))

    # Add 12 Ready A+ donors in Deccan linked to org2
    for i in range(12):
        session.add(Donor(
            donor_id=f"D-A-POS-READY-{i+1}",
            blood_group="A+",
            readiness="Ready",
            consent_given=True,
            contact_permission=True,
            organisation_id=org2.id,
            zone="Deccan",
            district="Pune",
            lat=18.5167,
            lng=73.8405,
            response_rate=0.80,
            avg_response_time_minutes=14.0,
            recent_load=1,
            contact_reliability=0.90,
            is_active=True,
        ))

    session.commit()

    try:
        yield session
    finally:
        session.close()


def test_usable_capacity_operational_definition(analytics_db):
    """
    CRITICAL TEST:
    Verifies that ONLY active donors with confirmed consent, permission, and 'Ready' status
    are counted as usable capacity. Unavailable, inactive, unconsented, and unknown donors are excluded.
    """
    metrics = calculate_network_metrics(analytics_db)

    # In analytics_db fixture:
    # 5 Ready O- donors + 12 Ready A+ donors = 17 ready donors
    assert metrics.ready_donors == 17

    # Unavailable donors: 2 Unavailable + 1 Inactive + 1 NoConsent = 4
    assert metrics.temporarily_unavailable == 4

    # Unknown readiness: 1
    assert metrics.status_unknown == 1

    # Median response time should be between 8.0 and 14.0
    assert 8.0 <= metrics.median_response_minutes <= 14.0


def test_blood_group_resilience_scoring(analytics_db):
    """
    Verifies capacity calculation and risk status for all 8 standard blood groups.
    - O- has 5 ready donors against target 10 -> 50% coverage (High Risk).
    - A+ has 12 ready donors against target 20 -> 60% coverage (High Risk).
    - Unpopulated groups (e.g. B-, AB-) have 0 donors -> 0% coverage (Critical).
    """
    resilience = calculate_blood_group_resilience(analytics_db)
    assert len(resilience) == 8

    res_map = {r.blood_group: r for r in resilience}

    # Verify O- resilience
    o_neg = res_map["O-"]
    assert o_neg.ready_count == 5
    assert o_neg.coverage_percent == 50.0
    assert o_neg.status == "High Risk"

    # Verify A+ resilience
    a_pos = res_map["A+"]
    assert a_pos.ready_count == 12
    assert a_pos.coverage_percent == 60.0
    assert a_pos.status == "High Risk"

    # Verify B- resilience (0 donors)
    b_neg = res_map["B-"]
    assert b_neg.ready_count == 0
    assert b_neg.coverage_percent == 0.0
    assert b_neg.status == "Critical"


def test_regional_gaps_privacy_preservation(analytics_db):
    """
    Verifies geographic aggregation by zone.
    Ensures no individual coordinates or donor IDs are leaked in gap results.
    """
    gaps = calculate_network_gaps(analytics_db)
    assert len(gaps) >= 2

    # Check Wagholi zone
    wagholi_gap = next((g for g in gaps if g.zone == "Wagholi"), None)
    assert wagholi_gap is not None
    assert wagholi_gap.ready_now == 5
    assert wagholi_gap.re_engageable >= 2  # The 2 unavailable donors with load <= 2
    assert wagholi_gap.severity in ["Critical", "High Risk"]

    # Verify that gaps contains only aggregated counts, not donor identifiers
    gap_dict = wagholi_gap.model_dump()
    assert "donor_id" not in gap_dict
    assert "phone" not in gap_dict
    assert "lat" not in gap_dict
    assert "lng" not in gap_dict


def test_partner_analytics_metrics(analytics_db):
    """Verifies that partner metrics reflect actual database linkages and completeness."""
    partners = calculate_partner_analytics(analytics_db)
    assert len(partners) == 2

    p1 = next((p for p in partners if p["org_id"] == "ORG-TEST-1"), None)
    assert p1 is not None
    # 8 total donors were linked to org1
    assert p1["active_donors"] == 8
    assert p1["ready_donors"] == 5
    assert p1["data_completeness_percent"] == 100.0

    p2 = next((p for p in partners if p["org_id"] == "ORG-TEST-2"), None)
    assert p2 is not None
    assert p2["active_donors"] == 12
    assert p2["ready_donors"] == 12

    # Detail check
    p2_detail = calculate_partner_detail(analytics_db, "ORG-TEST-2")
    assert p2_detail is not None
    assert p2_detail["blood_group_distribution"]["A+"] == 12
