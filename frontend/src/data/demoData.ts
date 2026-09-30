// RAKTSETU — Centralised Deterministic Demo Data
// All data is purely synthetic. No real people. No real contact information.
// This is the single source of truth for the prototype demo.

import type {
  Incident, DonorCandidate, NetworkMetrics, Organisation,
  StressScenario, StressResult, ResponseEvent
} from '@/types'

// ─── Primary Demo Incident ───────────────────────────────────────────────────
export const DEMO_INCIDENT: Incident = {
  incident_id: 'INC-PN-48291',
  requirement: {
    blood_group: 'O-',
    units_required: 2,
    urgency: 'Critical',
    location: { zone: 'Wagholi', district: 'Pune', lat: 18.5593, lng: 73.9826 },
    requesting_facility: 'Sahyadri Hospital, Hadapsar',
    source: 'Hospital',
  },
  status: 'Mobilising',
  units_secured: 1,
  created_at: '2026-09-30T21:30:00',
  updated_at: '2026-09-30T21:38:42',
  elapsed_seconds: 522,
  donors_contacted: 5,
  duplicate_outreach_avoided: 6,
  waves: [
    {
      wave_number: 1,
      status: 'Insufficient',
      donors_contacted: 5,
      responses_received: 2,
      confirmed: 1,
      units_secured: 1,
    },
    {
      wave_number: 2,
      status: 'Active',
      donors_contacted: 4,
      responses_received: 0,
      confirmed: 0,
      units_secured: 0,
    },
  ],
  response_events: [
    { timestamp: '2026-09-30T21:41:12', donor_id: 'D1042', response: 'Accepted', blood_group: 'O-', distance_km: 3.2 },
    { timestamp: '2026-09-30T21:41:17', donor_id: 'D3819', response: 'Declined', blood_group: 'O-', distance_km: 5.7 },
    { timestamp: '2026-09-30T21:41:24', donor_id: 'D5127', response: 'NoResponse', blood_group: 'O-', distance_km: 7.1 },
  ],
}

// ─── All Incidents ───────────────────────────────────────────────────────────
export const ALL_INCIDENTS: Incident[] = [
  DEMO_INCIDENT,
  {
    incident_id: 'INC-PN-48287',
    requirement: {
      blood_group: 'B+',
      units_required: 3,
      urgency: 'High',
      location: { zone: 'Kothrud', district: 'Pune', lat: 18.5074, lng: 73.8077 },
      requesting_facility: 'Ruby Hall Clinic',
      source: 'Hospital',
    },
    status: 'Mobilising',
    units_secured: 1,
    created_at: '2026-09-30T20:15:00',
    updated_at: '2026-09-30T20:40:00',
    elapsed_seconds: 2700,
    donors_contacted: 8,
    duplicate_outreach_avoided: 4,
    waves: [
      { wave_number: 1, status: 'Insufficient', donors_contacted: 5, responses_received: 2, confirmed: 1, units_secured: 1 },
      { wave_number: 2, status: 'Active', donors_contacted: 3, responses_received: 0, confirmed: 0, units_secured: 0 },
    ],
    response_events: [],
  },
  {
    incident_id: 'INC-PN-48279',
    requirement: {
      blood_group: 'A+',
      units_required: 1,
      urgency: 'Moderate',
      location: { zone: 'Baner', district: 'Pune', lat: 18.5590, lng: 73.7868 },
      requesting_facility: 'Deenanath Mangeshkar Hospital',
      source: 'Hospital',
    },
    status: 'Matching',
    units_secured: 0,
    created_at: '2026-09-30T21:10:00',
    updated_at: '2026-09-30T21:18:00',
    elapsed_seconds: 1200,
    donors_contacted: 0,
    duplicate_outreach_avoided: 0,
    waves: [],
    response_events: [],
  },
  {
    incident_id: 'INC-PN-48265',
    requirement: {
      blood_group: 'AB+',
      units_required: 2,
      urgency: 'High',
      location: { zone: 'Hadapsar', district: 'Pune', lat: 18.5018, lng: 73.9260 },
      requesting_facility: 'Sahyadri Hospital',
      source: 'Hospital',
    },
    status: 'Fulfilled',
    units_secured: 2,
    created_at: '2026-09-30T18:00:00',
    updated_at: '2026-09-30T20:00:00',
    elapsed_seconds: 7200,
    donors_contacted: 7,
    duplicate_outreach_avoided: 3,
    fulfilled_at: '2026-09-30T20:00:00',
    response_time_seconds: 684,
    waves: [
      { wave_number: 1, status: 'Complete', donors_contacted: 4, responses_received: 3, confirmed: 2, units_secured: 2 },
    ],
    response_events: [],
  },
]

