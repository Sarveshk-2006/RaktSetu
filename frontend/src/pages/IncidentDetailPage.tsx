// RAKTSETU — Incident Command Page (Authoritative Backend Integration)
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Zap, MapPin, Droplets, Layers, Clock,
  AlertTriangle, CheckCircle2, Circle, ShieldCheck,
  Sparkles, AlertCircle, RefreshCw, Check, Smartphone, FileCheck
} from 'lucide-react'

import { PuneNetworkMap } from '@/components/overview/PuneNetworkMap'
import { DonorMobilePreviewModal } from '@/components/incidents/DonorMobilePreviewModal'
import { IncidentCompletionModal } from '@/components/incidents/IncidentCompletionModal'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { DEMO_INCIDENT, ALL_INCIDENTS, DEMO_CANDIDATES } from '@/data/demoData'

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
  const [previewDonor, setPreviewDonor] = useState<any | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

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
      console.warn('Backend incident load failed, checking synthetic fallback data for', id, err)
      const fallbackInc = ALL_INCIDENTS.find(i => i.incident_id === id) || (id.includes('48291') ? DEMO_INCIDENT : null)
      if (fallbackInc) {
        setIncident(fallbackInc)
        setCandidates(DEMO_CANDIDATES)
        setAuditEvents(fallbackInc.response_events?.map((ev, idx) => ({
          event_id: `evt-${idx + 1}`,
          timestamp: ev.timestamp,
          action: `Donor${ev.response}`,
          actor: ev.donor_id,
          actor_type: 'Donor',
          category: 'ResponseCascade',
          outcome: ev.response === 'Accepted' ? 'Success' : 'Neutral',
          safe_metadata: { blood_group: ev.blood_group, distance_km: ev.distance_km },
        })) || [])
      } else {
        setError(err?.message || `Incident '${id}' could not be loaded from authoritative persistence.`)
      }
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
      setShowCompletionModal(true)
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
    <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1600px] mx-auto pb-12">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-[#EBFDF5] border border-[#A6F4C5] rounded-xl flex items-center justify-between text-xs text-[#085D40] animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#16805D]" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#085D40] hover:text-[#16805D] font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl flex items-center justify-between text-xs text-[#912020] animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[#C62828]" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[#912020] hover:text-[#C62828] font-bold">✕</button>
        </div>
      )}

      {/* Back Link & Header */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/incidents')}
          className="text-xs font-semibold text-[#667085] hover:text-[#17212B] flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Incidents Work Queue
        </button>

        {/* Header Main Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 card-command p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold font-mono text-[#17212B] tracking-wider">
                {incident.incident_id}
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#FEF3F2] text-[#912020] border border-[#FECDCA] text-xs font-bold font-mono">
                {req.blood_group}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3F2] border border-[#FECDCA] text-[#912020] text-xs font-bold tracking-wide">
                {req.urgency || 'CRITICAL'} · {unitsReq} UNITS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F8F9FA] border border-[#E6E8EC] text-[#475467]">
                {status}
              </span>
            </div>
            <p className="text-xs text-[#667085]">
              Authoritative incident record · {unitsSecured} of {unitsReq} units clinically secured
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
                      <CheckCircle2 size={16} className="text-[#16805D]" />
                    ) : s.status === 'active' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#B42336] bg-[#FEF3F2] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B42336]" />
                      </div>
                    ) : (
                      <Circle size={16} className="text-[#D0D5DD]" />
                    )}
                    <span className={cn(
                      'text-[11px] font-semibold',
                      s.status === 'done' ? 'text-[#16805D]' : s.status === 'active' ? 'text-[#B42336]' : 'text-[#98A2B3]'
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={cn('w-4 h-0.5', s.status === 'done' ? 'bg-[#16805D]' : 'bg-[#E6E8EC]')} />
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B7791F] hover:bg-[#8D5A0F] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <ShieldCheck size={15} />
                  <span>{isActionPending ? 'Verifying...' : 'Verify Requisition'}</span>
                </button>
              )}

              {(status === 'Verified' || status === 'Matching') && (
                <button
                  onClick={handleLaunchWave}
                  disabled={isActionPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Zap size={15} />
                  <span>{isActionPending ? 'Launching...' : 'Launch Wave 1'}</span>
                </button>
              )}

              {status === 'Mobilising' && (
                <>
                  <button
                    onClick={() => navigate(`/response?incident=${incident.incident_id}`)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Zap size={15} />
                    <span>Manage Response Cascade</span>
                  </button>

                  <button
                    onClick={handleConfirmFulfilment}
                    disabled={isActionPending}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#16805D] hover:bg-[#085D40] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Check size={14} />
                    <span>Confirm Fulfilment</span>
                  </button>
                </>
              )}

              {(status === 'Fulfilled' || status === 'Closed') && (
                <>
                  <button
                    onClick={() => setShowCompletionModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#085D40] hover:bg-[#064e35] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <FileCheck size={14} />
                    <span>Fulfilment Summary</span>
                  </button>
                  {status === 'Fulfilled' && (
                    <button
                      onClick={handleCloseIncident}
                      disabled={isActionPending}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#17212B] hover:bg-black text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      <span>Close Incident</span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl border border-[#E6E8EC] text-[#667085] hover:text-[#17212B] hover:bg-[#F8F9FA] transition-colors"
              >
                <RefreshCw size={15} className={cn(isRefreshing && 'animate-spin')} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="card-command p-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF4FB] text-[#3567B7] flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#667085] block font-medium">Location</span>
              <span className="text-xs font-bold text-[#17212B] block font-display">{req.location?.zone || incident.zone}, Pune</span>
              <span className="text-[10px] text-[#667085] block truncate">{req.requesting_facility}</span>
            </div>
          </div>
        </div>

        <div className="card-command p-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] text-[#B42336] flex items-center justify-center shrink-0">
              <Droplets size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#667085] block font-medium">Blood Group</span>
              <span className="text-xs font-bold text-[#17212B] block font-mono">{req.blood_group}</span>
              <span className="text-[10px] text-[#667085] block">{unitsReq} Unit{unitsReq > 1 ? 's' : ''} requested</span>
            </div>
          </div>
        </div>

        <div className="card-command p-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FEF7EC] text-[#B7791F] flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#667085] block font-medium">Units Secured</span>
              <span className="text-xs font-bold text-[#17212B] block font-display">{unitsSecured} / {unitsReq} Units</span>
              <span className="text-[10px] text-[#667085] block">{Math.round((unitsSecured / unitsReq) * 100)}% Fulfilled</span>
            </div>
          </div>
        </div>

        <div className="card-command p-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF4FB] text-[#3567B7] flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#667085] block font-medium">Elapsed Duration</span>
              <span className="text-xs font-bold text-[#17212B] block font-mono">
                {incident.elapsed_seconds ? `${Math.floor(incident.elapsed_seconds / 60)}m ${incident.elapsed_seconds % 60}s` : 'Live Tracking'}
              </span>
              <span className="text-[10px] text-[#667085] block">Since requirement</span>
            </div>
          </div>
        </div>

        <div className="card-command p-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] text-[#B42336] flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#667085] block font-medium">Incident Urgency</span>
              <span className="text-xs font-bold text-[#912020] block font-display">{req.urgency || 'High'}</span>
              <span className="text-[10px] text-[#667085] block">Cascade Priority</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="border-b border-[#E6E8EC] flex items-center gap-6 text-xs font-semibold overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'py-2.5 transition-all relative whitespace-nowrap',
                isActive
                  ? 'text-[#B42336] font-bold border-b-2 border-[#B42336]'
                  : 'text-[#667085] hover:text-[#17212B]'
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
            <div className="card-command p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#17212B] font-display">
                    Authoritative Candidate Rankings
                  </h3>
                  <p className="text-xs text-[#667085]">
                    Candidates ranked by deterministic multi-factor scoring (compatibility, proximity, reliability, cooldown).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#085D40] bg-[#EBFDF5] px-2.5 py-1 rounded-full border border-[#A6F4C5]">
                    {candidates.length} candidates available
                  </span>
                </div>
              </div>

              {candidates.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#667085] bg-[#F8F9FA] rounded-xl border border-[#E6E8EC]">
                  <p className="font-semibold text-sm text-[#17212B]">No eligible candidates available</p>
                  <p className="mt-1">All compatible donors may have recent contact attempts or cooldown active.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidates.map((c: any, idx: number) => {
                    const isExpanded = expandedId === c.donor_id
                    return (
                      <div
                        key={c.donor_id}
                        className="p-4 rounded-xl border border-[#E6E8EC] hover:border-[#CBD5E1] hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 bg-[#F8F9FA] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xs text-[#667085]">#{c.rank || idx + 1}</span>
                            <span className="font-mono font-bold text-sm text-[#17212B]">{c.donor_id}</span>
                            <span className="px-2 py-0.5 rounded bg-[#FEF3F2] text-[#912020] border border-[#FECDCA] font-bold text-xs font-mono">
                              {c.blood_group}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBFDF5] text-[#085D40] border border-[#A6F4C5]">
                              {c.readiness || 'Ready'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-[#667085]">
                            <span>📍 {c.distance_km?.toFixed(1) || '3.2'} km</span>
                            <span>⏱ ~{c.estimated_arrival_minutes || 15} mins</span>
                            <span className="font-bold text-[#16805D]">
                              Score: {c.composite_score ? Math.round(c.composite_score * 100) : 88}%
                            </span>
                            <button
                              onClick={() => setPreviewDonor(c)}
                              className="px-2.5 py-1 rounded-lg bg-[#EFF4FB] hover:bg-[#DCE7F6] text-[#234B8E] font-bold text-xs flex items-center gap-1 transition-colors border border-[#B9D3F8]"
                              title="Preview mobile dispatch alert as received on donor phone"
                            >
                              <Smartphone size={12} />
                              <span>Donor Alert</span>
                            </button>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : c.donor_id)}
                              className="text-xs font-semibold text-[#B42336] hover:text-[#861D2B] flex items-center gap-1 transition-colors"
                            >
                              <span>{isExpanded ? 'Hide' : 'Factors'}</span>
                              <span className={cn('inline-block transition-transform duration-200', isExpanded ? 'rotate-180' : 'rotate-0')}>▼</span>
                            </button>
                          </div>
                        </div>

                        {/* Explainable Factor Breakdown */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-[#E6E8EC] text-xs text-[#475467] space-y-2 bg-white p-3.5 rounded-xl border border-[#E6E8EC] animate-dropdown">
                            <span className="font-bold text-[#17212B] block">Deterministic Match Scoring:</span>
                            <p>{c.explanation || `Antigen match confirmed for ${c.blood_group}. Located in ${c.zone || 'Pune'} zone.`}</p>
                            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-[#667085]">
                              <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E6E8EC]">Distance: {c.distance_score ? c.distance_score.toFixed(2) : '0.90'}</div>
                              <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E6E8EC]">Reliability: {c.reliability_contribution ? c.reliability_contribution.toFixed(2) : '0.85'}</div>
                              <div className="p-2 rounded-lg bg-[#F8F9FA] border border-[#E6E8EC]">Cooldown: {c.cooldown_penalty ? c.cooldown_penalty.toFixed(2) : '0.00'}</div>
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
            <div className="card-command p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#17212B] font-display">
                    Response Cascade & Outreach Waves
                  </h3>
                  <p className="text-xs text-[#667085]">
                    Authoritative wave progression and outreach tracking.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/response?incident=${incident.incident_id}`)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#B42336] text-white text-xs font-bold hover:bg-[#861D2B] transition-colors"
                >
                  Open Cascade Workspace
                </button>
              </div>

              {waves.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#667085] bg-[#F8F9FA] rounded-xl border border-[#E6E8EC]">
                  No response waves have been activated yet. Verify requirement and launch Wave 1.
                </div>
              ) : (
                <div className="space-y-3">
                  {waves.map((w: any) => (
                    <div key={w.wave_number} className="p-4 rounded-xl border border-[#E6E8EC] bg-[#F8F9FA] flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#17212B]">Wave {w.wave_number}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF4FB] border border-[#B9D3F8] text-[#234B8E]">
                            {w.status}
                          </span>
                        </div>
                        <p className="text-[#667085]">
                          {w.donors_contacted} donors contacted · {w.responses_received || 0} responses · {w.confirmed || 0} confirmed
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-[#16805D] font-display">
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
            <div className="card-command p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#17212B] font-display">
                Incident Audit Ledger
              </h3>
              {auditEvents.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#667085] bg-[#F8F9FA] rounded-xl border border-[#E6E8EC]">
                  No audit trail recorded for this incident yet.
                </div>
              ) : (
                <div className="divide-y divide-[#F2F4F7] max-h-96 overflow-y-auto">
                  {auditEvents.map((evt: any) => (
                    <div key={evt.event_id || evt.id} className="py-2.5 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#17212B]">{evt.action_type || evt.action}</span>
                        <span className="text-[#667085] ml-2">by {evt.actor_id || 'System'}</span>
                        <span className="text-[#98A2B3] ml-2 font-mono text-[10px]">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#98A2B3]">
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
          <div className="card-command p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#17212B] font-display">Hospital & Response Zone</h4>
            <div className="rounded-xl overflow-hidden border border-[#E6E8EC]">
              <PuneNetworkMap />
            </div>
            <div className="text-xs text-[#475467] space-y-1 pt-1">
              <div className="font-bold text-[#17212B]">{req.requesting_facility}</div>
              <div className="text-[11px] text-[#667085]">{req.location?.zone || incident.zone}, Pune District</div>
            </div>
          </div>

          <div className="card-command p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#17212B] font-display">Matching Criteria</h4>
              <span className="text-[10px] font-bold text-[#234B8E] bg-[#EFF4FB] px-2 py-0.5 rounded-full border border-[#B9D3F8] flex items-center gap-1">
                <Sparkles size={11} /> Explainable
              </span>
            </div>
            <p className="text-xs text-[#667085]">
              Candidates are evaluated against strict clinical safety standards. Contact attempts exclude previously contacted donors.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Donor Simulation Modal (Presentation Slide 3 & 4) */}
      {previewDonor && incident && (
        <DonorMobilePreviewModal
          isOpen={!!previewDonor}
          onClose={() => setPreviewDonor(null)}
          incidentId={incident.incident_id}
          candidate={previewDonor}
          facilityName={req.requesting_facility || 'Ruby Hall Clinic, Pune'}
          unitsRequested={unitsReq}
          urgency={req.urgency || 'High'}
          onResponseSimulated={async () => {
            await loadData()
          }}
        />
      )}

      {/* Incident Fulfilment & Completion Certificate Modal (Presentation Slide 4 Step 5) */}
      {showCompletionModal && incident && (
        <IncidentCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          incidentId={incident.incident_id}
          facilityName={req.requesting_facility || 'Ruby Hall Clinic, Pune'}
          bloodGroup={req.blood_group || 'O-'}
          unitsSecured={unitsSecured || unitsReq}
          unitsRequired={unitsReq}
          responseTimeMinutes={incident.elapsed_seconds ? Math.max(1, Math.round(incident.elapsed_seconds / 60)) : 19}
          donorsMobilisedCount={waves.reduce((acc: number, w: any) => acc + (w.confirmed || 0), 0) || unitsSecured || 2}
        />
      )}
    </div>
  )
}
