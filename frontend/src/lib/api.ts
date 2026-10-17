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

const rawBase = import.meta.env.VITE_API_BASE_URL || '/api'
const normalizedBase = rawBase.replace(/\/+$/, '')
const BASE_URL = normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`
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

  let response: Response
  try {
    response = await fetch(url, { ...options, headers })
  } catch (err: any) {
    throw new ApiError(
      0,
      `Network connection failed. Unable to connect to backend service at ${url}. ${err?.message || ''}`
    )
  }

  if (!response.ok) {
    let detail = response.statusText
    try {
      const errorJson = await response.json()
      detail = errorJson.detail || errorJson.message || JSON.stringify(errorJson)
    } catch {
      // response is not JSON
    }
    throw new ApiError(response.status, detail)
  }

  return response.json()
}

export const api = {
  // ─── Health & Diagnostics ──────────────────────────────────────────────────
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


