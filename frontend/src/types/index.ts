// RAKTSETU — Core TypeScript Types
// Mirrors backend Pydantic models. Keep in sync with backend/app/models/models.py

export type BloodGroup =
  | 'O+' | 'O-'
  | 'A+' | 'A-'
  | 'B+' | 'B-'
  | 'AB+' | 'AB-'

export type IncidentUrgency = 'Critical' | 'High' | 'Moderate' | 'Routine'

export type IncidentStatus =
  | 'PendingVerification'
  | 'Verified'
  | 'Matching'
  | 'Mobilising'
  | 'Partially Fulfilled'
  | 'Fulfilled'
  | 'Escalated'
  | 'Cancelled'
  | 'Closed'

export type DonorReadiness = 'Ready' | 'Maybe' | 'Unavailable' | 'Unknown'
export type DonorResponse = 'Accepted' | 'Declined' | 'UnableToHelp' | 'NoResponse' | 'Expired' | 'Pending'
export type WaveStatus =
  | 'Pending'
  | 'Active'
  | 'Dispatched'
  | 'Evaluating'
  | 'Complete'
  | 'Completed'
  | 'Insufficient'
  | 'Exhausted'
  | 'Expired'
  | 'Cancelled'
export type SeverityLevel = 'Critical' | 'High Risk' | 'Stable' | 'Strong'

export interface Location {
  zone: string
  district: string
  lat: number
  lng: number
}

export interface IncidentRequirement {
  blood_group: BloodGroup
  units_required: number
  urgency: IncidentUrgency
  location: Location
  requesting_facility: string
  source: string
}

export interface ResponseWave {
  wave_number: number
  status: WaveStatus
  donors_contacted: number
  responses_received: number
  confirmed: number
  units_secured: number
}

export interface ResponseEvent {
  timestamp: string
  donor_id: string
  response: DonorResponse
  blood_group: BloodGroup
  distance_km: number
}

export interface Incident {
  incident_id: string
  requirement?: IncidentRequirement
  blood_group?: string
  units_requested?: number
  urgency?: string
  requesting_facility?: string
  zone?: string
  district?: string
  status: IncidentStatus | string
  units_secured: number
  created_at: string
  updated_at?: string
  elapsed_seconds?: number
  donors_contacted?: number
  duplicate_outreach_avoided?: number
  waves?: ResponseWave[]
  response_events?: ResponseEvent[]
  fulfilled_at?: string
  response_time_seconds?: number
}

export interface DonorCandidate {
  donor_id: string
  blood_group: BloodGroup
  distance_km: number
  response_likelihood: number
  match_confidence: number
  availability: DonorReadiness
  recent_load_level: 'LOW' | 'MEDIUM' | 'HIGH'
  contact_reliability_level: 'LOW' | 'MEDIUM' | 'HIGH'
  wave: number
}

export interface BloodGroupResilience {
  blood_group: BloodGroup
  status: SeverityLevel
  ready_count: number
  coverage_percent: number
}

export interface NetworkGap {
  blood_group: BloodGroup
  zone: string
  severity: SeverityLevel
  active_donors: number
  ready_now: number
  median_response_minutes: number
  re_engageable: number
}

export interface RegionalCoverageItem {
  name: string
  capacity_state: string
  donor_count: number
  status_color: string
  text_color: string
  lat: number
  lng: number
  o_neg_status: string
  partner_coverage: string
  median_response: string
}

export interface ZoneMetricsItem {
  zone: string
  lat: number
  lng: number
  donor_count: number
  ready_now: number
  severity: string
  active_incidents: number
}

export interface NetworkMetrics {
  total_registered_donors?: number
  ready_donors: number
  maybe_available_donors?: number
  temporarily_unavailable_donors?: number
  status_unknown_donors?: number
  operational_coverage_pct?: number
  usable_donors?: number
  coverage_areas_count?: number
  blood_group_resilience: BloodGroupResilience[]
  regional_coverage?: RegionalCoverageItem[]
  timestamp?: string
  // Legacy compatibility fields
  maybe_available: number
  temporarily_unavailable: number
  status_unknown: number
  network_coverage_percent: number
  median_response_minutes: number
  active_incidents: number
  gaps: NetworkGap[]
}

export interface Organisation {
  org_id: string
  name: string
  type: string
  active_donors: number
  zones: string[]
  contact_available: boolean
  lat: number
  lng: number
}

export interface StressScenario {
  scenario_id: string
  name: string
  description: string
  type?: string
  parameters?: Record<string, any>
  capacity_reduction?: number
}

export interface StressRunRequest {
  scenario_id: string
  scenario_type?: string
  parameters?: Record<string, any>
}

export interface StressIntervention {
  rank: number
  title: string
  description: string
  impact: 'High' | 'Medium' | 'Low'
}

export interface StressResult {
  scenario_id: string
  capacity_percent: number
  o_neg_coverage_before: number
  o_neg_coverage_after: number
  status: string
  weakest_zone: string
  expected_delay_increase_percent: number
  steps: string[]
  interventions: StressIntervention[]
}

export interface ZoneDetail {
  zone: string
  blood_group?: BloodGroup
  severity: SeverityLevel
  active_donors: number
  ready_now: number
  median_response_minutes: number
  re_engageable: number
}