// ─── Donor Candidates ────────────────────────────────────────────────────────
export const DEMO_CANDIDATES: DonorCandidate[] = [
  {
    donor_id: 'D1042', blood_group: 'O-', distance_km: 3.2,
    response_likelihood: 0.92, match_confidence: 0.94,
    availability: 'Ready', recent_load_level: 'LOW',
    contact_reliability_level: 'HIGH', wave: 1,
  },
  {
    donor_id: 'D3819', blood_group: 'O-', distance_km: 5.7,
    response_likelihood: 0.86, match_confidence: 0.88,
    availability: 'Ready', recent_load_level: 'LOW',
    contact_reliability_level: 'HIGH', wave: 1,
  },
  {
    donor_id: 'D5127', blood_group: 'O-', distance_km: 7.1,
    response_likelihood: 0.81, match_confidence: 0.83,
    availability: 'Ready', recent_load_level: 'MEDIUM',
    contact_reliability_level: 'MEDIUM', wave: 1,
  },
  {
    donor_id: 'D8821', blood_group: 'O-', distance_km: 6.1,
    response_likelihood: 0.78, match_confidence: 0.80,
    availability: 'Maybe', recent_load_level: 'LOW',
    contact_reliability_level: 'MEDIUM', wave: 2,
  },
  {
    donor_id: 'D2234', blood_group: 'O-', distance_km: 8.9,
    response_likelihood: 0.73, match_confidence: 0.75,
    availability: 'Maybe', recent_load_level: 'MEDIUM',
    contact_reliability_level: 'LOW', wave: 2,
  },
]

// ─── Response Cascade Feed ───────────────────────────────────────────────────
export const CASCADE_FEED: ResponseEvent[] = [
  { timestamp: '2026-09-30T21:41:12', donor_id: 'D1042', response: 'Accepted', blood_group: 'O-', distance_km: 3.2 },
  { timestamp: '2026-09-30T21:41:17', donor_id: 'D3819', response: 'Declined', blood_group: 'O-', distance_km: 5.7 },
  { timestamp: '2026-09-30T21:41:24', donor_id: 'D5127', response: 'NoResponse', blood_group: 'O-', distance_km: 7.1 },
  { timestamp: '2026-09-30T21:41:31', donor_id: 'D8821', response: 'Accepted', blood_group: 'O-', distance_km: 6.1 },
  { timestamp: '2026-09-30T21:41:48', donor_id: 'D2234', response: 'Declined', blood_group: 'O-', distance_km: 8.9 },
]

// ─── Network Metrics ─────────────────────────────────────────────────────────
export const NETWORK_METRICS: NetworkMetrics = {
  ready_donors: 4218,
  maybe_available: 1842,
  temporarily_unavailable: 2104,
  status_unknown: 1086,
  network_coverage_percent: 87,
  median_response_minutes: 8.7,
  active_incidents: 4,
  blood_group_resilience: [
    { blood_group: 'O+',  status: 'Strong',    ready_count: 1476, coverage_percent: 94 },
    { blood_group: 'A+',  status: 'Strong',    ready_count: 1180, coverage_percent: 91 },
    { blood_group: 'B+',  status: 'Strong',    ready_count: 927,  coverage_percent: 89 },
    { blood_group: 'AB+', status: 'Stable',    ready_count: 211,  coverage_percent: 78 },
    { blood_group: 'O-',  status: 'Critical',  ready_count: 168,  coverage_percent: 41 },
    { blood_group: 'A-',  status: 'High Risk', ready_count: 127,  coverage_percent: 54 },
    { blood_group: 'B-',  status: 'High Risk', ready_count: 84,   coverage_percent: 48 },
    { blood_group: 'AB-', status: 'Critical',  ready_count: 42,   coverage_percent: 29 },
  ],
  gaps: [
    { blood_group: 'O-',  zone: 'Wagholi', severity: 'Critical',  active_donors: 42, ready_now: 11, median_response_minutes: 17, re_engageable: 26 },
    { blood_group: 'AB-', zone: 'Hadapsar', severity: 'Critical', active_donors: 18, ready_now: 4,  median_response_minutes: 22, re_engageable: 9  },
    { blood_group: 'A-',  zone: 'Baner',   severity: 'High Risk', active_donors: 31, ready_now: 8,  median_response_minutes: 14, re_engageable: 15 },
  ],
}

