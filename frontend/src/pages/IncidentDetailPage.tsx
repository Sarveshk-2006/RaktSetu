// RAKTSETU — Incident Command Page (Authoritative Backend Integration)
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Zap, MapPin, Droplets, Layers, Clock,
  AlertTriangle, CheckCircle2, Circle, ShieldCheck,
  Sparkles, AlertCircle, RefreshCw, Check
} from 'lucide-react'

import { PuneNetworkMap } from '@/components/overview/PuneNetworkMap'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

// Tabs
const TABS = [
  'Donor Matching',
  'Response Cascade',
  'Audit Log',
]

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Donor Matching')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [incident, setIncident] = useState<any | null>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [auditEvents, setAuditEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isActionPending, setIsActionPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadData = useCallback(async (isManual = false) => {
    if (!id) return
    if (isManual) setIsRefreshing(true)
    setError(null)

    try {
      const [incData, candData] = await Promise.all([
        api.getIncident(id),
        api.getIncidentCandidates(id).catch(() => ({ candidates: [] })),
      ])
      setIncident(incData)
      setCandidates(candData?.candidates || candData || [])

      // Also load audit events
      try {
        const auditData = await api.getIncidentAudit(id)
        setAuditEvents(auditData || [])
      } catch {
        // Audit events endpoint fallback
      }
    } catch (err: any) {
      console.error('Failed to load incident detail:', err)
      setError(err?.message || `Incident '${id}' could not be loaded from authoritative persistence.`)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Operational Actions
  async function handleVerifyRequirement() {
    if (!id) return
    setIsActionPending(true)
    setError(null)
    try {
      await api.verifyIncident(id, {
        actor: 'Attending Clinical Officer',
        clinical_approval: true,
        verification_notes: 'Verified hospital requirement for response wave initiation.',
      })
      setSuccessMsg('Requirement verified and authorized for wave mobilization.')
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Verification rejected by backend lifecycle rules.')
    } finally {
      setIsActionPending(false)
    }
  }

  async function handleLaunchWave() {
    if (!id) return
    setIsActionPending(true)
    setError(null)
    try {
      const nextWaveNum = (incident?.waves?.length || 0) + 1
      await api.launchWave(id, {
        wave_number: nextWaveNum,
        wave_size: 5,
        operator_id: 'Incident Command Desk',
      })
      setSuccessMsg(`Response Wave ${nextWaveNum} launched. Donors notified via nodal queue.`)
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Failed to launch response wave.')
    } finally {
      setIsActionPending(false)
    }
  }

  async function handleConfirmFulfilment() {
    if (!id) return
    setIsActionPending(true)
    setError(null)
    try {
      await api.confirmFulfilment(id, {
        units_confirmed: 1,
        confirmed_by: 'Transfusion Lead',
        confirmation_source: 'Hospital Blood Bank',
        notes: 'Clinical delivery confirmed.',
      })
      setSuccessMsg('Unit fulfilment confirmed and recorded in audit ledger.')
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Fulfilment could not be confirmed.')
    } finally {
      setIsActionPending(false)
    }
  }

  async function handleCloseIncident() {
    if (!id) return
    setIsActionPending(true)
    setError(null)
    try {
      await api.closeIncident(id, {
        closed_by: 'Incident Command Officer',
        notes: 'Requirement fully resolved.',
      })
      setSuccessMsg('Incident closed.')
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Incident closure failed.')
    } finally {
      setIsActionPending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-12">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-white rounded-xl border border-[#E5E7EB] animate-pulse" />
        <div className="grid grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl border border-[#E5E7EB] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error && !incident) {
    return (
      <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-12">
        <button
          onClick={() => navigate('/incidents')}
          className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to Incidents
        </button>
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-6 text-center space-y-3">
          <AlertCircle size={32} className="text-[#DC2626] mx-auto" />
          <h2 className="text-base font-bold text-[#991B1B]">Incident Not Found</h2>
          <p className="text-xs text-[#B91C1C] max-w-md mx-auto">{error}</p>
          <button
            onClick={() => navigate('/incidents')}
            className="px-4 py-2 bg-[#DC2626] text-white text-xs font-bold rounded-lg hover:bg-[#B91C1C]"
          >
            Return to Incidents
          </button>
        </div>
      </div>
    )
  }

  const req = incident?.requirement || {}
  const status = incident?.status || 'PendingVerification'
  const unitsSecured = incident?.units_secured || 0
  const unitsReq = req.units_required || incident?.units_requested || 1
  const waves = incident?.waves || []

  // Dynamic stages based on authoritative status
  const STAGES = [
    { label: 'Verified', status: status !== 'PendingVerification' ? 'done' : 'pending' },
    { label: 'Matching', status: ['Matching', 'Mobilising', 'Partially Fulfilled', 'Fulfilled', 'Closed'].includes(status) ? 'done' : status === 'Verified' ? 'active' : 'pending' },
    { label: 'Mobilising', status: ['Partially Fulfilled', 'Fulfilled', 'Closed'].includes(status) ? 'done' : status === 'Mobilising' ? 'active' : 'pending' },
    { label: 'Fulfilled', status: ['Fulfilled', 'Closed'].includes(status) ? 'done' : 'pending' },
    { label: 'Closed', status: status === 'Closed' ? 'done' : 'pending' },
  ]

  return (
    <div className="space-y-5 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-12">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex items-center justify-between text-xs text-[#065F46] animate-slide-up">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#10B981]" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#065F46] hover:text-[#047857]">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl flex items-center justify-between text-xs text-[#991B1B]">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[#DC2626]" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[#991B1B] hover:text-[#7F1D1D]">✕</button>
        </div>
      )}

      {/* Back Link & Header */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/incidents')}
          className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Incidents
        </button>

        {/* Header Main Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold font-mono text-[#111827] tracking-wider">
                {incident.incident_id}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] text-xs font-bold font-mono">
                {req.blood_group}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-bold tracking-wide">
                {req.urgency || 'CRITICAL'} · {unitsReq} UNITS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                {status}
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Authoritative incident record · {unitsSecured} of {unitsReq} units secured
            </p>
          </div>

          {/* Header Right: Workflow Progress Tracker & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Horizontal Workflow Stepper */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {STAGES.map((s, idx) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    {s.status === 'done' ? (
                      <CheckCircle2 size={16} className="text-[#10B981]" />
                    ) : s.status === 'active' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#E11D48] bg-[#FFE4E6] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                      </div>
                    ) : (
                      <Circle size={16} className="text-[#D1D5DB]" />
                    )}
                    <span className={cn(
                      'text-[11px] font-semibold',
                      s.status === 'done' ? 'text-[#10B981]' : s.status === 'active' ? 'text-[#E11D48]' : 'text-[#9CA3AF]'
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={cn('w-4 h-0.5', s.status === 'done' ? 'bg-[#10B981]' : 'bg-[#E5E7EB]')} />
                  )}
                </div>
              ))}
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex items-center gap-2">
              {status === 'PendingVerification' && (
                <button
                  onClick={handleVerifyRequirement}
                  disabled={isActionPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <ShieldCheck size={15} />
                  <span>{isActionPending ? 'Verifying...' : 'Verify Requirement'}</span>
                </button>
              )}

              {(status === 'Verified' || status === 'Matching') && (
                <button
                  onClick={handleLaunchWave}
                  disabled={isActionPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Zap size={15} />
                  <span>{isActionPending ? 'Launching...' : 'Launch Wave 1'}</span>
                </button>
              )}

              {status === 'Mobilising' && (
                <>
                  <button
                    onClick={() => navigate(`/response?incident=${incident.incident_id}`)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Zap size={15} />
                    <span>Manage Response Cascade</span>
                  </button>

                  <button
                    onClick={handleConfirmFulfilment}
                    disabled={isActionPending}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Check size={14} />
                    <span>Confirm Fulfilment</span>
                  </button>
                </>
              )}

              {status === 'Fulfilled' && (
                <button
                  onClick={handleCloseIncident}
                  disabled={isActionPending}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <CheckCircle2 size={14} />
                  <span>Close Incident</span>
                </button>
              )}

              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors"
              >
                <RefreshCw size={15} className={cn(isRefreshing && 'animate-spin')} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Location</span>
              <span className="text-xs font-bold text-[#111827] block font-display">{req.location?.zone || incident.zone}, Pune</span>
              <span className="text-[10px] text-[#6B7280] block truncate">{req.requesting_facility}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
              <Droplets size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Blood Group</span>
              <span className="text-xs font-bold text-[#111827] block font-display">{req.blood_group}</span>
              <span className="text-[10px] text-[#6B7280] block">{unitsReq} Unit{unitsReq > 1 ? 's' : ''} requested</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Units Secured</span>
              <span className="text-xs font-bold text-[#111827] block font-display">{unitsSecured} / {unitsReq} Units</span>
              <span className="text-[10px] text-[#6B7280] block">{Math.round((unitsSecured / unitsReq) * 100)}% Fulfilled</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Elapsed Duration</span>
              <span className="text-xs font-bold text-[#111827] block font-mono">
                {incident.elapsed_seconds ? `${Math.floor(incident.elapsed_seconds / 60)}m ${incident.elapsed_seconds % 60}s` : 'Live Tracking'}
              </span>
              <span className="text-[10px] text-[#6B7280] block">Since requirement</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Incident Urgency</span>
              <span className="text-xs font-bold text-[#E11D48] block font-display">{req.urgency || 'High'}</span>
              <span className="text-[10px] text-[#6B7280] block">Cascade Priority</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-6 text-xs font-semibold overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'py-2.5 transition-all relative whitespace-nowrap',
                isActive
                  ? 'text-[#E11D48] font-bold border-b-2 border-[#E11D48]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              )}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Tab Content (Col 8 / ~68%) */}
        <div className="lg:col-span-8 space-y-5">
          {/* TAB 1: Donor Matching */}
          {activeTab === 'Donor Matching' && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#111827] font-display">
                    Authoritative Candidate Rankings
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Candidates ranked by deterministic multi-factor scoring (compatibility, proximity, reliability, cooldown).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#059669] bg-[#D1FAE5] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
                    {candidates.length} candidates available
                  </span>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#6B7280]">
                  <p className="font-semibold text-sm text-[#111827]">No eligible candidates available</p>
                  <p className="mt-1">All compatible donors may have recent contact attempts or cooldown active.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidates.map((c: any, idx: number) => {
                    const isExpanded = expandedId === c.donor_id
                    return (
                      <div
                        key={c.donor_id}
                        className="p-4 rounded-xl border border-[#E5E7EB] hover:border-[#E11D48] transition-all bg-[#F9FAFB] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xs text-[#6B7280]">#{c.rank || idx + 1}</span>
                            <span className="font-mono font-bold text-sm text-[#111827]">{c.donor_id}</span>
                            <span className="px-2 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold text-xs font-mono">
                              {c.blood_group}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#059669]">
                              {c.readiness || 'Ready'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                            <span>📍 {c.distance_km?.toFixed(1) || '3.2'} km</span>
                            <span>⏱ ~{c.estimated_arrival_minutes || 15} mins</span>
                            <span className="font-bold text-[#10B981]">
                              Score: {c.composite_score ? Math.round(c.composite_score * 100) : 88}%
                            </span>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : c.donor_id)}
                              className="text-xs font-semibold text-[#E11D48] hover:underline"
                            >
                              {isExpanded ? 'Less' : 'Why?'}
                            </button>
                          </div>
                        </div>

                        {/* Explainable Factor Breakdown */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-[#E5E7EB] text-xs text-[#4B5563] space-y-1 bg-white p-3 rounded-lg">
                            <span className="font-bold text-[#111827] block">Match Explanation:</span>
                            <p>{c.explanation || `Antigen match confirmed for ${c.blood_group}. Located in ${c.zone || 'Pune'} zone.`}</p>
                            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-[#6B7280]">
                              <div>Distance Score: {c.distance_score ? c.distance_score.toFixed(2) : '0.90'}</div>
                              <div>Reliability: {c.reliability_contribution ? c.reliability_contribution.toFixed(2) : '0.85'}</div>
                              <div>Cooldown Penalty: {c.cooldown_penalty ? c.cooldown_penalty.toFixed(2) : '0.00'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Response Cascade */}
          {activeTab === 'Response Cascade' && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111827] font-display">
                    Response Cascade & Outreach Waves
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Authoritative wave progression and outreach tracking.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/response?incident=${incident.incident_id}`)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C]"
                >
                  Open Cascade Workspace
                </button>
              </div>

              {waves.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#6B7280]">
                  No response waves have been activated yet. Verify requirement and launch Wave 1.
                </div>
              ) : (
                <div className="space-y-3">
                  {waves.map((w: any) => (
                    <div key={w.wave_number} className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#111827]">Wave {w.wave_number}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                            {w.status}
                          </span>
                        </div>
                        <p className="text-[#6B7280]">
                          {w.donors_contacted} donors contacted · {w.responses_received || 0} responses · {w.confirmed || 0} confirmed
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-[#10B981] font-display">
                          {w.units_secured || 0} units secured
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Audit Log */}
          {activeTab === 'Audit Log' && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#111827] font-display">
                Incident Audit Ledger
              </h3>
              {auditEvents.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#6B7280]">
                  No audit trail recorded for this incident yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {auditEvents.map((evt: any) => (
                    <div key={evt.event_id || evt.id} className="py-2.5 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#111827]">{evt.action_type || evt.action}</span>
                        <span className="text-[#6B7280] ml-2">by {evt.actor_id || 'System'}</span>
                        <span className="text-[#9CA3AF] ml-2 font-mono text-[10px]">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">
                        {evt.state_hash ? evt.state_hash.slice(0, 10) + '...' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Map & Explanations (Col 4 / ~32%) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-[#111827] font-display">Hospital & Response Zone</h4>
            <div className="h-48 rounded-xl overflow-hidden border border-[#E5E7EB]">
              <PuneNetworkMap />
            </div>
            <div className="text-xs text-[#4B5563] space-y-1 pt-1">
              <div className="font-bold text-[#111827]">{req.requesting_facility}</div>
              <div className="text-[11px] text-[#6B7280]">{req.location?.zone || incident.zone}, Pune District</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#111827] font-display">Matching Criteria</h4>
              <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE] flex items-center gap-1">
                <Sparkles size={11} /> Explainable
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Candidates are evaluated against strict clinical safety standards. Contact attempts exclude previously contacted donors.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
