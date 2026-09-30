"""RAKTSETU API — Network Intelligence"""
from fastapi import APIRouter
from app.services.demo_data import get_network_metrics, PUNE_ZONES, ORGANISATIONS

router = APIRouter()


@router.get("/metrics")
async def network_metrics():
    return get_network_metrics()


@router.get("/zones")
async def list_zones():
    return PUNE_ZONES


@router.get("/zones/{zone_name}")
async def zone_detail(zone_name: str):
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
    # Return generic zone data
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
async def list_organisations():
    return ORGANISATIONS
