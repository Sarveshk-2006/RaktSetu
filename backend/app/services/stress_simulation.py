"""
RAKTSETU - Stress Lab Simulation Engine
Executes isolated, deterministic network resilience shock scenarios on a read-only database snapshot.
Guaranteed to never modify live operational state (donors, incidents, waves, contact attempts, or audit logs).
Persists simulation runs separately in simulation_runs for review and comparison.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.models.db_models import Donor, Incident, Organisation, SimulationRun
from app.services.network_intelligence import (
    calculate_network_metrics,
    calculate_blood_group_resilience,
    TARGET_USABLE_BENCHMARKS,
    ALL_STANDARD_BLOOD_GROUPS,
    ACTIVE_INCIDENT_STATUSES,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


SCENARIO_CATALOG = [
    {
        "scenario_id": "S1",
        "name": "30% Donor Unavailability",
        "description": "Simulate 30% of usable donors becoming temporarily unavailable across all zones.",
        "capacity_reduction": 0.30,
        "demand_multiplier": 1.0,
    },
    {
        "scenario_id": "S2",
        "name": "2× Demand Surge",
        "description": "Simulate a 200% surge in emergency blood requirement volume.",
        "capacity_reduction": 0.0,
        "demand_multiplier": 2.0,
    },
    {
        "scenario_id": "S3",
        "name": "Rare Blood Shortage",
        "description": "Critical acute shortage of O− and AB− universal/rare donor capacity.",
        "capacity_reduction": 0.60,
        "demand_multiplier": 1.0,
    },
    {
        "scenario_id": "S4",
        "name": "Partner Organisation Unavailable",
        "description": "A lead civic/hospital partner organisation and its linked donors go offline.",
        "capacity_reduction": 0.20,
        "demand_multiplier": 1.0,
    },
    {
        "scenario_id": "S5",
        "name": "Multiple Simultaneous Emergencies",
        "description": "5 concurrent high-urgency trauma incidents open simultaneously across Pune.",
        "capacity_reduction": 0.15,
        "demand_multiplier": 2.5,
    },
]


class StressIntervention(BaseModel):
    rank: int
    title: str
    description: str
    impact: str  # High / Medium / Low
    rationale: str


class StressResultResponse(BaseModel):
    simulation_id: str
    scenario_id: str
    scenario_name: str
    capacity_percent: float
    o_neg_coverage_before: float
    o_neg_coverage_after: float
    status: str
    weakest_zone: str
    expected_delay_increase_percent: float
    baseline_ready_donors: int
    simulated_ready_donors: int
    affected_blood_groups: List[str]
    affected_zones: List[str]
    steps: List[str]
    interventions: List[StressIntervention]
    is_simulation: bool = True
    clinical_notice: str = (
        "STRESS LAB NOTICE: This calculation represents a synthetic stress test model. "
        "It does not represent clinical prognostication or guaranteed real-world availability."
    )


# ─── 1. SIMULATION EXECUTION ──────────────────────────────────────────────────

def run_stress_simulation(
    db: Session,
    scenario_id: str,
    capacity_percent: Optional[float] = None,
    target_org_id: Optional[str] = None,
    target_zone: Optional[str] = None,
    executed_by: str = "System Operator",
) -> StressResultResponse:
    """
    Executes a deterministic stress test against a read-only snapshot of live database records.
    Persists the run record in simulation_runs while leaving operational records 100% untouched.
    """
    # 1. Resolve Scenario
    scenario = next((s for s in SCENARIO_CATALOG if s["scenario_id"] == scenario_id), None)
    if not scenario:
        # Default fallback to S1
        scenario = SCENARIO_CATALOG[0]

    # Resolve capacity ratio
    if capacity_percent is not None:
        eff_capacity_ratio = max(0.05, min(1.0, capacity_percent / 100.0))
    else:
        eff_capacity_ratio = max(0.05, 1.0 - scenario["capacity_reduction"])

    eff_capacity_pct = round(eff_capacity_ratio * 100.0, 1)

    # 2. Take Baseline Snapshot (READ ONLY)
    all_donors = db.query(Donor).filter(Donor.is_active == True).all()

    baseline_ready_by_bg: Dict[str, int] = {bg: 0 for bg in ALL_STANDARD_BLOOD_GROUPS}
    baseline_ready_by_zone: Dict[str, int] = {}
    total_baseline_ready = 0

    for d in all_donors:
        r_lower = (d.readiness or "").strip().lower()
        if d.consent_given and d.contact_permission and r_lower == "ready":
            total_baseline_ready += 1
            bg_clean = (d.blood_group or "").strip().upper()
            if bg_clean in baseline_ready_by_bg:
                baseline_ready_by_bg[bg_clean] += 1
            z = d.zone or "Unknown"
            baseline_ready_by_zone[z] = baseline_ready_by_zone.get(z, 0) + 1

    # Baseline O- coverage
    o_neg_target = TARGET_USABLE_BENCHMARKS.get("O-", 10)
    o_neg_before = min(100.0, round((baseline_ready_by_bg.get("O-", 0) / o_neg_target) * 100.0, 1))

    # 3. Apply Simulated Shock in Memory (Read-Only)
    simulated_ready_by_bg: Dict[str, int] = {}
    simulated_ready_by_zone: Dict[str, int] = {}
    affected_bgs: List[str] = []

    for bg, count in baseline_ready_by_bg.items():
        if scenario_id == "S3" and bg in ["O-", "AB-"]:
            # Rare blood group acute shortage: 70% reduction
            sim_count = max(0, int(count * 0.30))
        elif scenario_id == "S4" and target_org_id:
            # Partner offline
            org = db.query(Organisation).filter_by(org_id=target_org_id).first()
            org_donor_ids = {d.id for d in (org.donors if org else [])}
            org_bg_count = sum(
                1 for d in all_donors
                if d.id in org_donor_ids and (d.blood_group or "").strip().upper() == bg
                and (d.readiness or "").lower() == "ready"
            )
            sim_count = max(0, count - org_bg_count)
        else:
            sim_count = max(0, int(count * eff_capacity_ratio))

        simulated_ready_by_bg[bg] = sim_count
        if sim_count < count:
            affected_bgs.append(bg)

    # Zone-level shock
    for zone, count in baseline_ready_by_zone.items():
        if scenario_id == "S5" and target_zone and zone.lower() == target_zone.lower():
            sim_count = 0  # Inaccessible zone
        else:
            sim_count = max(0, int(count * eff_capacity_ratio))
        simulated_ready_by_zone[zone] = sim_count

    total_simulated_ready = sum(simulated_ready_by_bg.values())

    # Simulated O- coverage
    o_neg_sim_count = simulated_ready_by_bg.get("O-", 0)
    o_neg_after = min(100.0, round((o_neg_sim_count / o_neg_target) * 100.0, 1))

    # Find weakest zone
    weakest_zone = "Wagholi"
    lowest_zone_count = 999999
    affected_zones: List[str] = []

    for z, z_count in simulated_ready_by_zone.items():
        if z_count < lowest_zone_count:
            lowest_zone_count = z_count
            weakest_zone = z
        if z_count < baseline_ready_by_zone.get(z, 0):
            affected_zones.append(z)

    # Delay increase calculation
    reduction_ratio = 1.0 - (total_simulated_ready / total_baseline_ready) if total_baseline_ready > 0 else 0.5
    expected_delay_increase = round(reduction_ratio * 0.9 * 100.0, 0)

    # Determine status
    if o_neg_after < 40.0 or eff_capacity_pct < 50.0:
        sim_status = "Critical"
    elif o_neg_after < 70.0 or eff_capacity_pct < 75.0:
        sim_status = "High Risk"
    else:
        sim_status = "Stable"

    # 4. Generate Explainable Recommendations
    interventions: List[StressIntervention] = [
        StressIntervention(
            rank=1,
            title="Activate civic partner network",
            description=f"{weakest_zone} · Mobilise regional partner organisations for backup coverage.",
            impact="High",
            rationale=f"Weakest zone {weakest_zone} dropped to {lowest_zone_count} ready donors under simulated conditions.",
        ),
        StressIntervention(
            rank=2,
            title="Re-engage standby and dormant donors",
            description=f"Identify standby and eligible donors in {weakest_zone} and adjacent coverage corridors.",
            impact="High",
            rationale=f"Simulated capacity reduction of {round((1.0 - eff_capacity_ratio)*100, 1)}% requires activating non-primary pools.",
        ),
        StressIntervention(
            rank=3,
            title="Schedule targeted donor mobilisation drive",
            description=f"Targeted outreach for fragile blood groups: {', '.join(affected_bgs[:3])}.",
            impact="Medium",
            rationale=f"Blood groups {', '.join(affected_bgs[:3])} dropped below baseline resilience benchmarks.",
        ),
    ]

    steps = [
        "Snapshotting read-only network baseline",
        f"Simulating capacity reduction to {eff_capacity_pct}%",
        "Evaluating ABO/Rh component availability",
        f"Identifying geographic bottleneck in {weakest_zone}",
        "Calculating response latency impact",
        "Synthesizing operator recommendations",
    ]

    # 5. Persist Simulation Run to simulation_runs (Leaves operational tables untouched)
    sim_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"
    run_record = SimulationRun(
        simulation_id=sim_id,
        scenario_id=scenario["scenario_id"],
        scenario_name=scenario["name"],
        parameters={
            "capacity_percent": eff_capacity_pct,
            "target_org_id": target_org_id,
            "target_zone": target_zone,
        },
        baseline_metrics={
            "total_ready": total_baseline_ready,
            "o_neg_coverage": o_neg_before,
        },
        simulated_metrics={
            "total_ready": total_simulated_ready,
            "o_neg_coverage": o_neg_after,
            "weakest_zone": weakest_zone,
        },
        capacity_difference_percent=round((1.0 - eff_capacity_ratio) * 100.0, 1),
        affected_blood_groups=affected_bgs,
        affected_zones=affected_zones,
        bottlenecks=[f"{weakest_zone} zone donor exhaustion", "O- universal trauma supply dip"],
        interventions=[i.model_dump() for i in interventions],
        executed_at=utc_now(),
        executed_by=executed_by,
    )
    db.add(run_record)
    db.commit()

    return StressResultResponse(
        simulation_id=sim_id,
        scenario_id=scenario["scenario_id"],
        scenario_name=scenario["name"],
        capacity_percent=eff_capacity_pct,
        o_neg_coverage_before=o_neg_before,
        o_neg_coverage_after=o_neg_after,
        status=sim_status,
        weakest_zone=weakest_zone,
        expected_delay_increase_percent=expected_delay_increase,
        baseline_ready_donors=total_baseline_ready,
        simulated_ready_donors=total_simulated_ready,
        affected_blood_groups=affected_bgs,
        affected_zones=affected_zones,
        steps=steps,
        interventions=interventions,
    )
