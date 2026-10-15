"""
RAKTSETU API — Stress Lab Router
Serves available stress scenarios, runs isolated simulations against read-only database snapshots,
and retrieves past simulation history without touching live operational data.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.db_models import SimulationRun
from app.services.stress_simulation import (
    SCENARIO_CATALOG,
    run_stress_simulation,
    StressResultResponse,
)

router = APIRouter()


class RunSimulationRequest(BaseModel):
    scenario_id: str
    capacity_percent: float = Field(default=70.0, ge=5.0, le=100.0)
    target_org_id: Optional[str] = None
    target_zone: Optional[str] = None
    executed_by: str = "System Operator"


@router.get("/scenarios")
async def list_scenarios():
    """Lists available stress testing scenarios and parameter templates."""
    return SCENARIO_CATALOG


@router.post("/run")
async def run_simulation(
    req: RunSimulationRequest,
    db: Session = Depends(get_db),
):
    """
    Executes a deterministic stress test against the database snapshot.
    Guaranteed to not modify live donors, incidents, or audit trails.
    """
    try:
        return run_stress_simulation(
            db=db,
            scenario_id=req.scenario_id,
            capacity_percent=req.capacity_percent,
            target_org_id=req.target_org_id,
            target_zone=req.target_zone,
            executed_by=req.executed_by,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/history")
async def list_simulation_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Lists recent stress simulation runs and comparative metrics."""
    runs = (
        db.query(SimulationRun)
        .order_by(SimulationRun.executed_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "simulation_id": r.simulation_id,
            "scenario_id": r.scenario_id,
            "scenario_name": r.scenario_name,
            "capacity_difference_percent": r.capacity_difference_percent,
            "executed_at": r.executed_at,
            "executed_by": r.executed_by,
            "simulated_metrics": r.simulated_metrics,
            "bottlenecks": r.bottlenecks,
        }
        for r in runs
    ]


@router.get("/history/{simulation_id}")
async def get_simulation_run(
    simulation_id: str,
    db: Session = Depends(get_db),
):
    """Retrieves full details, parameters, and recommendations of a specific past simulation."""
    run = db.query(SimulationRun).filter_by(simulation_id=simulation_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Simulation run '{simulation_id}' not found.")

    return {
        "simulation_id": run.simulation_id,
        "scenario_id": run.scenario_id,
        "scenario_name": run.scenario_name,
        "parameters": run.parameters,
        "baseline_metrics": run.baseline_metrics,
        "simulated_metrics": run.simulated_metrics,
        "capacity_difference_percent": run.capacity_difference_percent,
        "affected_blood_groups": run.affected_blood_groups,
        "affected_zones": run.affected_zones,
        "bottlenecks": run.bottlenecks,
        "interventions": run.interventions,
        "executed_at": run.executed_at,
        "executed_by": run.executed_by,
    }
