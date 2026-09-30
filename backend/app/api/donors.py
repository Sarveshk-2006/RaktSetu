"""RAKTSETU API — Donors"""
from fastapi import APIRouter, Query
from app.services.demo_data import get_donor_pool
from app.models.models import DonorReadiness

router = APIRouter()


@router.get("/summary")
async def donor_summary():
    """Return aggregated donor readiness summary (no PII)."""
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
