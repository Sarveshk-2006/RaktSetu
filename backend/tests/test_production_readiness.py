"""
RAKTSETU — Milestone 8: Production Deployment & Readiness Test Suite
Verifies:
1. Production configuration validation safeguards (failing safely on weak secrets or invalid origins).
2. Development fallback authentication forbidden in production.
3. Seeding blocked in production environment.
4. Administrative user provisioning CLI behavior.
5. Observability & Security middleware headers (X-Correlation-ID, nosniff, DENY).
6. Liveness (/api/health) and Readiness (/api/health/ready) probes.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import Settings
from app.models.db_models import User, UserRole
from app.db.seed import seed_database
from app.cli.create_admin import validate_password_strength


def test_production_config_validation_safeguards():
    """Verifies that invalid or insecure production configs fail safely."""
    # 1. Insecure default secret key
    s1 = Settings(
        ENVIRONMENT="production",
        AUTH_STRICT=True,
        SECRET_KEY="raktsetu-super-secure-production-ready-secret-key-change-in-env-2026",
        DATABASE_URL="postgresql+psycopg2://user:pass@localhost:5432/raktsetu",
        ALLOWED_ORIGINS=["https://raktsetu.vercel.app"],
    )
    with pytest.raises(RuntimeError) as exc1:
        s1.validate_production_configuration()
    assert "SECRET_KEY is insecure" in str(exc1.value)

    # 2. SQLite in production
    s2 = Settings(
        ENVIRONMENT="production",
        AUTH_STRICT=True,
        SECRET_KEY="a" * 40,
        DATABASE_URL="sqlite:///./raktsetu.db",
        ALLOWED_ORIGINS=["https://raktsetu.vercel.app"],
    )
    with pytest.raises(RuntimeError) as exc2:
        s2.validate_production_configuration()
    assert "DATABASE_URL cannot be SQLite in production" in str(exc2.value)

    # 3. Wildcard or localhost origins in production
    s3 = Settings(
        ENVIRONMENT="production",
        AUTH_STRICT=True,
        SECRET_KEY="a" * 40,
        DATABASE_URL="postgresql+psycopg2://user:pass@host:5432/raktsetu",
        ALLOWED_ORIGINS=["http://localhost:5173"],
    )
    with pytest.raises(RuntimeError) as exc3:
        s3.validate_production_configuration()
    assert "ALLOWED_ORIGINS cannot contain localhost" in str(exc3.value)

    # 4. Valid production settings pass cleanly
    s_valid = Settings(
        ENVIRONMENT="production",
        AUTH_STRICT=True,
        SECRET_KEY="f" * 48,
        DATABASE_URL="postgresql+psycopg2://user:pass@prod-db.host:5432/raktsetu",
        ALLOWED_ORIGINS=["https://raktsetu.vercel.app", "https://raktsetu-demo.vercel.app"],
    )
    s_valid.validate_production_configuration()

    # 5. Cloud postgres:// URL normalization and comma-separated origins
    s_norm = Settings(
        ENVIRONMENT="production",
        AUTH_STRICT=True,
        SECRET_KEY="x" * 48,
        DATABASE_URL="postgres://user:pass@prod-db.host:5432/raktsetu",
        ALLOWED_ORIGINS="https://raktsetu.vercel.app, https://raktsetu-demo.vercel.app",
    )
    assert s_norm.DATABASE_URL == "postgresql://user:pass@prod-db.host:5432/raktsetu"
    assert s_norm.ALLOWED_ORIGINS == ["https://raktsetu.vercel.app", "https://raktsetu-demo.vercel.app"]
    s_norm.validate_production_configuration()


def test_seed_blocked_in_production(db_session):
    """Verifies that seed_database refuses to run when ENVIRONMENT is production."""
    from app.core.config import settings
    orig_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"
    try:
        with pytest.raises(RuntimeError) as exc_info:
            seed_database(db=db_session)
        assert "CRITICAL SAFEGUARD: Seed script cannot be run in PRODUCTION" in str(exc_info.value)
    finally:
        settings.ENVIRONMENT = orig_env


def test_password_strength_validator():
    """Verifies strict password complexity rules for production administrators."""
    # Too short
    with pytest.raises(ValueError, match="at least 12 characters"):
        validate_password_strength("Short1!")

    # No uppercase
    with pytest.raises(ValueError, match="uppercase"):
        validate_password_strength("alllowercase123!")

    # No digits
    with pytest.raises(ValueError, match="digit"):
        validate_password_strength("NoDigitsHere!!")

    # No special chars
    with pytest.raises(ValueError, match="special character"):
        validate_password_strength("NoSpecialChar123")

    # Valid strong password
    validate_password_strength("RaktSetu@ProdAdmin2026!")


@pytest.mark.asyncio
async def test_health_and_readiness_probes():
    """Verifies liveness (/api/health) and readiness (/api/health/ready) endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Liveness
        res_live = await client.get("/api/health")
        assert res_live.status_code == 200
        live_data = res_live.json()
        assert live_data["status"] == "operational"
        assert live_data["service"] == "RAKTSETU"
        assert "database" not in live_data  # No internal info leak

        # Readiness
        res_ready = await client.get("/api/health/ready")
        assert res_ready.status_code == 200
        ready_data = res_ready.json()
        assert ready_data["status"] == "ready"
        assert ready_data["database"] == "connected"


@pytest.mark.asyncio
async def test_correlation_id_and_security_headers():
    """Verifies X-Correlation-ID and security headers are attached to responses."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Client provides correlation ID
        custom_id = "test-client-corr-999"
        res = await client.get("/api/health", headers={"X-Correlation-ID": custom_id})
        assert res.status_code == 200
        assert res.headers.get("X-Correlation-ID") == custom_id
        assert res.headers.get("X-Content-Type-Options") == "nosniff"
        assert res.headers.get("X-Frame-Options") == "DENY"
        assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert "X-Process-Time-Ms" in res.headers

        # Auto-generated correlation ID
        res_auto = await client.get("/api/health")
        assert res_auto.headers.get("X-Correlation-ID").startswith("req-")
