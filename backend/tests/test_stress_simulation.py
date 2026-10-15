"""
RAKTSETU - Unit & Integration Tests for Stress Lab Simulation Engine
Verifies deterministic shock scenarios, read-only simulation isolation,
reproducibility, explainable operator interventions, and simulation history persistence.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import Base
from app.models.db_models import (
    Donor,
    Incident,
    BloodRequirement,
    ResponseWave,
    ContactAttempt,
    AuditEvent,
    SimulationRun,
)
from app.services.stress_simulation import run_stress_simulation, SCENARIO_CATALOG


@pytest.fixture
def sim_db():
    """Provides an isolated database populated with synthetic donor baseline."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Populate 30 donors across 3 zones and blood groups
    blood_groups = ["O-", "O+", "A+", "B+"]
    zones = ["Wagholi", "Hadapsar", "Kothrud"]
    for i in range(30):
        session.add(Donor(
            donor_id=f"D-SIM-{i+1}",
            blood_group=blood_groups[i % len(blood_groups)],
            readiness="Ready",
            consent_given=True,
            contact_permission=True,
            zone=zones[i % len(zones)],
            district="Pune",
            lat=18.5204 + (i * 0.005),
            lng=73.8567 + (i * 0.005),
            response_rate=0.80,
            avg_response_time_minutes=10.0,
            recent_load=0,
            contact_reliability=0.90,
            is_active=True,
        ))
    session.commit()

    try:
        yield session
    finally:
        session.close()


def test_simulation_read_only_isolation(sim_db):
    """
    CRITICAL TEST:
    Verifies that running a stress simulation NEVER modifies live operational state:
    - Donors count and readiness must remain identical
    - Live incidents, waves, contact attempts, and audit events must not be created or altered
    """
    # 1. Capture exact baseline state
    initial_donors_ready = sim_db.query(Donor).filter_by(readiness="Ready").count()
    initial_donors_count = sim_db.query(Donor).count()
    initial_incidents_count = sim_db.query(Incident).count()
    initial_waves_count = sim_db.query(ResponseWave).count()
    initial_attempts_count = sim_db.query(ContactAttempt).count()
    initial_audits_count = sim_db.query(AuditEvent).count()

    # 2. Run high-severity shock simulation (30% capacity remaining / 70% shock)
    res = run_stress_simulation(
        db=sim_db,
        scenario_id="S1",
        capacity_percent=30.0,
        executed_by="Dr. Testing",
    )

    assert res.is_simulation is True
    assert res.capacity_percent == 30.0
    assert res.simulated_ready_donors < initial_donors_ready

    # 3. Assert live database tables are 100% UNCHANGED
    assert sim_db.query(Donor).filter_by(readiness="Ready").count() == initial_donors_ready
    assert sim_db.query(Donor).count() == initial_donors_count
    assert sim_db.query(Incident).count() == initial_incidents_count
    assert sim_db.query(ResponseWave).count() == initial_waves_count
    assert sim_db.query(ContactAttempt).count() == initial_attempts_count
    assert sim_db.query(AuditEvent).count() == initial_audits_count


def test_simulation_determinism_and_reproducibility(sim_db):
    """Verifies that running identical simulation scenarios on the same snapshot produces identical metrics."""
    res1 = run_stress_simulation(sim_db, scenario_id="S1", capacity_percent=60.0)
    res2 = run_stress_simulation(sim_db, scenario_id="S1", capacity_percent=60.0)

    assert res1.simulated_ready_donors == res2.simulated_ready_donors
    assert res1.o_neg_coverage_after == res2.o_neg_coverage_after
    assert res1.status == res2.status
    assert res1.weakest_zone == res2.weakest_zone
    assert res1.expected_delay_increase_percent == res2.expected_delay_increase_percent


def test_rare_blood_shortage_scenario(sim_db):
    """Verifies Scenario S3 (Rare Blood Shortage) specifically impacts O- and AB- universal/rare supply."""
    res = run_stress_simulation(sim_db, scenario_id="S3")

    assert res.scenario_id == "S3"
    assert "O-" in res.affected_blood_groups
    assert res.o_neg_coverage_after < res.o_neg_coverage_before
    assert len(res.interventions) >= 3

    # Check that interventions contain explainable rationales
    for intervention in res.interventions:
        assert intervention.rank > 0
        assert intervention.title
        assert intervention.description
        assert intervention.rationale


def test_simulation_persisted_to_history(sim_db):
    """Verifies that simulation runs are recorded in simulation_runs for auditability."""
    initial_runs = sim_db.query(SimulationRun).count()

    res = run_stress_simulation(sim_db, scenario_id="S2", capacity_percent=80.0)

    assert sim_db.query(SimulationRun).count() == initial_runs + 1
    persisted = sim_db.query(SimulationRun).filter_by(simulation_id=res.simulation_id).first()
    assert persisted is not None
    assert persisted.scenario_id == "S2"
    assert persisted.capacity_difference_percent == 20.0


@pytest.mark.asyncio
async def test_stress_api_endpoints():
    """Validates stress lab HTTP endpoints (/scenarios, /run, /history)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List scenarios
        res_scenarios = await client.get("/api/stress/scenarios")
        assert res_scenarios.status_code == 200
        scenarios = res_scenarios.json()
        assert len(scenarios) >= 5

        # 2. Run simulation via POST /api/stress/run
        run_payload = {
            "scenario_id": "S1",
            "capacity_percent": 65.0,
            "executed_by": "Automation Test Runner",
        }
        res_run = await client.post("/api/stress/run", json=run_payload)
        assert res_run.status_code == 200
        data = res_run.json()
        sim_id = data["simulation_id"]
        assert sim_id.startswith("SIM-")
        assert data["capacity_percent"] == 65.0
        assert "steps" in data
        assert "interventions" in data

        # 3. Retrieve history via GET /api/stress/history
        res_hist = await client.get("/api/stress/history")
        assert res_hist.status_code == 200
        hist_runs = res_hist.json()
        assert len(hist_runs) >= 1
        assert any(r["simulation_id"] == sim_id for r in hist_runs)

        # 4. Retrieve specific simulation run
        res_detail = await client.get(f"/api/stress/history/{sim_id}")
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert detail["simulation_id"] == sim_id
        assert detail["scenario_id"] == "S1"