// ─── Organisations ────────────────────────────────────────────────────────────
export const ORGANISATIONS: Organisation[] = [
  { org_id: 'ORG-001', name: 'UPAY Pune',            type: 'NGO',       active_donors: 1240, zones: ['Baner','Aundh','Wakad'],         contact_available: true,  lat: 18.5590, lng: 73.7868 },
  { org_id: 'ORG-002', name: 'Campus Network',        type: 'University',active_donors: 684,  zones: ['Shivajinagar','Deccan','Kothrud'],contact_available: true,  lat: 18.5308, lng: 73.8475 },
  { org_id: 'ORG-003', name: 'Pune Community Group',  type: 'Community', active_donors: 412,  zones: ['Hadapsar','Magarpatta'],          contact_available: true,  lat: 18.5018, lng: 73.9260 },
  { org_id: 'ORG-004', name: 'Blood Bank Network',    type: 'BloodBank', active_donors: 890,  zones: ['Yerawada','Viman Nagar','Wagholi'],contact_available: true, lat: 18.5679, lng: 73.9143 },
  { org_id: 'ORG-005', name: 'Rotary Pune East',      type: 'Civic',     active_donors: 320,  zones: ['Hadapsar','Wagholi','Kondhwa'],   contact_available: true,  lat: 18.5018, lng: 73.9260 },
]

// ─── Stress Scenarios ─────────────────────────────────────────────────────────
export const STRESS_SCENARIOS: StressScenario[] = [
  { scenario_id: 'S1', name: '30% Donor Unavailability',         description: '30% of donors become temporarily unavailable simultaneously', capacity_reduction: 0.30 },
  { scenario_id: 'S2', name: '2× Demand Surge',                  description: 'Double the number of simultaneous blood requirements',          capacity_reduction: 0 },
  { scenario_id: 'S3', name: 'Rare Blood Shortage',              description: 'Critical shortage of O− and AB− blood groups',                 capacity_reduction: 0.60 },
  { scenario_id: 'S4', name: 'Partner Organisation Unavailable', description: 'Lead partner organisation goes offline',                       capacity_reduction: 0.20 },
  { scenario_id: 'S5', name: 'Multiple Simultaneous Emergencies',description: '5 critical incidents open simultaneously across the network',  capacity_reduction: 0 },
]

// Deterministic stress simulation result
export function computeStressResult(scenarioId: string, capacityPercent: number): StressResult {
  const capacity = capacityPercent / 100
  const oNegBefore = 68
  const oNegAfter = Math.max(10, oNegBefore * capacity - ((1 - capacity) * 20))
  const delayIncrease = Math.round((1 - capacity) * 90)

  return {
    scenario_id: scenarioId,
    capacity_percent: capacityPercent,
    o_neg_coverage_before: oNegBefore,
    o_neg_coverage_after: Math.round(oNegAfter * 10) / 10,
    status: oNegAfter < 45 ? 'Critical' : 'High Risk',
    weakest_zone: 'Wagholi',
    expected_delay_increase_percent: delayIncrease,
    steps: [
      'Removing unavailable capacity',
      'Recalculating donor coverage',
      'Recalculating response probability',
      'Re-routing partner capacity',
      'Detecting critical gaps',
      'Generating interventions',
    ],
    interventions: [
      { rank: 1, title: 'Activate partner network',       description: 'Wagholi · 3 organisations available',             impact: 'High' },
      { rank: 2, title: 'Re-engage dormant O− donors',    description: '26 candidates identified in Wagholi zone',        impact: 'High' },
      { rank: 3, title: 'Run targeted O− donor drive',    description: 'Target zone: Wagholi',                            impact: 'Medium' },
    ],
  }
}

// ─── Pune Map Zones ──────────────────────────────────────────────────────────
export const PUNE_ZONES = [
  { zone: 'Wagholi',      lat: 18.5593, lng: 73.9826, donorCount: 420,  readyNow: 11,  severity: 'Critical'  as const },
  { zone: 'Kothrud',      lat: 18.5074, lng: 73.8077, donorCount: 850,  readyNow: 380, severity: 'Strong'    as const },
  { zone: 'Baner',        lat: 18.5590, lng: 73.7868, donorCount: 720,  readyNow: 320, severity: 'Stable'    as const },
  { zone: 'Hadapsar',     lat: 18.5018, lng: 73.9260, donorCount: 610,  readyNow: 250, severity: 'High Risk' as const },
  { zone: 'Wakad',        lat: 18.5995, lng: 73.7636, donorCount: 540,  readyNow: 240, severity: 'Strong'    as const },
  { zone: 'Aundh',        lat: 18.5584, lng: 73.8074, donorCount: 490,  readyNow: 220, severity: 'Strong'    as const },
  { zone: 'Viman Nagar',  lat: 18.5679, lng: 73.9143, donorCount: 380,  readyNow: 160, severity: 'Stable'    as const },
  { zone: 'Kondhwa',      lat: 18.4678, lng: 73.8900, donorCount: 310,  readyNow: 130, severity: 'Stable'    as const },
  { zone: 'Pimpri',       lat: 18.6280, lng: 73.7995, donorCount: 650,  readyNow: 290, severity: 'Strong'    as const },
  { zone: 'Shivajinagar', lat: 18.5308, lng: 73.8475, donorCount: 420,  readyNow: 185, severity: 'Strong'    as const },
]
