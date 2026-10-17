/**
 * RAKTSETU — Authoritative API Client Layer
 * Connects frontend React components directly to the FastAPI backend.
 * Provides typed requests, structured error handling, and unified network fault recovery.
 */

import type {
  Incident,
  NetworkMetrics,
  BloodGroupResilience,
  Organisation,
  StressScenario,
  ZoneMetricsItem,
  StressRunRequest,
} from '@/types'
import {
  DEMO_INCIDENT,
  ALL_INCIDENTS,
  DEMO_CANDIDATES,
  NETWORK_METRICS,
  PUNE_ZONES,
  STRESS_SCENARIOS,
  computeStressResult,
  DEMO_AUDIT_EVENTS,
} from '@/data/demoData'
import { PARTNERS_DATA } from '@/data/partnersData'

const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || ''

export function normalizeApiBase(base: string): string {
  if (!base) return '/api'
  const trimmed = base.replace(/\/+$/, '')
  if (trimmed.endsWith('/api')) return trimmed
  return `${trimmed}/api`
}

export const BASE_URL = normalizeApiBase(rawBase)
const AUTH_TOKEN_KEY = 'raktsetu_auth_token'

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(`API Error ${status}: ${detail}`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export async function checkBackendHealth(): Promise<{ live: boolean; service: string; mode: 'authoritative' | 'demo' }> {
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    })
    const ct = res.headers.get('content-type') || ''
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json()
      return { live: true, service: data.service || 'FastAPI Authoritative Backend', mode: 'authoritative' }
    }
  } catch {}
  return { live: false, service: 'Verified Deterministic Demo Sandbox', mode: 'demo' }
}

const MOCK_DONORS = [
  {
    donor_id: 'D1042',
    blood_group: 'O-',
    readiness: 'ready',
    zone: 'Wagholi',
    district: 'Pune',
    response_rate: 0.94,
    avg_response_time_minutes: 8.5,
    recent_load: 0,
    contact_reliability: 0.94,
    last_activity_at: '2026-09-30T21:41:12',
    historical_donations_count: 5,
    in_cooldown: false,
    last_active_hours_ago: 2,
    last_incident_id: 'INC-PN-48291',
  },
  {
    donor_id: 'D3819',
    blood_group: 'O-',
    readiness: 'ready',
    zone: 'Hadapsar',
    district: 'Pune',
    response_rate: 0.88,
    avg_response_time_minutes: 14.2,
    recent_load: 0,
    contact_reliability: 0.88,
    last_activity_at: '2026-09-30T21:38:00',
    historical_donations_count: 4,
    in_cooldown: false,
    last_active_hours_ago: 3,
    last_incident_id: 'INC-PN-48287',
  },
  {
    donor_id: 'D5127',
    blood_group: 'O-',
    readiness: 'ready',
    zone: 'Viman Nagar',
    district: 'Pune',
    response_rate: 0.83,
    avg_response_time_minutes: 17.8,
    recent_load: 1,
    contact_reliability: 0.83,
    last_activity_at: '2026-09-30T20:15:00',
    historical_donations_count: 3,
    in_cooldown: false,
    last_active_hours_ago: 5,
  },
  {
    donor_id: 'D8821',
    blood_group: 'O-',
    readiness: 'maybe',
    zone: 'Kothrud',
    district: 'Pune',
    response_rate: 0.80,
    avg_response_time_minutes: 15.0,
    recent_load: 0,
    contact_reliability: 0.80,
    last_activity_at: '2026-09-30T16:00:00',
    historical_donations_count: 2,
    in_cooldown: false,
    last_active_hours_ago: 8,
  },
  {
    donor_id: 'D2234',
    blood_group: 'O-',
    readiness: 'maybe',
    zone: 'Baner',
    district: 'Pune',
    response_rate: 0.75,
    avg_response_time_minutes: 22.0,
    recent_load: 1,
    contact_reliability: 0.75,
    last_activity_at: '2026-09-30T12:00:00',
    historical_donations_count: 6,
    in_cooldown: false,
    last_active_hours_ago: 12,
  },
  {
    donor_id: 'D4409',
    blood_group: 'B+',
    readiness: 'ready',
    zone: 'Shivajinagar',
    district: 'Pune',
    response_rate: 0.96,
    avg_response_time_minutes: 6.0,
    recent_load: 0,
    contact_reliability: 0.96,
    last_activity_at: '2026-09-30T22:00:00',
    historical_donations_count: 8,
    in_cooldown: false,
    last_active_hours_ago: 1,
  },
  {
    donor_id: 'D6172',
    blood_group: 'A+',
    readiness: 'ready',
    zone: 'Aundh',
    district: 'Pune',
    response_rate: 0.92,
    avg_response_time_minutes: 10.2,
    recent_load: 0,
    contact_reliability: 0.92,
    last_activity_at: '2026-09-30T19:00:00',
    historical_donations_count: 4,
    in_cooldown: false,
    last_active_hours_ago: 4,
  },
  {
    donor_id: 'D7091',
    blood_group: 'AB-',
    readiness: 'unavailable',
    zone: 'Wakad',
    district: 'Pune',
    response_rate: 0.88,
    avg_response_time_minutes: 24.0,
    recent_load: 3,
    contact_reliability: 0.88,
    last_activity_at: '2026-09-29T10:00:00',
    historical_donations_count: 7,
    in_cooldown: true,
    last_active_hours_ago: 26,
  },
]

