"""
RAKTSETU - Blood Response Coordination & Network Intelligence Platform
FastAPI Backend - Main Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import incidents, donors, network, stress, partners
from app.core.config import settings

app = FastAPI(
    title="RAKTSETU API",
    description="Blood Response Coordination & Network Intelligence Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

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
    return {
        "status": "operational",
        "service": "RAKTSETU",
        "environment": settings.ENVIRONMENT,
        "data_mode": "synthetic",
    }


# Include routers
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(donors.router, prefix="/api/donors", tags=["Donors"])
app.include_router(network.router, prefix="/api/network", tags=["Network"])
app.include_router(stress.router, prefix="/api/stress", tags=["Stress Lab"])
app.include_router(partners.router, prefix="/api/partners", tags=["Partners"])
