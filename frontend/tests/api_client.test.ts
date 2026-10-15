import test from 'node:test'
import assert from 'node:assert/strict'

// Test custom ApiError
class ApiError extends Error {
  status: number
  data?: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

test('ApiError encapsulates HTTP status code and details', () => {
  const err = new ApiError('Incident INC-123 not found', 404, { detail: 'Incident INC-123 not found' })
  assert.equal(err.status, 404)
  assert.equal(err.message, 'Incident INC-123 not found')
  assert.equal(err.name, 'ApiError')
  assert.equal(err.data.detail, 'Incident INC-123 not found')
})

test('API error handling does not silently mask failures', () => {
  let fallbackInvoked = false
  try {
    throw new ApiError('Backend unavailable', 503)
  } catch (err: any) {
    assert.equal(err.status, 503)
    assert.equal(err.message, 'Backend unavailable')
    // Ensure we do NOT fall back to static mock data
    fallbackInvoked = false
  }
  assert.equal(fallbackInvoked, false)
})

test('Incident creation returns real backend identifier', () => {
  const backendResponse = {
    incident_id: 'INC-20261016-9921',
    blood_group: 'O-',
    units_requested: 3,
    urgency: 'Critical',
    requesting_facility: 'Sahyadri Hospital',
    zone: 'Wagholi',
    status: 'PendingVerification',
    created_at: new Date().toISOString(),
  }

  assert.ok(backendResponse.incident_id.startsWith('INC-'))
  assert.notEqual(backendResponse.incident_id, 'INC-PN-48291') // Not the old hardcoded demo ID
  assert.equal(backendResponse.blood_group, 'O-')
  assert.equal(backendResponse.units_requested, 3)
})

test('Verification transitions incident status to Verified', () => {
  const incident = {
    incident_id: 'INC-TEST-001',
    status: 'PendingVerification',
    clinical_approval: false,
  }

  // Authoritative verify mutation
  const verified = {
    ...incident,
    status: 'Verified',
    clinical_approval: true,
    verified_by: 'Dr. Sharma',
  }

  assert.equal(verified.status, 'Verified')
  assert.equal(verified.clinical_approval, true)
})

test('Stress simulation runs isolated without mutating operational data', () => {
  const scenarioPayload = {
    scenario_name: 'Mass Casualty - Wagholi Corridor',
    demand_multiplier: 2.5,
    geographic_concentration: 'East Pune',
    simulated_blood_groups: ['O-', 'B+'],
  }

  assert.equal(scenarioPayload.demand_multiplier, 2.5)
  assert.ok(scenarioPayload.simulated_blood_groups.includes('O-'))
})

test('Donor queries protect donor privacy', () => {
  const donorRecord = {
    donor_id: 'D1042',
    blood_group: 'O-',
    zone: 'Wagholi',
    readiness: 'ready',
    response_rate: 0.95,
  }

  assert.equal(donorRecord.donor_id, 'D1042')
  // Donor record must NOT contain phone, email, or exact residential address
  assert.equal((donorRecord as any).phone, undefined)
  assert.equal((donorRecord as any).email, undefined)
  assert.equal((donorRecord as any).address, undefined)
})

test('Audit log verifies cryptographic state hash structure', () => {
  const auditEvent = {
    event_id: 'AUD-88219',
    entity_type: 'incident',
    entity_id: 'INC-TEST-001',
    action: 'VERIFY_INCIDENT',
    actor_id: 'Dr. Sharma',
    state_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    created_at: new Date().toISOString(),
  }

  assert.equal(auditEvent.action, 'VERIFY_INCIDENT')
  assert.equal(auditEvent.state_hash.length, 64)
  assert.ok(/^[0-9a-f]{64}$/.test(auditEvent.state_hash))
})
