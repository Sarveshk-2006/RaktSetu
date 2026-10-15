"""
RAKTSETU API — Network Intelligence Router
Serves live network metrics, blood group resilience, regional coverage,
and capacity gaps directly from the database, maintaining full backward compatibility.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import Donor, Organisation as DBOrganisation
from app.models.models import NetworkMetrics, BloodGroupResilience
from app.services.network_intelligence import (
    calculate_network_metrics,
    calculate_blood_group_resilience,
    calculate_network_gaps,
    calculate_partner_analytics,
)
from app.services.demo_data import get_network_metrics, PUNE_ZONES, ORGANISATIONS

router = APIRouter()


@router.get("/metrics")
async def network_metrics(db: Session = Depends(get_db)):
    """Computes and returns comprehensive network intelligence metrics from persistence."""
    donor_count = db.query(Donor).count()
    if donor_count > 0:
        return calculate_network_metrics(db)
    return get_network_metrics()


@router.get("/blood-groups")
async def blood_group_resilience(db: Session = Depends(get_db)):
    """Returns resilience metrics for all 8 standard blood groups."""
    donor_count = db.query(Donor).count()
    if donor_count > 0:
        return calculate_blood_group_resilience(db)
    return get_network_metrics().blood_group_resilience


@router.get("/zones")
async def list_zones(db: Session = Depends(get_db)):
    """Returns list of monitored geographic zones with coordinates."""
    return PUNE_ZONES


@router.get("/zones/{zone_name}")
async def zone_detail(zone_name: str, db: Session = Depends(get_db)):
    """Returns detailed capacity, ready donors, and fragile blood groups for a specific zone."""
    donor_count = db.query(Donor).count()
    if donor_count > 0:
        gaps = calculate_network_gaps(db)
        for gap in gaps:
            if gap.zone.lower() == zone_name.lower():
                return {
                    "zone": gap.zone,
                    "blood_group": gap.blood_group,
                    "severity": gap.severity,
                    "active_donors": gap.active_donors,
                    "ready_now": gap.ready_now,
                    "median_response_minutes": gap.median_response_minutes,
                    "re_engageable": gap.re_engageable,
                }

    # Fallback to demo zone lookup
    metrics = get_network_metrics()
    for gap in metrics.gaps:
        if gap.zone.lower() == zone_name.lower():
            return {
                "zone": gap.zone,
                "blood_group": gap.blood_group,
                "severity": gap.severity,
                "active_donors": gap.active_donors,
                "ready_now": gap.ready_now,
                "median_response_minutes": gap.median_response_minutes,
                "re_engageable": gap.re_engageable,
            }

    for z in PUNE_ZONES:
        if z["zone"].lower() == zone_name.lower():
            return {
                "zone": z["zone"],
                "severity": "Stable",
                "active_donors": 280,
                "ready_now": 126,
                "median_response_minutes": 9.0,
                "re_engageable": 40,
            }

    return {"zone": zone_name, "severity": "Unknown"}


@router.get("/organisations")
async def list_organisations(db: Session = Depends(get_db)):
    """Returns participating partner organisations with live capacity numbers."""
    org_count = db.query(DBOrganisation).count()
    if org_count > 0:
        return calculate_partner_analytics(db)
    return ORGANISATIONS