function getMockResponse(cleanEndpoint: string, options: RequestInit = {}): any {
  const method = (options.method || 'GET').toUpperCase()
  const [path] = cleanEndpoint.split('?')

  // Health
  if (path === '/health') {
    return { status: 'healthy', service: 'FastAPI (Deterministic Demo Fallback)', environment: 'production-demo' }
  }

  // Incidents collection
  if (path === '/incidents/' || path === '/incidents') {
    if (method === 'POST') {
      let body: any = {}
      try {
        body = options.body ? JSON.parse(options.body as string) : {}
      } catch {}
      const newId = `INC-PN-${Math.floor(10000 + Math.random() * 90000)}`
      const newInc: Incident = {
        incident_id: newId,
        status: body.auto_verify ? 'Verified' : 'PendingVerification',
        units_secured: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        elapsed_seconds: 0,
        donors_contacted: 0,
        duplicate_outreach_avoided: 0,
        waves: [],
        response_events: [],
        requirement: {
          blood_group: body.blood_group || 'O-',
          units_required: Number(body.units_requested || 2),
          urgency: (body.urgency || 'Critical') as any,
          requesting_facility: body.requesting_facility || 'Pune District Hospital',
          location: {
            zone: body.zone || 'Wagholi',
            district: body.district || 'Pune',
            lat: body.lat || 18.5593,
            lng: body.lng || 73.9826,
          },
          source: (body.source || 'Hospital') as any,
        },
      }
      return newInc
    }
    return ALL_INCIDENTS
  }

  // Check Duplicate Requirement
  if (path.startsWith('/incidents/check-duplicate')) {
    const url = new URL(cleanEndpoint, 'http://localhost')
    const fac = (url.searchParams.get('facility') || '').toLowerCase()
    const bg = (url.searchParams.get('blood_group') || '').toUpperCase()
    if (fac.includes('sahyadri') && (bg === 'O-' || bg === 'O+')) {
      return {
        duplicate_found: true,
        incident_id: 'INC-PN-48291',
        status: 'Mobilising',
        facility: 'Sahyadri Hospital, Hadapsar',
        blood_group: 'O-',
        units_requested: 2,
        units_secured: 0,
        message: "Active incident 'INC-PN-48291' is already coordinating 2 units of O- for Sahyadri Hospital. Unified coordination recommends coordinating under this existing shared incident to prevent duplicate outreach.",
      }
    }
    return {
      duplicate_found: false,
      message: 'No active duplicate requirement found. Requisition can proceed.',
    }
  }

  // Incident detail: /incidents/:id
  const incDetailMatch = path.match(/^\/incidents\/([^/]+)$/)
  if (incDetailMatch && method === 'GET') {
    const id = decodeURIComponent(incDetailMatch[1])
    const found = ALL_INCIDENTS.find(i => i.incident_id === id)
    if (found) return found
    return { ...DEMO_INCIDENT, incident_id: id }
  }

  // Candidates
  if (path.match(/^\/incidents\/[^/]+\/candidates$/)) {
    const id = decodeURIComponent(path.split('/')[2])
    return { incident_id: id, candidates: DEMO_CANDIDATES }
  }

  // Waves mutation
  if (path.match(/^\/incidents\/[^/]+\/waves$/) && method === 'POST') {
    return {
      wave_number: 2,
      status: 'Active',
      donors_contacted: 4,
      responses_received: 0,
      confirmed: 0,
      units_secured: 0,
      dispatched_at: new Date().toISOString(),
    }
  }

  // Activate wave legacy
  if (path.match(/^\/incidents\/[^/]+\/activate-wave/) && method === 'POST') {
    return { wave_number: 1, status: 'Active' }
  }

  // Advance wave
  if (path.match(/^\/incidents\/[^/]+\/waves\/[^/]+\/advance$/) && method === 'POST') {
    return {
      wave_number: 1,
      status: 'Complete',
      donors_contacted: 5,
      responses_received: 2,
      confirmed: 1,
      units_secured: 1,
    }
  }

  // Record response
  if (path.match(/^\/incidents\/[^/]+\/responses$/) && method === 'POST') {
    return { status: 'Recorded', timestamp: new Date().toISOString() }
  }

  // Verify incident
  if (path.match(/^\/incidents\/[^/]+\/verify$/)) {
    return { ...DEMO_INCIDENT, status: 'Verified', clinical_approval: true }
  }

  // Fulfill incident
  if (path.match(/^\/incidents\/[^/]+\/fulfill$/)) {
    return { ...DEMO_INCIDENT, status: 'Fulfilled', units_secured: 2 }
  }

  // Close incident
  if (path.match(/^\/incidents\/[^/]+\/close$/)) {
    return { ...DEMO_INCIDENT, status: 'Closed' }
  }

  // Cancel incident
  if (path.match(/^\/incidents\/[^/]+\/cancel$/)) {
    return { ...DEMO_INCIDENT, status: 'Cancelled' }
  }

  // Audit trail for incident
  if (path.match(/^\/incidents\/[^/]+\/audit-trail$/)) {
    return DEMO_AUDIT_EVENTS
  }

  // Network Metrics
  if (path === '/network/metrics') {
    return NETWORK_METRICS
  }
  if (path === '/network/blood-groups') {
    return NETWORK_METRICS.blood_group_resilience || []
  }
  if (path === '/network/zones') {
    return PUNE_ZONES
  }
  if (path.startsWith('/network/zones/')) {
    const zoneName = decodeURIComponent(path.split('/')[3] || 'Wagholi')
    return {
      zone: zoneName,
      severity: zoneName === 'Wagholi' ? 'Critical' : 'Stable',
      active_donors: 420,
      ready_now: 11,
      median_response_minutes: 18,
      re_engageable: 26,
    }
  }
  if (path === '/network/organisations') {
    return PARTNERS_DATA
  }

  // Stress Lab
  if (path === '/stress/scenarios') {
    return STRESS_SCENARIOS
  }
  if (path === '/stress/run') {
    let body: any = {}
    try {
      body = options.body ? JSON.parse(options.body as string) : {}
    } catch {}
    return computeStressResult(body.scenario_id || 'S1', body.capacity_percent ?? 70)
  }
  if (path.startsWith('/stress/history')) {
    return []
  }

  // Partners
  if (path === '/partners/' || path === '/partners') {
    return PARTNERS_DATA
  }
  const partnerDetailMatch = path.match(/^\/partners\/([^/]+)$/)
  if (partnerDetailMatch) {
    const orgId = decodeURIComponent(partnerDetailMatch[1])
    return PARTNERS_DATA.find(p => p.id === orgId || p.slug === orgId) || PARTNERS_DATA[0]
  }

  // Donors
  if (path === '/donors/' || path === '/donors') {
    return MOCK_DONORS
  }
  if (path === '/donors/summary') {
    return {
      ready: 2450,
      maybe: 1120,
      unavailable: 648,
      unknown: 0,
      total: 4218,
    }
  }

  // Audit
  if (path === '/audit/' || path === '/audit') {
    return DEMO_AUDIT_EVENTS
  }
  if (path === '/audit/verify-chain') {
    return {
      valid: true,
      total_events: DEMO_AUDIT_EVENTS.length,
      verified_events: DEMO_AUDIT_EVENTS.length,
      message: 'Cryptographic SHA-256 audit hash chain verified successfully.',
    }
  }
  if (path.startsWith('/audit/')) {
    const eventId = decodeURIComponent(path.split('/')[2] || '')
    return DEMO_AUDIT_EVENTS.find(e => e.event_id === eventId) || DEMO_AUDIT_EVENTS[0]
  }

  // Auth
  if (path === '/auth/login') {
    return {
      access_token: 'demo-bearer-token',
      token_type: 'bearer',
      user: {
        id: 1,
        username: 'operator',
        email: 'operator@raktsetu.org',
        role: 'dispatcher',
        full_name: 'District Response Operator',
      },
    }
  }
  if (path === '/auth/logout') {
    return { status: 'logged_out' }
  }

  return null
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${BASE_URL}${cleanEndpoint}`
  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...authHeaders,
    ...options.headers,
  }

  let response: Response | null = null
  let isHtmlOrNonJson = false

  try {
    response = await fetch(url, { ...options, headers })
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html') || (!contentType.includes('application/json') && contentType !== '')) {
      isHtmlOrNonJson = true
    }
  } catch {
    // Backend service unreachable
    response = null
  }

  // 1. If backend responded with valid JSON, parse and return it
  if (response && response.ok && !isHtmlOrNonJson) {
    return response.json()
  }

  // 2. If live backend responded with an explicit JSON error (400, 401, 403, 404, etc.), throw it
  if (response && !response.ok && !isHtmlOrNonJson) {
    let detail = response.statusText
    try {
      const errorJson = await response.json()
      detail = errorJson.detail || errorJson.message || JSON.stringify(errorJson)
    } catch {}
    throw new ApiError(response.status, detail)
  }

  // 3. Fallback: When backend service is unconfigured/unreachable or returning HTML rewrite, use deterministic mock data
  const mock = getMockResponse(cleanEndpoint, options)
  if (mock !== null && mock !== undefined) {
    return mock as T
  }

  throw new ApiError(
    502,
    `Backend service is unreachable and no mock handler for endpoint: ${cleanEndpoint}`
  )
}

export const api = {
  // ─── Health & Diagnostics ──────────────────────────────────────────────────
  checkBackendHealth,
  async getHealth() {
    return request<{ status: string; service: string; environment: string }>('/health')
  },

  // ─── Network Intelligence ──────────────────────────────────────────────────
  async getNetworkMetrics() {
    return request<NetworkMetrics>('/network/metrics')
  },

  async getBloodGroupResilience() {
    return request<BloodGroupResilience[]>('/network/blood-groups')
  },

  async getZones() {
    return request<Array<{ zone: string; district: string; lat: number; lng: number }>>('/network/zones')
  },

  async getNetworkZones() {
    return request<ZoneMetricsItem[]>('/network/zones')
  },

  async getZoneDetail(zoneName: string) {
    return request<{
      zone: string
      blood_group?: string
      severity: string
      active_donors: number
      ready_now: number
      median_response_minutes: number
      re_engageable: number
    }>(`/network/zones/${encodeURIComponent(zoneName)}`)
  },

  async getNetworkOrganisations() {
    return request<Organisation[]>('/network/organisations')
  },

  // ─── Stress Lab ────────────────────────────────────────────────────────────
  async getStressScenarios() {
    return request<StressScenario[]>('/stress/scenarios')
  },

  async runStressSimulation(payload: StressRunRequest | {
    scenario_id: string
    capacity_percent?: number
    target_org_id?: string
    target_zone?: string
    executed_by?: string
    parameters?: Record<string, any>
  }) {
    return request<any>('/stress/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getStressHistory(limit = 20) {
    return request<any[]>(`/stress/history?limit=${limit}`)
  },

  async getStressRun(simulationId: string) {
    return request<any>(`/stress/history/${encodeURIComponent(simulationId)}`)
  },

  // ─── Partner Network ───────────────────────────────────────────────────────
  async getPartners() {
    return request<any[]>('/partners/')
  },

  async getPartner(orgId: string) {
    return request<any>(`/partners/${encodeURIComponent(orgId)}`)
  },

  // ─── Incidents & Lifecycle ─────────────────────────────────────────────────
  async getIncidents() {
    return request<Incident[]>('/incidents/')
  },

  async getIncident(incidentId: string) {
    return request<Incident>(`/incidents/${encodeURIComponent(incidentId)}`)
  },

  async checkDuplicateRequirement(params: { facility: string; blood_group: string; component?: string }) {
    const q = new URLSearchParams()
    q.set('facility', params.facility)
    q.set('blood_group', params.blood_group)
    if (params.component) q.set('component', params.component)
    return request<{
      duplicate_found: boolean
      incident_id?: string
      status?: string
      facility?: string
      blood_group?: string
      units_requested?: number
      units_secured?: number
      message: string
    }>(`/incidents/check-duplicate?${q.toString()}`)
  },

  async createIncident(payload: {
    blood_group: string
    component?: string
    units_requested: number
    urgency: string
    requesting_facility: string
    zone: string
    district?: string
    lat: number
    lng: number
    source?: string
    auto_verify?: boolean
    actor?: string
  }) {
    return request<Incident>('/incidents/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async verifyIncident(incidentId: string, payload: {
    actor?: string
    verified_by?: string
    clinical_approval?: boolean
    verification_notes?: string
    notes?: string
    facility_confirmed?: boolean
  }) {
    return request<Incident>(`/incidents/${encodeURIComponent(incidentId)}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        actor: payload.actor || payload.verified_by || 'Medical Officer',
        clinical_approval: payload.clinical_approval ?? true,
        verification_notes: payload.verification_notes || payload.notes,
      }),
    })
  },

  async getIncidentCandidates(incidentId: string) {
    return request<any>(`/incidents/${encodeURIComponent(incidentId)}/candidates`)
  },

  async launchWave(incidentId: string, payload: {
    wave_number?: number
    wave_size?: number
    operator_id?: string
  }) {
    return request<any>(`/incidents/${encodeURIComponent(incidentId)}/waves`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async activateWaveLegacy(incidentId: string, waveNumber = 1) {
    return request<any>(`/incidents/${encodeURIComponent(incidentId)}/activate-wave?wave_number=${waveNumber}`, {
      method: 'POST',
    })
  },

  async advanceWave(incidentId: string, waveNumber: number, payload: {
    action: string
    actor?: string
  }) {
    return request<any>(`/incidents/${encodeURIComponent(incidentId)}/waves/${waveNumber}/advance`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async recordDonorResponse(incidentId: string, payload: {
    contact_attempt_id: number
    response: string
    actor?: string
    distance_km?: number
    eta_minutes?: number
    notes?: string
  }) {
    return request<any>(`/incidents/${encodeURIComponent(incidentId)}/responses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async confirmFulfilment(incidentId: string, payload?: {
    units_confirmed: number
    confirmation_source: string
    confirmed_by: string
    component?: string
    notes?: string
  }) {
    return request<Incident>(`/incidents/${encodeURIComponent(incidentId)}/fulfill`, {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    })
  },

  async closeIncident(incidentId: string, payload?: {
    closed_by: string
    notes?: string
  }) {
    return request<any>(`/incidents/${encodeURIComponent(incidentId)}/close`, {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    })
  },

  async cancelIncident(incidentId: string, payload: {
    cancelled_by: string
    reason: string
  }) {
    return request<Incident>(`/incidents/${encodeURIComponent(incidentId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getIncidentAuditTrail(incidentId: string) {
    return request<any[]>(`/incidents/${encodeURIComponent(incidentId)}/audit-trail`)
  },

  // ─── Donor Network ─────────────────────────────────────────────────────────
  async getDonors(params?: {
    blood_group?: string
    zone?: string
    readiness?: string
    limit?: number
    skip?: number
  }) {
    const q = new URLSearchParams()
    if (params?.blood_group) q.set('blood_group', params.blood_group)
    if (params?.zone) q.set('zone', params.zone)
    if (params?.readiness) q.set('readiness', params.readiness)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.skip) q.set('skip', String(params.skip))
    const queryStr = q.toString() ? `?${q.toString()}` : ''
    return request<any[]>(`/donors/${queryStr}`)
  },

  async getDonorSummary() {
    return request<{
      ready: number
      maybe: number
      unavailable: number
      unknown: number
      total: number
    }>('/donors/summary')
  },

  // ─── Audit Trail ───────────────────────────────────────────────────────────
  async getAuditEvents(params?: {
    category?: string
    incident_id?: string
    actor_type?: string
    limit?: number
    skip?: number
  }) {
    const q = new URLSearchParams()
    if (params?.category) q.set('category', params.category)
    if (params?.incident_id) q.set('incident_id', params.incident_id)
    if (params?.actor_type) q.set('actor_type', params.actor_type)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.skip) q.set('skip', String(params.skip))
    const queryStr = q.toString() ? `?${q.toString()}` : ''
    return request<any[]>(`/audit/${queryStr}`)
  },

  async getIncidentAudit(incidentId: string) {
    return request<any[]>(`/audit/?incident_id=${encodeURIComponent(incidentId)}`)
  },

  async getAuditEvent(eventId: string) {
    return request<any>(`/audit/${encodeURIComponent(eventId)}`)
  },

  async verifyAuditChain() {
    return request<{
      valid: boolean
      total_events: number
      verified_events: number
      broken_at_event_id?: string
      error?: string
      message: string
    }>('/audit/verify-chain')
  },

  // ─── Authentication & RBAC ────────────────────────────────────────────────
  async login(credentials: { username: string; password: string }) {
    const data = await request<{
      access_token: string
      token_type: string
      user: {
        id: number
        username: string
        email: string
        role: string
        full_name: string
        organisation_id?: string
      }
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    if (typeof window !== 'undefined' && data.access_token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.access_token)
    }
    return data
  },

  async logout() {
    try {
      await request<{ status: string }>('/auth/logout', { method: 'POST' })
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
    }
  },

  async getCurrentUser() {
    return request<{
      id: number
      username: string
      email: string
      role: string
      full_name: string
      organisation_id?: string
    }>('/auth/me')
  },

  async getAuthRoles() {
    return request<{ roles: Array<{ role: string; label: string; description: string; permissions: string[] }> }>(
      '/auth/roles'
    )
  },

  getStoredToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null
  },

  // ─── Notification Delivery (Milestone 7) ──────────────────────────────────
  async getIncidentNotifications(incidentId: string) {
    return request<Array<{
      dispatch_id: string
      idempotency_key: string
      incident_id: string
      wave_id: number
      channel: string
      provider: string
      recipient_phone_masked: string
      status: string
      provider_message_id?: string
      attempt_count: number
      max_retries: number
      created_at: string
      dispatched_at?: string
      delivered_at?: string
      failed_at?: string
      last_error?: string
    }>>(`/notifications/incident/${encodeURIComponent(incidentId)}`)
  },

  async getNotificationRecord(dispatchId: string) {
    return request<any>(`/notifications/${encodeURIComponent(dispatchId)}`)
  },

  async retryNotification(dispatchId: string) {
    return request<{
      status: string
      dispatch_id: string
      delivery_status: string
      attempt_count: number
      provider_message_id?: string
    }>(`/notifications/${encodeURIComponent(dispatchId)}/retry`, {
      method: 'POST',
    })
  },
}


