"""
RAKTSETU - Unit Tests for API Backward Compatibility
Verifies that introducing the persistence layer does not break existing FastAPI endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "operational"
        assert data["service"] == "RAKTSETU"


@pytest.mark.asyncio
async def test_incidents_endpoints_compatibility():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # List incidents
        res_list = await client.get("/api/incidents/")
        assert res_list.status_code == 200
        assert isinstance(res_list.json(), list)

        # Get specific demo incident
        res_item = await client.get("/api/incidents/INC-PN-48291")
        assert res_item.status_code == 200
        assert res_item.json()["incident_id"] == "INC-PN-48291"


@pytest.mark.asyncio
async def test_donors_summary_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/donors/summary")
        assert res.status_code == 200
        data = res.json()
        assert "ready" in data
        assert "total" in data


@pytest.mark.asyncio
async def test_network_endpoints_compatibility():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_metrics = await client.get("/api/network/metrics")
        assert res_metrics.status_code == 200

        res_zones = await client.get("/api/network/zones")
        assert res_zones.status_code == 200


@pytest.mark.asyncio
async def test_stress_endpoints_compatibility():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/stress/scenarios")
        assert res.status_code == 200
        scenarios = res.json()
        assert len(scenarios) >= 5


@pytest.mark.asyncio
async def test_partners_endpoint_compatibility():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/partners/")
        assert res.status_code == 200
        partners = res.json()
        assert len(partners) >= 5


@pytest.mark.asyncio
async def test_donors_list_endpoint_compatibility():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/donors/?limit=10")
        assert res.status_code == 200
        donors = res.json()
        assert isinstance(donors, list)
        if donors:
            assert "donor_id" in donors[0]
            assert "blood_group" in donors[0]
            assert "phone" not in donors[0]  # Privacy check


@pytest.mark.asyncio
async def test_audit_list_endpoint_compatibility():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/audit/?limit=10")
        assert res.status_code == 200
        events = res.json()
        assert isinstance(events, list)
        if events:
            assert "event_id" in events[0]
            assert "sha256_hash" in events[0]

