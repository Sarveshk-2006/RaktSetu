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
    <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1600px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#17212B] text-white px-4 py-3 rounded-xl shadow-dropdown border border-[#E6E8EC] flex items-center gap-3 animate-toast-enter">
          <Phone size={18} className="text-[#16805D]" />
          <div className="text-xs">
            <span className="font-bold block">Cascade Operation Confirmed</span>
            <span className="text-[#98A2B3]">{toastMsg}</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-[#98A2B3] hover:text-white ml-2 font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl flex items-start justify-between gap-3 text-xs text-[#912020] animate-dropdown">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#C62828] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#912020]">Cascade Operation Blocked</p>
              <p className="mt-0.5 text-[#B42336]">{error}</p>
            </div>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-semibold text-[#B42336] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E6E8EC]">
        <div>
          <button
            onClick={() => navigate(`/incidents/${incidentIdParam}`)}
            className="text-xs font-semibold text-[#667085] hover:text-[#17212B] mb-1.5 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Incident Command
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#17212B] tracking-tight flex items-center gap-2.5">
            <Zap size={24} className="text-[#B42336]" />
            <span>Response Cascade Workspace</span>
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Progressive mobilisation of donor capacity across deterministic verified outreach waves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E8EC] bg-white hover:bg-[#F8F9FA] text-xs font-semibold text-[#475467] transition-colors shadow-2xs"
          >
            <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin text-[#B42336]')} />
            <span>Refresh State</span>
          </button>

          <button
            onClick={() => navigate(`/incidents/${incidentIdParam}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#17212B] text-white hover:bg-black text-xs font-semibold transition-colors shadow-2xs"
          >
            <span>View Incident Command</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Incident Header Summary Banner */}
      <div className="card-command p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B42336] animate-pulse" />
            <span className="text-lg font-bold font-mono text-[#17212B]">{incident?.incident_id}</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#FEF3F2] text-[#912020] border border-[#FECDCA] font-bold text-xs font-mono">
              {req.blood_group}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#FEF3F2] text-[#912020] border border-[#FECDCA] text-xs font-bold uppercase">
              {req.urgency || 'HIGH'} · {totalRequired} UNITS
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#F8F9FA] border border-[#E6E8EC] text-[#475467]">
              {status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#667085]">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBFDF5] border border-[#A6F4C5] text-[#085D40]">
              <CheckCircle2 size={13} /> {status === 'PendingVerification' ? 'Pending Clinical Approval' : 'Verified Clinical Incident'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#475467] pt-2 border-t border-[#F2F4F7]">
          <span className="flex items-center gap-1 font-medium">
            <MapPin size={14} className="text-[#B42336]" /> Location: {req.location?.zone || incident?.zone}, Pune
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Building2 size={14} className="text-[#3567B7]" /> Facility: {req.requesting_facility}
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
                    'p-3.5 rounded-xl border space-y-1 transition-all',
                    isCurrent
                      ? 'border-[#B42336] bg-[#FEF3F2]'
                      : isLaunched
                      ? 'border-[#A6F4C5] bg-[#EBFDF5]'
                      : 'border-[#E6E8EC] bg-[#F8F9FA]'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg font-bold flex items-center justify-center mx-auto text-xs',
                      isCurrent
                        ? 'bg-[#B42336] text-white shadow-xs'
                        : isLaunched
                        ? 'bg-[#16805D] text-white shadow-xs'
                        : 'bg-[#E6E8EC] text-[#667085]'
                    )}
                  >
                    {waveNum}
                  </div>
                  <div className="font-bold text-[#17212B]">Wave {waveNum}</div>
                  <div className="text-[10px] text-[#667085]">
                    {matchingWave ? `${matchingWave.donors_contacted} Contacted` : 'Cohort Pending'}
                  </div>
                  <span
                    className={cn(
                      'inline-block px-1.5 py-0.2 rounded text-[9px] font-bold mt-1',
                      isCurrent
                        ? 'bg-[#B42336] text-white'
                        : isLaunched
                        ? 'bg-[#16805D] text-white'
                        : 'bg-[#E6E8EC] text-[#667085]'
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
          <div className="card-command p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4F7] pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-[#17212B]">Authoritative Mobilisation Waves</h3>
                <p className="text-xs text-[#667085]">Active waves executing against canonical database contacts.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLaunchNextWave}
                  disabled={isActionPending || status === 'PendingVerification' || status === 'Fulfilled' || status === 'Closed'}
                  className="px-4 py-2 rounded-xl bg-[#B42336] hover:bg-[#861D2B] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Zap size={14} />
                  <span>Launch Next Wave</span>
                </button>
              </div>
            </div>

            {waves.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#667085] space-y-2 bg-[#F8F9FA] rounded-xl border border-[#E6E8EC]">
                <AlertTriangle size={24} className="text-[#B7791F] mx-auto" />
                <p className="font-bold text-[#17212B]">No active waves running for this incident.</p>
                <p>Click 'Launch Next Wave' above to trigger automated candidate outreach.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waves.map((w: any) => (
                  <div
                    key={w.wave_number}
                    className="p-4 rounded-xl border border-[#E6E8EC] bg-[#F8F9FA] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#17212B]">Wave {w.wave_number}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF4FB] border border-[#B9D3F8] text-[#234B8E]">
                          {w.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAdvanceWave(w.wave_number)}
                        disabled={isActionPending}
                        className="text-xs font-semibold text-[#B42336] hover:text-[#861D2B] hover:underline"
                      >
                        Advance Wave →
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-[#667085] block">Contacted</span>
                        <span className="font-bold text-[#17212B]">{w.donors_contacted}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#667085] block">Responses</span>
                        <span className="font-bold text-[#17212B]">{w.responses_received || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#667085] block">Confirmed</span>
                        <span className="font-bold text-[#16805D]">{w.confirmed || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#667085] block">Units Secured</span>
                        <span className="font-bold text-[#17212B]">{w.units_secured || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matched Donor Cohort */}
          <div className="card-command p-5 space-y-4">
            <h3 className="text-base font-bold font-display text-[#17212B]">Eligible Matched Candidates</h3>
            {candidates.length === 0 ? (
              <p className="text-xs text-[#667085] py-4 bg-[#F8F9FA] rounded-xl border border-[#E6E8EC] text-center">No remaining candidates in this cohort.</p>
            ) : (
              <div className="space-y-2.5">
                {candidates.slice(0, 5).map((c: any, idx: number) => (
                  <div key={c.donor_id} className="p-3.5 rounded-xl border border-[#E6E8EC] bg-white flex items-center justify-between text-xs hover:border-[#D0D5DD] transition-all">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#667085]">#{idx + 1}</span>
                      <span className="font-mono font-bold text-[#17212B]">{c.donor_id}</span>
                      <span className="px-2 py-0.5 rounded bg-[#FEF3F2] border border-[#FECDCA] text-[#912020] font-bold text-xs font-mono">
                        {c.blood_group}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[#667085]">
                      <span>📍 {c.distance_km?.toFixed(1) || 3.5} km</span>
                      <span className="text-[#16805D] font-semibold">
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
          <div className="card-command p-5 text-center space-y-3">
            <h3 className="text-xs font-bold font-display text-[#667085] uppercase tracking-wider">
              Units Secured
            </h3>
            <div className="text-5xl font-bold font-display text-[#17212B]">
              {unitsSecured} / {totalRequired}
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full bg-[#F2F4F7] rounded-full overflow-hidden border border-[#E6E8EC]">
                <div
                  className="h-full bg-[#B42336] transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((unitsSecured / totalRequired) * 100))}%` }}
                />
              </div>
              <span className="text-[11px] text-[#667085] font-semibold block">
                {Math.round((unitsSecured / totalRequired) * 100)}% Fulfilled
              </span>
            </div>

            {unitsSecured < totalRequired && (
              <button
                onClick={handleConfirmFulfilment}
                disabled={isActionPending}
                className="w-full py-2.5 rounded-xl bg-[#16805D] hover:bg-[#085D40] text-white text-xs font-bold shadow-xs transition-colors"
              >
                Confirm Unit Fulfilment
              </button>
            )}
          </div>

          {/* Cascade Principles Card */}
          <div className="card-command p-5 space-y-3">
            <h3 className="text-xs font-bold font-display text-[#17212B]">Authoritative Guardrails</h3>
            <div className="space-y-3 text-xs text-[#475467]">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-[#16805D] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#17212B] block font-bold">Verified Outreach</strong>
                  <span>Requirements must be clinically verified before wave activation.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Users size={18} className="text-[#3567B7] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#17212B] block font-bold">Fulfilment Separation</strong>
                  <span>Donor acceptance does not count as secured blood until delivered.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Zap size={18} className="text-[#B42336] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#17212B] block font-bold">Deduplication</strong>
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

