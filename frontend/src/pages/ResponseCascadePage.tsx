// RAKTSETU — Response Cascade Workspace Page (Authoritative Backend Integration)
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Zap, CheckCircle2, ShieldCheck, Phone,
  MapPin, Building2, ArrowRight,
  RefreshCw, Users, AlertCircle, ArrowLeft,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

export function ResponseCascadePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const incidentIdParam = searchParams.get('incident') || 'INC-PUNE-001'

  const [incident, setIncident] = useState<any | null>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isActionPending, setIsActionPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true)
    setError(null)
    try {
      const [incData, candData] = await Promise.all([
        api.getIncident(incidentIdParam),
        api.getIncidentCandidates(incidentIdParam).catch(() => ({ candidates: [] })),
      ])
      setIncident(incData)
      setCandidates(candData?.candidates || candData || [])
    } catch (err: any) {
      console.error('Failed to load cascade incident:', err)
      setError(err?.message || `Failed to load incident '${incidentIdParam}' for response cascade.`)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [incidentIdParam])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Launch Next Wave
  async function handleLaunchNextWave() {
    setIsActionPending(true)
    setError(null)
    try {
      const nextWaveNum = (incident?.waves?.length || 0) + 1
      await api.launchWave(incidentIdParam, {
        wave_number: nextWaveNum,
        wave_size: 5,
        operator_id: 'Response Coordinator',
      })
      setToastMsg(`Wave ${nextWaveNum} mobilized successfully.`)
      setShowToast(true)
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Failed to activate next wave.')
    } finally {
      setIsActionPending(false)
    }
  }

  // Advance Wave
  async function handleAdvanceWave(waveNum: number) {
    setIsActionPending(true)
    setError(null)
    try {
      await api.advanceWave(incidentIdParam, waveNum, {
        action: 'advance',
        actor: 'Response Desk',
      })
      setToastMsg(`Wave ${waveNum} evaluated and advanced.`)
      setShowToast(true)
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Could not advance wave.')
    } finally {
      setIsActionPending(false)
    }
  }

  // Authorised Fulfilment
  async function handleConfirmFulfilment() {
    setIsActionPending(true)
    setError(null)
    try {
      await api.confirmFulfilment(incidentIdParam, {
        units_confirmed: 1,
        confirmed_by: 'Transfusion Lead',
        confirmation_source: 'Hospital Blood Bank',
        notes: 'Clinical delivery verified.',
      })
      setToastMsg('Unit fulfilment confirmed in canonical ledger.')
      setShowToast(true)
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm fulfilment.')
    } finally {
      setIsActionPending(false)
    }
  }

  if (isLoading && !incident) {
    return (
      <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-16">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-white rounded-2xl border border-[#E5E7EB] animate-pulse" />
      </div>
    )
  }

  const req = incident?.requirement || {}
  const totalRequired = req.units_required || incident?.units_requested || 1
  const unitsSecured = incident?.units_secured || 0
  const waves = incident?.waves || []
  const status = incident?.status || 'PendingVerification'

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl border border-gray-800 flex items-center gap-3 animate-slide-up">
          <Phone size={18} className="text-[#10B981]" />
          <div className="text-xs">
            <span className="font-bold block">Cascade Operation Confirmed</span>
            <span className="text-gray-400">{toastMsg}</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl flex items-start justify-between gap-3 text-xs text-[#991B1B]">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#991B1B]">Cascade Operation Blocked</p>
              <p className="mt-0.5 text-[#B91C1C]">{error}</p>
            </div>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-semibold text-[#DC2626] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#E5E7EB]">
        <div>
          <button
            onClick={() => navigate(`/incidents/${incidentIdParam}`)}
            className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] mb-1 flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to Incident Command
          </button>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight flex items-center gap-2.5">
            <Zap size={24} className="text-[#E11D48]" />
            <span>Response Cascade</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Progressive mobilisation of capacity across verified waves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#374151] transition-colors shadow-2xs"
          >
            <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin text-[#E11D48]')} />
            <span>Refresh State</span>
          </button>

          <button
            onClick={() => navigate(`/incidents/${incidentIdParam}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white hover:bg-black text-xs font-semibold transition-colors"
          >
            <span>View Incident Command</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Incident Header Summary Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-3 h-3 rounded-full bg-[#E11D48] animate-ping" />
            <span className="text-lg font-bold font-mono text-[#111827]">{incident?.incident_id}</span>
            <span className="px-2.5 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold text-xs font-mono">
              {req.blood_group}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] text-xs font-bold uppercase">
              {req.urgency || 'HIGH'} · {totalRequired} UNITS
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700">
              {status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#059669]">
              <CheckCircle2 size={13} /> {status === 'PendingVerification' ? 'Pending Verification' : 'Verified Incident'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#4B5563] pt-1 border-t border-[#F3F4F6]">
          <span className="flex items-center gap-1 font-medium">
            <MapPin size={14} className="text-[#E11D48]" /> Location: {req.location?.zone || incident?.zone}, Pune
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Building2 size={14} className="text-[#2563EB]" /> Facility: {req.requesting_facility}
          </span>
        </div>

        {/* Waves Status Stepper */}
        <div className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            {[1, 2, 3, 4].map((waveNum) => {
              const matchingWave = waves.find((w: any) => w.wave_number === waveNum)
              const isLaunched = !!matchingWave
              const isCurrent = isLaunched && (matchingWave.status === 'active' || matchingWave.status === 'Active')

              return (
                <div
                  key={waveNum}
                  className={cn(
                    'p-3 rounded-xl border space-y-1 transition-all',
                    isCurrent
                      ? 'border-[#E11D48] bg-[#FFF1F2]'
                      : isLaunched
                      ? 'border-[#10B981] bg-[#ECFDF5]'
                      : 'border-[#E5E7EB] bg-gray-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full font-bold flex items-center justify-center mx-auto text-xs',
                      isCurrent
                        ? 'bg-[#E11D48] text-white'
                        : isLaunched
                        ? 'bg-[#10B981] text-white'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {waveNum}
                  </div>
                  <div className="font-bold text-[#111827]">Wave {waveNum}</div>
                  <div className="text-[10px] text-[#6B7280]">
                    {matchingWave ? `${matchingWave.donors_contacted} Contacted` : 'Cohort Pending'}
                  </div>
                  <span
                    className={cn(
                      'inline-block px-1.5 py-0.2 rounded text-[9px] font-bold mt-1',
                      isCurrent
                        ? 'bg-[#E11D48] text-white'
                        : isLaunched
                        ? 'bg-[#10B981] text-white'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {matchingWave?.status || 'Pending'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Active Waves & Matched Candidates (Col 8 / ~65%) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Waves Cards */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-[#111827]">Authoritative Mobilisation Waves</h3>
                <p className="text-xs text-[#6B7280]">Active waves executing against canonical database contacts.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLaunchNextWave}
                  disabled={isActionPending || status === 'PendingVerification' || status === 'Fulfilled' || status === 'Closed'}
                  className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Zap size={14} />
                  <span>Launch Next Wave</span>
                </button>
              </div>
            </div>

            {waves.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6B7280] space-y-2">
                <AlertTriangle size={24} className="text-[#D97706] mx-auto" />
                <p className="font-bold text-[#111827]">No active waves running for this incident.</p>
                <p>Click 'Launch Next Wave' above to trigger automated candidate outreach.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waves.map((w: any) => (
                  <div
                    key={w.wave_number}
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111827]">Wave {w.wave_number}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                          {w.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAdvanceWave(w.wave_number)}
                        disabled={isActionPending}
                        className="text-xs font-semibold text-[#E11D48] hover:underline"
                      >
                        Advance Wave →
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-[#6B7280] block">Contacted</span>
                        <span className="font-bold text-[#111827]">{w.donors_contacted}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B7280] block">Responses</span>
                        <span className="font-bold text-[#111827]">{w.responses_received || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B7280] block">Confirmed</span>
                        <span className="font-bold text-[#10B981]">{w.confirmed || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B7280] block">Units Secured</span>
                        <span className="font-bold text-[#111827]">{w.units_secured || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matched Donor Cohort */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <h3 className="text-base font-bold font-display text-[#111827]">Eligible Matched Candidates</h3>
            {candidates.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-4">No remaining candidates in this cohort.</p>
            ) : (
              <div className="space-y-2.5">
                {candidates.slice(0, 5).map((c: any, idx: number) => (
                  <div key={c.donor_id} className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#6B7280]">#{idx + 1}</span>
                      <span className="font-mono font-bold text-[#111827]">{c.donor_id}</span>
                      <span className="px-2 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold text-xs font-mono">
                        {c.blood_group}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[#6B7280]">
                      <span>📍 {c.distance_km?.toFixed(1) || 3.5} km</span>
                      <span className="text-[#10B981] font-semibold">
                        Score: {c.composite_score ? Math.round(c.composite_score * 100) : 85}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Units Secured & Actions (Col 4 / ~35%) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Units Secured Metric Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs text-center space-y-3">
            <h3 className="text-xs font-bold font-display text-[#6B7280] uppercase tracking-wider">
              Units Secured
            </h3>
            <div className="text-5xl font-bold font-display text-[#111827]">
              {unitsSecured} / {totalRequired}
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-[#E5E7EB]">
                <div
                  className="h-full bg-[#E11D48] transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((unitsSecured / totalRequired) * 100))}%` }}
                />
              </div>
              <span className="text-[11px] text-[#6B7280] font-semibold block">
                {Math.round((unitsSecured / totalRequired) * 100)}% Fulfilled
              </span>
            </div>

            {unitsSecured < totalRequired && (
              <button
                onClick={handleConfirmFulfilment}
                disabled={isActionPending}
                className="w-full py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-xs transition-colors"
              >
                Confirm Unit Fulfilment
              </button>
            )}
          </div>

          {/* Cascade Principles Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold font-display text-[#111827]">Authoritative Constraints</h3>
            <div className="space-y-3 text-xs text-[#4B5563]">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827] block font-bold">Verified Outreach</strong>
                  <span>Requirements must be clinically verified before wave activation.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Users size={18} className="text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827] block font-bold">Fulfilment Separation</strong>
                  <span>Donor acceptance does not count as secured blood until delivered.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Zap size={18} className="text-[#E11D48] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827] block font-bold">Deduplication</strong>
                  <span>Prior wave contacts are never re-alerted in subsequent waves.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
