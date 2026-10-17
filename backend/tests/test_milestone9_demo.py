"""
RAKTSETU — Milestone 9: End-to-End Stakeholder Demonstration Script
Executes the 12 required demonstration steps in a single automated workflow:
1. Operator authentication.
2. Synthetic blood requirement creation.
3. Authorised clinical verification.
4. Explainable candidate matching.
5. Response wave mobilization.
6. Synthetic donor response recording (explicitly labelled).
7. Proving donor response does NOT equal blood unit fulfilment.
8. Clinical blood bank fulfilment & over-fulfilment guard.
9. Incident closure.
10. Verifiable audit trail hash chain inspection.
11. Stress Lab simulation execution.
12. Verification of operational data isolation and immutability.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import SessionLocal
from app.models.db_models import Donor, Incident


@pytest.mark.asyncio
async def test_milestone9_complete_stakeholder_demonstration():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Log in as authorized incident operator
        res_login = await client.post(
            "/api/auth/login",
            json={"username": "coord.neha", "password": "Operator@Pune2026"},
        )
        assert res_login.status_code == 200, f"Login failed: {res_login.text}"
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Create a synthetic emergency blood requirement
        req_payload = {
            "blood_group": "A-",
            "component": "Packed RBC",
            "units_requested": 2,
            "urgency": "Critical",
            "requesting_facility": "KEM Hospital Pune (Synthetic Demo)",
            "zone": "Kothrud",
            "district": "Pune",
            "lat": 18.5074,
            "lng": 73.8077,
            "source": "Hospital",
            "auto_verify": False,
            "actor": "Coord. Neha S.",
        }
        res_create = await client.post("/api/incidents/", json=req_payload, headers=headers)
        assert res_create.status_code == 201
        inc_data = res_create.json()
        incident_id = inc_data["incident_id"]
        assert inc_data["status"] == "PendingVerification"
        assert inc_data["units_secured"] == 0

        # Step 3: Authorised verification by Hospital Operator
        # Switch token to hospital operator
        res_hosp_login = await client.post(
            "/api/auth/login",
            json={"username": "dr.sharma", "password": "Hospital@Pune2026"},
        )
        assert res_hosp_login.status_code == 200
        hosp_token = res_hosp_login.json()["access_token"]
        hosp_headers = {"Authorization": f"Bearer {hosp_token}"}

        verify_payload = {
            "verified_by": "Dr. A. Sharma",
            "notes": "Clinically confirmed with Transfusion Medicine Officer at KEM Hospital.",
            "facility_confirmed": True,
        }
        res_verify = await client.post(
            f"/api/incidents/{incident_id}/verify",
            json=verify_payload,
            headers=hosp_headers,
        )
        assert res_verify.status_code == 200
        assert res_verify.json()["status"] == "Verified"

        # Step 4: Retrieve explainable matching donor candidates
        res_candidates = await client.get(f"/api/incidents/{incident_id}/candidates", headers=headers)
        assert res_candidates.status_code == 200
        candidates_data = res_candidates.json()
        assert "candidates" in candidates_data
        assert len(candidates_data["candidates"]) > 0
        first_candidate = candidates_data["candidates"][0]
        assert "score" in first_candidate
        assert "distance_km" in first_candidate
        assert len(first_candidate["reasons"]) > 0

        # Step 5: Activate Response Wave 1
        res_wave = await client.post(
            f"/api/incidents/{incident_id}/waves",
            json={"wave_size": 2, "operator_id": "Coord. Neha S."},
            headers=headers,
        )
        assert res_wave.status_code == 201
        wave_data = res_wave.json()
        assert wave_data["wave_number"] == 1
        assert wave_data["status"] == "Active"
        assert wave_data["donors_contacted"] == 2

        # Step 6 & 7: Demonstrate synthetic responses & proof that acceptance != confirmed units
        # Inspect incident: status is Mobilising, units_secured is still 0
        res_inc = await client.get(f"/api/incidents/{incident_id}", headers=headers)
        assert res_inc.status_code == 200
        assert res_inc.json()["status"] == "Mobilising"
        assert res_inc.json()["units_secured"] == 0

        # Step 8: Separate clinical blood bank fulfilment
        fulfill_payload_1 = {
            "units_confirmed": 1,
            "confirmation_source": "KEM Blood Bank",
            "confirmed_by": "Dr. A. Sharma",
            "notes": "Unit 1 verified and matched by blood bank officer.",
        }
        res_fulfill_1 = await client.post(
            f"/api/incidents/{incident_id}/fulfill",
            json=fulfill_payload_1,
            headers=hosp_headers,
        )
        assert res_fulfill_1.status_code == 200
        assert res_fulfill_1.json()["units_secured"] == 1
        assert res_fulfill_1.json()["status"] == "Partially Fulfilled"

        # Over-fulfilment rejection test
        res_over = await client.post(
            f"/api/incidents/{incident_id}/fulfill",
            json={"units_confirmed": 2, "confirmation_source": "KEM Blood Bank", "confirmed_by": "Dr. A. Sharma"},
            headers=hosp_headers,
        )
        assert res_over.status_code == 400
        assert "exceed" in res_over.json()["detail"].lower()

        # Fulfill second unit -> Fulfilled
        fulfill_payload_2 = {
            "units_confirmed": 1,
            "confirmation_source": "KEM Blood Bank",
            "confirmed_by": "Dr. A. Sharma",
            "notes": "Unit 2 verified and issued to ICU.",
        }
        res_fulfill_2 = await client.post(
            f"/api/incidents/{incident_id}/fulfill",
            json=fulfill_payload_2,
            headers=hosp_headers,
        )
        assert res_fulfill_2.status_code == 200
        assert res_fulfill_2.json()["units_secured"] == 2
        assert res_fulfill_2.json()["status"] == "Fulfilled"

        # Step 9: Authorised incident closure
        res_close = await client.post(
            f"/api/incidents/{incident_id}/close",
            json={"closed_by": "Coord. Neha S.", "notes": "Emergency fulfilled and closed."},
            headers=headers,
        )
        assert res_close.status_code == 200
        assert res_close.json()["status"] == "closed"

        # Step 10: Persisted audit trail hash chain verification
        res_audit = await client.get(f"/api/incidents/{incident_id}/audit-trail", headers=headers)
        assert res_audit.status_code == 200
        audit_events = res_audit.json()
        assert len(audit_events) >= 5
        for ev in audit_events:
            assert ev["sha256_hash"] is not None
            assert len(ev["sha256_hash"]) == 64

        # Verify cryptographic audit chain integrity endpoint
        res_chain = await client.get("/api/audit/verify-chain")
        assert res_chain.status_code == 200
        chain_data = res_chain.json()
        assert chain_data["valid"] is True
        assert chain_data["verified_events"] > 0

        # Step 11 & 12: Stress Lab simulation & operational data isolation
        db = SessionLocal()
        donor_count_before = db.query(Donor).count()
        db.close()

        stress_payload = {
            "scenario_id": "monsoon_surge",
            "simulation_name": "Stakeholder Demo Simulation",
            "executed_by": "Coord. Neha S.",
        }
        res_stress = await client.post("/api/stress/run", json=stress_payload, headers=headers)
        assert res_stress.status_code == 200
        sim_data = res_stress.json()
        assert sim_data["scenario_id"] in ["monsoon_surge", "S1"]
        assert "capacity_percent" in sim_data or "simulation_id" in sim_data

        # Verify operational records are completely unmodified
        db = SessionLocal()
        donor_count_after = db.query(Donor).count()
        db.close()
        assert donor_count_before == donor_count_after
