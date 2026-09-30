"""
RAKTSETU - Pydantic Models (Domain Objects)
These represent the core domain entities for the system.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum
from datetime import datetime


class BloodGroup(str, Enum):
    O_POS = "O+"
    O_NEG = "O-"
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"


class IncidentUrgency(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MODERATE = "Moderate"
    ROUTINE = "Routine"


class IncidentStatus(str, Enum):
    VERIFIED = "Verified"
    MATCHING = "Matching"
    MOBILISING = "Mobilising"
    FULFILLED = "Fulfilled"
    CLOSED = "Closed"


class DonorReadiness(str, Enum):
    READY = "Ready"
    MAYBE = "Maybe"
    UNAVAILABLE = "Unavailable"
    UNKNOWN = "Unknown"


class DonorResponse(str, Enum):
    ACCEPTED = "Accepted"
    DECLINED = "Declined"
    NO_RESPONSE = "NoResponse"
    PENDING = "Pending"


class WaveStatus(str, Enum):
    PENDING = "Pending"
    ACTIVE = "Active"
    COMPLETE = "Complete"
    INSUFFICIENT = "Insufficient"


class Location(BaseModel):
    zone: str
    district: str
    lat: float
    lng: float


class Donor(BaseModel):
    donor_id: str
    blood_group: BloodGroup
    location: Location
    availability: DonorReadiness
    response_rate: float = Field(ge=0, le=1)
    avg_response_time_minutes: float
    recent_load: int  # donations in last 90 days
    contact_reliability: float = Field(ge=0, le=1)
    organisation_id: Optional[str] = None
    last_activity: datetime
    is_active: bool = True


class DonorCandidate(BaseModel):
    donor_id: str
    blood_group: BloodGroup
    distance_km: float
    response_likelihood: float
    match_confidence: float
    availability: DonorReadiness
    recent_load_level: str  # LOW / MEDIUM / HIGH
    contact_reliability_level: str  # LOW / MEDIUM / HIGH
    wave: int


class IncidentRequirement(BaseModel):
    blood_group: BloodGroup
    units_required: int
    urgency: IncidentUrgency
    location: Location
    requesting_facility: str
    source: str


class ResponseEvent(BaseModel):
    timestamp: datetime
    donor_id: str
    response: DonorResponse
    blood_group: BloodGroup
    distance_km: float


class ResponseWave(BaseModel):
    wave_number: int
    status: WaveStatus
    donors_contacted: int
    responses_received: int
    confirmed: int
    units_secured: int


class Incident(BaseModel):
    incident_id: str
    requirement: IncidentRequirement
    status: IncidentStatus
    units_secured: int
    created_at: datetime
    updated_at: datetime
    elapsed_seconds: int
    waves: List[ResponseWave] = []
    response_events: List[ResponseEvent] = []
    fulfilled_at: Optional[datetime] = None
    response_time_seconds: Optional[int] = None
    donors_contacted: int = 0
    duplicate_outreach_avoided: int = 0


class NetworkGap(BaseModel):
    blood_group: BloodGroup
    zone: str
    severity: str  # Critical / High Risk / Stable / Strong
    active_donors: int
    ready_now: int
    median_response_minutes: float
    re_engageable: int


class BloodGroupResilience(BaseModel):
    blood_group: BloodGroup
    status: str
    ready_count: int
    coverage_percent: float


class NetworkMetrics(BaseModel):
    ready_donors: int
    maybe_available: int
    temporarily_unavailable: int
    status_unknown: int
    network_coverage_percent: float
    median_response_minutes: float
    active_incidents: int
    blood_group_resilience: List[BloodGroupResilience]
    gaps: List[NetworkGap]


class Organisation(BaseModel):
    org_id: str
    name: str
    type: str
    active_donors: int
    zones: List[str]
    contact_available: bool
    lat: float
    lng: float


class StressScenario(BaseModel):
    scenario_id: str
    name: str
    description: str
    capacity_reduction: float  # 0.0–1.0


class StressResult(BaseModel):
    scenario: StressScenario
    o_neg_coverage_before: float
    o_neg_coverage_after: float
    status: str
    weakest_zone: str
    expected_delay_increase_percent: float
    interventions: List[Dict]
