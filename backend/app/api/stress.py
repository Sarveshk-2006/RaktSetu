"""RAKTSETU API — Stress Lab"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

SCENARIOS = [
    {
        "scenario_id": "S1",
        "name": "30% Donor Unavailability",
        "description": "Simulate 30% of donors becoming temporarily unavailable simultaneously",
        "capacity_reduction": 0.30,
    },
    {
        "scenario_id": "S2",
        "name": "2× Demand Surge",
        "description": "Double the number of simultaneous blood requirements",
        "capacity_reduction": 0.0,
        "demand_multiplier": 2.0,
    },
    {
        "scenario_id": "S3",
        "name": "Rare Blood Shortage",
        "description": "Critical shortage of O− and AB− blood groups",
        "capacity_reduction": 0.60,
    },
    {
        "scenario_id": "S4",
        "name": "Partner Organisation Unavailable",
        "description": "Lead partner organisation goes offline",
        "capacity_reduction": 0.20,
    },
    {
        "scenario_id": "S5",
        "name": "Multiple Simultaneous Emergencies",
        "description": "5 critical incidents open simultaneously across the network",
        "capacity_reduction": 0.0,
    },
]


class RunSimulationRequest(BaseModel):
    scenario_id: str
    capacity_percent: float = 70.0


@router.get("/scenarios")
async def list_scenarios():
    return SCENARIOS


@router.post("/run")
async def run_simulation(req: RunSimulationRequest):
    """Run a deterministic stress simulation."""
    capacity = req.capacity_percent / 100.0
    reduction = 1.0 - capacity
    o_neg_before = 68.0
    o_neg_after = max(10.0, o_neg_before * capacity - (reduction * 20))
    delay_increase = round(reduction * 0.9 * 100, 0)

    return {
        "scenario_id": req.scenario_id,
        "capacity_percent": req.capacity_percent,
        "o_neg_coverage_before": o_neg_before,
        "o_neg_coverage_after": round(o_neg_after, 1),
        "status": "Critical" if o_neg_after < 45 else "High Risk",
        "weakest_zone": "Wagholi",
        "expected_delay_increase_percent": delay_increase,
        "steps": [
            "Removing unavailable capacity",
            "Recalculating donor coverage",
            "Recalculating response probability",
            "Re-routing partner capacity",
            "Detecting critical gaps",
            "Generating interventions",
        ],
        "interventions": [
            {
                "rank": 1,
                "title": "Activate partner network",
                "description": "Wagholi · 3 organisations available",
                "impact": "High",
            },
            {
                "rank": 2,
                "title": "Re-engage dormant O− donors",
                "description": "26 candidates identified in Wagholi zone",
                "impact": "High",
            },
            {
                "rank": 3,
                "title": "Run targeted O− donor drive",
                "description": "Target zone: Wagholi",
                "impact": "Medium",
            },
        ],
    }
