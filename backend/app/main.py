"""
RAKTSETU - Blood Response Coordination & Network Intelligence Platform
FastAPI Backend - Main Application Entry Point
"""

import uuid
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text

from app.api import incidents, donors, network, stress, partners, audit, auth, notifications
from app.core.config import settings
from app.core.database import SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Enforce strict production safeguards if launched in production
    settings.validate_production_configuration()
    yield


is_prod = settings.ENVIRONMENT.lower() in ["production", "prod"]

app = FastAPI(
    title="RAKTSETU API",
    description="Blood Response Coordination & Network Intelligence Platform",
    version="1.0.0",
    docs_url=None if is_prod else "/api/docs",
    redoc_url=None if is_prod else "/api/redoc",
    lifespan=lifespan,
)


class ObservabilityAndSecurityMiddleware(BaseHTTPMiddleware):
    """
    Injects request correlation ID and essential security response headers.
    """
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID") or f"req-{uuid.uuid4().hex[:12]}"
        request.state.correlation_id = correlation_id
        start_time = time.time()

        response: Response = await call_next(request)

        process_time_ms = (time.time() - start_time) * 1000
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        if is_prod:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


# Security & Observability middleware
app.add_middleware(ObservabilityAndSecurityMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """
    Liveness probe: verifies service process is active.
    Safe for public consumption; never exposes internal passwords or tokens.
    """
    return {
        "status": "operational",
        "service": "RAKTSETU",
        "environment": settings.ENVIRONMENT,
        "data_mode": "synthetic" if settings.DEMO_MODE else "live",
    }


@app.get("/api/health/ready")
async def readiness_check():
    """
    Readiness probe: validates database persistence connectivity.
    """
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
        return {
            "status": "ready",
            "database": "connected",
            "environment": settings.ENVIRONMENT,
        }
    except Exception as e:
        return Response(
            content='{"status": "unready", "database": "disconnected"}',
            status_code=503,
            media_type="application/json",
        )


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication & RBAC"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(donors.router, prefix="/api/donors", tags=["Donors"])
app.include_router(network.router, prefix="/api/network", tags=["Network"])
app.include_router(stress.router, prefix="/api/stress", tags=["Stress Lab"])
app.include_router(partners.router, prefix="/api/partners", tags=["Partners"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit Trail"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

