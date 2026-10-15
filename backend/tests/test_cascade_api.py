"""
RAKTSETU - End-to-End API Integration Tests for Milestone 3
Validates incident creation, verification, candidate matching, wave launching,
donor response recording, fulfilment confirmation, and audit trail via HTTP endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_full_incident_and_cascade_lifecycle_via_api():
    """End-to-end integration test through FastAPI endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create a new incident (unverified)
        create_payload = {
            "blood_group": "B+",
            "component": "Packed RBC",
            "units_requested": 2,
            "urgency": "High",
            "requesting_facility": "Sahyadri Super Speciality Hospital, Deccan",
            "zone": "Deccan",
            "district": "Pune",
            "lat": 18.5167,
            "lng": 73.8405,
            "source": "Hospital",
            "auto_verify": False,
            "actor": "Dr. V. Kulkarni",
        }
        res_create = await client.post("/api/incidents/", json=create_payload)
        assert res_create.status_code == 201
        inc_data = res_create.json()
        inc_id = inc_data["incident_id"]
        assert inc_id.startswith("INC-PN-")
        assert inc_data["status"] == "PendingVerification"
        assert inc_data["units_secured"] == 0

        # 2. Attempting to launch wave before verification must fail (HTTP 400)
        res_wave_unverified = await client.post(
            f"/api/incidents/{inc_id}/waves",
            json={"wave_size": 3},
        )
        assert res_wave_unverified.status_code == 400
        assert "Only Verified requirements can initiate donor mobilisation" in res_wave_unverified.json()["detail"]

        # 3. Authorised verification
        verify_payload = {
            "verified_by": "Coord. Neha S.",
            "notes": "Verified directly with blood transfusion officer.",
            "facility_confirmed": True,
        }
        res_verify = await client.post(f"/api/incidents/{inc_id}/verify", json=verify_payload)
        assert res_verify.status_code == 200
        assert res_verify.json()["status"] == "Verified"

        # 4. Query matching candidates
        res_candidates = await client.get(f"/api/incidents/{inc_id}/candidates")
        assert res_candidates.status_code == 200
        candidates_data = res_candidates.json()
        assert "candidates" in candidates_data
        assert candidates_data["blood_group_requested"] == "B+"
        assert len(candidates_data["candidates"]) > 0

        # 5. Launch Wave 1
        res_launch = await client.post(
            f"/api/incidents/{inc_id}/waves",
            json={"wave_size": 2, "operator_id": "Coord. Neha S."},
        )
        assert res_launch.status_code == 201
        wave_data = res_launch.json()
        assert wave_data["wave_number"] == 1
        assert wave_data["status"] == "Active"
        assert wave_data["donors_contacted"] == 2

        # 6. Fetch incident details and verify waves
        res_get = await client.get(f"/api/incidents/{inc_id}")
        assert res_get.status_code == 200
        fetched = res_get.json()
        assert fetched["status"] == "Mobilising"
        assert len(fetched["waves"]) == 1
        assert fetched["waves"][0]["status"] == "Active"

        # 7. Record Donor Response
        # First retrieve contact attempt ID from database via audit-trail or responses
        res_audit = await client.get(f"/api/incidents/{inc_id}/audit-trail")
        assert res_audit.status_code == 200
        audit_events = res_audit.json()
        assert len(audit_events) >= 3  # RequirementCreated, RequirementVerified, WaveLaunched

        # 8. Confirm Fulfilment: 1 unit (Partial Fulfilment)
        fulfill_payload_1 = {
            "units_confirmed": 1,
            "confirmation_source": "Sahyadri Blood Bank",
            "confirmed_by": "Dr. V. Kulkarni",
            "notes": "First unit delivered and accepted.",
        }
        res_fulfill_1 = await client.post(f"/api/incidents/{inc_id}/fulfill", json=fulfill_payload_1)
        assert res_fulfill_1.status_code == 200
        assert res_fulfill_1.json()["units_secured"] == 1
        assert res_fulfill_1.json()["status"] == "Partially Fulfilled"

        # 9. Over-fulfilment rejection: attempting to confirm 2 more units (total would be 3 > 2)
        fulfill_over = {
            "units_confirmed": 2,
            "confirmation_source": "Sahyadri Blood Bank",
            "confirmed_by": "Dr. V. Kulkarni",
        }
        res_fulfill_over = await client.post(f"/api/incidents/{inc_id}/fulfill", json=fulfill_over)
        assert res_fulfill_over.status_code == 400
        assert "would exceed requested units" in res_fulfill_over.json()["detail"]

        # 10. Confirm remaining unit -> Fulfilled
        fulfill_payload_2 = {
            "units_confirmed": 1,
            "confirmation_source": "Sahyadri Blood Bank",
            "confirmed_by": "Dr. V. Kulkarni",
            "notes": "Second unit delivered.",
        }
        res_fulfill_2 = await client.post(f"/api/incidents/{inc_id}/fulfill", json=fulfill_payload_2)
        assert res_fulfill_2.status_code == 200
        assert res_fulfill_2.json()["units_secured"] == 2
        assert res_fulfill_2.json()["status"] == "Fulfilled"

        # 11. Authorised closure
        close_payload = {
            "closed_by": "Coord. Neha S.",
            "notes": "Requirement successfully satisfied; closing incident.",
        }
        res_close = await client.post(f"/api/incidents/{inc_id}/close", json=close_payload)
        assert res_close.status_code == 200
        assert res_close.json()["status"] == "closed"

        # 12. Verify full audit trail has valid SHA-256 hashes
        res_final_audit = await client.get(f"/api/incidents/{inc_id}/audit-trail")
        assert res_final_audit.status_code == 200
        events = res_final_audit.json()
        assert len(events) >= 5
        for ev in events:
            assert ev["sha256_hash"] is not None
            assert len(ev["sha256_hash"]) == 64
            assert ev["incident_id"] == inc_id
