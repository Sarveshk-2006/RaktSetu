# RAKTSETU — Blood Response Coordination & Network Intelligence Platform

> Hackathon prototype for **Samadhan 2026–27 National Social Innovation Challenge**
> Track 3: Community-Centric Engagement

---

## Core Principle

**Registered capacity ≠ usable capacity.**

RAKTSETU coordinates verified blood requirements with distributed donor capacity through progressive mobilisation — protecting donor privacy, preventing duplicate outreach, and strengthening the network with every incident resolved.

---

## Demo Scenarios

### Primary Demo Incident
- **ID**: `INC-PN-48291`
- **Blood Group**: O−
- **Units**: 2 · **Urgency**: Critical
- **Location**: Wagholi, Pune

### Hero Experiences
1. **Incident Response** → `/incidents/INC-PN-48291`
2. **Response Cascade** → `/response`
3. **Network Stress Lab** → `/stress`

---

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# API at http://localhost:8000
# Docs at http://localhost:8000/api/docs
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Routing | React Router v7 |
| Charts | Recharts |
| Maps | React Leaflet + OpenStreetMap |
| Icons | Lucide React |
| Backend | Python, FastAPI, Pydantic v2 |
| Data | Deterministic synthetic data (no real donor PII) |

---

## Environment Variables

Copy `.env.example` → `.env` and fill in values.
**Never commit `.env` files.**

---

## Architecture

```
RAKTSETU/
  frontend/
    src/
      components/
        ui/          # KpiCard, StatusBadge, BloodGroupBadge
        layout/      # AppShell, Sidebar, TopBar
        incidents/   # IncidentCard
      pages/         # All 8 screens
      data/          # demoData.ts — single source of truth
      types/         # TypeScript interfaces
      lib/           # Utils, colour helpers
  backend/
    app/
      api/           # FastAPI routers
      core/          # Config
      models/        # Pydantic domain models
      services/      # Deterministic data engine
```

---

## Data

All data is **purely synthetic**. 20,000 simulated donors, 15 organisations, 50 zones, 500 historical incidents.
No real people. No real phone numbers. No real contact information.

---

*DEMO ENVIRONMENT · SYNTHETIC DATA*
