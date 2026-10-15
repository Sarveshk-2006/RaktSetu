"""
RAKTSETU API — Donors Router
Provides privacy-protected donor capacity lists and readiness summaries.
Never exposes personal contact information, phone numbers, or exact coordinates.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.db_models import Donor as DBDonor
from app.services.demo_data import get_donor_pool
from app.models.models import DonorReadiness

router = APIRouter()


@router.get("/")
async def list_donors(
    blood_group: Optional[str] = Query(None, description="Filter by blood group (e.g. O-, A+)"),
    zone: Optional[str] = Query(None, description="Filter by regional zone"),
    readiness: Optional[str] = Query(None, description="Filter by readiness (Ready, Maybe, Unavailable)"),
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    List registered donors from canonical persistence.
    Applies privacy protection: returns zone-level location and pseudonymized IDs only.
    """
    query = db.query(DBDonor).filter(DBDonor.is_active == True)

    if blood_group:
        query = query.filter(func.upper(DBDonor.blood_group) == blood_group.strip().upper())
    if zone:
        query = query.filter(func.lower(DBDonor.zone) == zone.strip().lower())
    if readiness:
        query = query.filter(func.lower(DBDonor.readiness) == readiness.strip().lower())

    total = query.count()
    donors = query.offset(skip).limit(limit).all()

    if donors:
        return [
            {
                "donor_id": d.donor_id,
                "blood_group": d.blood_group,
                "readiness": d.readiness,
                "zone": d.zone,
                "district": d.district,
                "response_rate": d.response_rate,
                "avg_response_time_minutes": d.avg_response_time_minutes,
                "recent_load": d.recent_load,
                "contact_reliability": d.contact_reliability,
                "last_activity_at": d.last_activity_at,
            }
            for d in donors
        ]

    # Fallback to demo pool if database unpopulated
    pool = get_donor_pool()
    filtered = pool
    if blood_group:
        filtered = [d for d in filtered if d.blood_group.value == blood_group.strip().upper()]
    if readiness:
        filtered = [d for d in filtered if d.availability.value.lower() == readiness.strip().lower()]

    return [
        {
            "donor_id": d.donor_id,
            "blood_group": d.blood_group.value,
            "readiness": d.availability.value,
            "zone": d.location.zone,
            "district": d.location.district,
            "response_rate": d.response_rate,
            "avg_response_time_minutes": d.avg_response_time_minutes,
            "recent_load": d.recent_load,
            "contact_reliability": d.contact_reliability,
            "last_activity_at": d.last_activity,
        }
        for d in filtered[skip : skip + limit]
    ]


@router.get("/summary")
async def donor_summary(db: Session = Depends(get_db)):
    """Return aggregated donor readiness summary (no PII)."""
    donor_count = db.query(DBDonor).count()
    if donor_count > 0:
        ready = (
            db.query(DBDonor)
            .filter(DBDonor.is_active == True, func.lower(DBDonor.readiness) == "ready")
            .count()
        )
        maybe = (
            db.query(DBDonor)
            .filter(DBDonor.is_active == True, func.lower(DBDonor.readiness).in_(["maybe", "available_within_1hr", "standby"]))
            .count()
        )
        unavailable = (
            db.query(DBDonor)
            .filter(func.lower(DBDonor.readiness).in_(["unavailable", "paused"]) | (DBDonor.is_active == False))
            .count()
        )
        unknown = db.query(DBDonor).filter(func.lower(DBDonor.readiness) == "unknown").count()

        return {
            "ready": ready,
            "maybe": maybe,
            "unavailable": unavailable,
            "unknown": unknown,
            "total": donor_count,
        }

    # Fallback to demo pool
    pool = get_donor_pool()
    counts = {
        DonorReadiness.READY: 0,
        DonorReadiness.MAYBE: 0,
        DonorReadiness.UNAVAILABLE: 0,
        DonorReadiness.UNKNOWN: 0,
    }
    for d in pool:
        counts[d.availability] += 1

    return {
        "ready": counts[DonorReadiness.READY],
        "maybe": counts[DonorReadiness.MAYBE],
        "unavailable": counts[DonorReadiness.UNAVAILABLE],
        "unknown": counts[DonorReadiness.UNKNOWN],
        "total": len(pool),
    }
