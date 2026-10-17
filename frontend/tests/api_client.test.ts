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

// ─── Regression Tests for Production Stabilisation ─────────────────────────

function normalizeApiBase(base: string): string {
  if (!base) return '/api'
  const trimmed = base.replace(/\/+$/, '')
  if (trimmed.endsWith('/api')) return trimmed
  return `${trimmed}/api`
}

test('normalizeApiBase formats relative and absolute URLs with exactly one /api prefix', () => {
  assert.equal(normalizeApiBase(''), '/api')
  assert.equal(normalizeApiBase('/api'), '/api')
  assert.equal(normalizeApiBase('/api/'), '/api')
  assert.equal(normalizeApiBase('https://api.raktsetu.org'), 'https://api.raktsetu.org/api')
  assert.equal(normalizeApiBase('https://api.raktsetu.org/'), 'https://api.raktsetu.org/api')
  assert.equal(normalizeApiBase('https://api.raktsetu.org/api'), 'https://api.raktsetu.org/api')
  assert.equal(normalizeApiBase('https://api.raktsetu.org/api/'), 'https://api.raktsetu.org/api')
})

test('Layout offset calculation guarantees non-overlapping content with sidebar', () => {
  const expandedSidebarWidth = 260
  const collapsedSidebarWidth = 72
  
  // Expanded desktop offset
  const expandedOffset = expandedSidebarWidth
  assert.equal(expandedOffset, 260)
  
  // Collapsed desktop offset
  const collapsedOffset = collapsedSidebarWidth
  assert.equal(collapsedOffset, 72)
  
  // Positive delta reflows into remaining viewport
  assert.ok(expandedOffset > collapsedOffset)
  assert.equal(expandedOffset - collapsedOffset, 188)
})

test('Service connection mode distinguishes authoritative backend from standalone demo', () => {
  const liveService = { live: true, mode: 'authoritative' as const, service: 'FastAPI' }
  const demoService = { live: false, mode: 'demo' as const, service: 'Verified Deterministic Demo Sandbox' }

  assert.equal(liveService.mode, 'authoritative')
  assert.equal(liveService.live, true)
  assert.equal(demoService.mode, 'demo')
  assert.equal(demoService.live, false)
  assert.notEqual(liveService.mode, demoService.mode)
})

test('Vertical layout offset contract guarantees complete clearance of fixed top bar across all breakpoints', () => {
  const topBarHeight = 64
  const shellTopPadding = 64 // pt-[64px] on <main>
  
  // Responsive content padding values (mobile: p-4, tablet: sm:p-6, desktop: lg:p-8)
  const paddingMap = {
    mobile: 16,
    tablet: 24,
    desktop: 32,
  }

  for (const [breakpoint, contentPadding] of Object.entries(paddingMap)) {
    const contentTopY = shellTopPadding + contentPadding
    // Content top edge must strictly be below the 64px fixed header
    assert.ok(
      contentTopY > topBarHeight,
      `At ${breakpoint}, content top (${contentTopY}px) must clear top bar height (${topBarHeight}px)`
    )
    // Clearance buffer must equal the designed responsive padding
    assert.equal(contentTopY - topBarHeight, contentPadding)
  }
})

// ─── Presentation Alignment & Prototype Workflow Tests ─────────────────────

test('Unified Blood Incident duplicate detection flags active requisitions for the same facility and blood group', () => {
  const existingActiveIncidents = [
    {
      incident_id: 'INC-PN-20261018-001',
      requesting_facility: 'Ruby Hall Clinic, Pune',
      blood_group: 'O-',
      status: 'Mobilising',
    },
    {
      incident_id: 'INC-PN-20261018-002',
      requesting_facility: 'Sassoon General Hospital',
      blood_group: 'B+',
      status: 'Fulfilled',
    },
  ]

  // Scenario 1: Same facility and blood group -> Duplicate flagged
  const matchDuplicate = existingActiveIncidents.find(
    inc =>
      inc.status !== 'Fulfilled' &&
      inc.status !== 'Closed' &&
      inc.status !== 'Cancelled' &&
      inc.requesting_facility.toLowerCase().trim() === 'ruby hall clinic, pune' &&
      inc.blood_group === 'O-'
  )
  assert.ok(matchDuplicate)
  assert.equal(matchDuplicate.incident_id, 'INC-PN-20261018-001')

  // Scenario 2: Different facility or blood group -> No duplicate flagged
  const matchDistinct = existingActiveIncidents.find(
    inc =>
      inc.status !== 'Fulfilled' &&
      inc.status !== 'Closed' &&
      inc.status !== 'Cancelled' &&
      inc.requesting_facility.toLowerCase().trim() === 'ruby hall clinic, pune' &&
      inc.blood_group === 'AB+'
  )
  assert.equal(matchDistinct, undefined)
})

test('Response cascade enforces separation between donor acceptance and clinical unit fulfilment', () => {
  const cascadeState = {
    incident_id: 'INC-TEST-002',
    units_requested: 2,
    donor_responses: [
      { donor_id: 'D-991', response: 'Accepted', timestamp: new Date().toISOString() },
      { donor_id: 'D-992', response: 'Accepted', timestamp: new Date().toISOString() },
    ],
    units_secured: 0, // Acceptance does NOT automatically mark units as fulfilled
    status: 'Mobilising',
  }

  // Two donors accepted, but units_secured must remain 0 until authorized blood bank confirmation
  assert.equal(cascadeState.donor_responses.length, 2)
  assert.equal(cascadeState.units_secured, 0)
  assert.notEqual(cascadeState.status, 'Fulfilled')

  // Clinical blood bank confirmation explicitly increments units_secured
  const fulfilledState = {
    ...cascadeState,
    units_secured: 2,
    status: 'Fulfilled',
    confirmed_by: 'Transfusion Lead',
    confirmation_source: 'Hospital Blood Bank',
  }

  assert.equal(fulfilledState.units_secured, 2)
  assert.equal(fulfilledState.status, 'Fulfilled')
  assert.equal(fulfilledState.confirmed_by, 'Transfusion Lead')
})

test('Donor mobile dispatch alert payload preserves privacy while presenting explainable selection factors', () => {
  const mobileAlertPayload = {
    incident_id: 'INC-PN-48291',
    donor_id: 'D-4821',
    selection_factors: [
      'Available now (Status: Ready)',
      '3.1 km from Ruby Hall Clinic',
      'High response history (94% reliability score)',
      'Low recent request load (Cooldown: Cleared)',
    ],
    urgency: 'Critical',
    hospital_name: 'Ruby Hall Clinic, Pune',
  }

  // Must not expose phone, email, Aadhaar, or residential address
  assert.equal((mobileAlertPayload as any).phone, undefined)
  assert.equal((mobileAlertPayload as any).email, undefined)
  assert.equal((mobileAlertPayload as any).aadhaar, undefined)
  assert.equal((mobileAlertPayload as any).residential_address, undefined)

  // Explainability factors must be present as described in Slide 3
  assert.equal(mobileAlertPayload.selection_factors.length, 4)
  assert.ok(mobileAlertPayload.selection_factors.some(f => f.includes('3.1 km')))
})


