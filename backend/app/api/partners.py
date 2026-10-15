"""
RAKTSETU API — Partner Network Router
Provides operational partner metrics, contributed donor capacity, coverage areas,
and data completeness based on canonical database relationships.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import Organisation as DBOrganisation
from app.services.network_intelligence import calculate_partner_analytics, calculate_partner_detail
from app.services.demo_data import ORGANISATIONS

router = APIRouter()


@router.get("/")
async def list_partners(db: Session = Depends(get_db)):
    """List all registered partner organisations with computed operational capacity metrics."""
    org_count = db.query(DBOrganisation).count()
    if org_count > 0:
        return calculate_partner_analytics(db)
    return ORGANISATIONS


@router.get("/{org_id}")
async def get_partner(org_id: str, db: Session = Depends(get_db)):
    """Retrieve operational details and blood-group capacity contributed by a specific partner."""
    detail = calculate_partner_detail(db, org_id)
    if detail:
        return detail

    # Fallback to demo orgs
    for org in ORGANISATIONS:
        if org.org_id == org_id:
            return org

    raise HTTPException(status_code=404, detail=f"Partner organisation '{org_id}' not found.")
