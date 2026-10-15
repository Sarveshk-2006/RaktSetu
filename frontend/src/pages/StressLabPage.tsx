// RAKTSETU — Network Stress Lab Page (Authoritative Simulation Workspace)
import { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical, Users, TrendingUp, Droplet, Building2, Zap,
  CheckCircle2, AlertTriangle, RefreshCw, Info, ShieldCheck, X, History, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

// Map scenario IDs to icon and styling helpers
function getScenarioMeta(id: string) {
  switch (id) {
    case 'S1':
      return {
        title: 'Donor Unavailability',
        desc: 'Simulate unavailable registered donors across Pune.',
        icon: Users,
        iconBg: 'bg-[#FFF1F2] text-[#E11D48]',
      }
    case 'S2':
      return {
        title: 'Demand Surge',
        desc: 'Simulate concurrent requirement surges across multiple hospitals.',
        icon: TrendingUp,
        iconBg: 'bg-[#EFF6FF] text-[#2563EB]',
      }
    case 'S3':
      return {
        title: 'Rare Blood Shortage',
        desc: 'Critical deficit simulation for O− and AB− blood groups.',
        icon: Droplet,
        iconBg: 'bg-[#FFE4E6] text-[#E11D48]',
      }
    case 'S4':
      return {
        title: 'Partner Offline',
        desc: 'Simulate loss of coordination with partner blood banks/NGOs.',
        icon: Building2,
        iconBg: 'bg-[#F3E8FF] text-[#8B5CF6]',
      }
    case 'S5':
      return {
        title: 'Multiple Emergencies',
        desc: 'Multi-casualty simultaneous incidents across Pune.',
        icon: Zap,
        iconBg: 'bg-[#FEF3C7] text-[#D97706]',
      }
    default:
      return {
        title: 'Capacity Stress Test',
        desc: 'Synthetic network stress simulation.',
        icon: Users,
        iconBg: 'bg-[#FFF1F2] text-[#E11D48]',
      }
  }
}

export function StressLabPage() {
  const [scenarios, setScenarios] = useState<any[]>([])
  const [selectedScenario, setSelectedScenario] = useState<any>({ scenario_id: 'S1', name: 'Donor Unavailability' })
  const [sliderValue, setSliderValue] = useState(30)
  const [surgeMultiplier, setSurgeMultiplier] = useState('2×')
  const [selectedPartner, setSelectedPartner] = useState('UPAY Pune')
  const [incidentCount, setIncidentCount] = useState(5)

  const [simPhase, setSimPhase] = useState<'idle' | 'running' | 'complete'>('idle')
  const [result, setResult] = useState<any | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Load scenarios and history from backend
  const loadInitialData = useCallback(async () => {
    try {
      const [scenariosData, historyData] = await Promise.all([
        api.getStressScenarios(),
        api.getStressHistory(10),
      ])
      if (scenariosData && scenariosData.length > 0) {
        setScenarios(scenariosData)
        setSelectedScenario(scenariosData[0])
      }
      setHistory(historyData || [])
    } catch (err: any) {
      console.error('Failed to load stress lab data:', err)
      setError('Could not connect to the authoritative stress simulation service. Make sure the backend server is running.')
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  async function runSimulation() {
    setSimPhase('running')
    setError(null)
    setResult(null)

    let parameters: Record<string, any> = {}
    if (selectedScenario.scenario_id === 'S1') {
      parameters = { unavailability_pct: sliderValue }
    } else if (selectedScenario.scenario_id === 'S2') {
      const mult = parseFloat(surgeMultiplier.replace('×', '')) || 2.0
      parameters = { surge_multiplier: mult }
    } else if (selectedScenario.scenario_id === 'S3') {
      parameters = { rare_groups: ['O-', 'AB-'], reduction_pct: 60 }
    } else if (selectedScenario.scenario_id === 'S4') {
      parameters = { partner_name: selectedPartner }
    } else if (selectedScenario.scenario_id === 'S5') {
      parameters = { incident_count: incidentCount }
    }

    try {
      const simResult = await api.runStressSimulation({
        scenario_id: selectedScenario.scenario_id,
        parameters,
      })
      setResult(simResult)
      setSimPhase('complete')
      // Refresh history from backend persistence
      const updatedHistory = await api.getStressHistory(10)
      setHistory(updatedHistory)
    } catch (err: any) {
      console.error('Simulation execution failed:', err)
      setError(err?.message || 'Stress simulation run failed. Operational data was not modified.')
      setSimPhase('idle')
    }
  }

  function handleReset() {
    setSimPhase('idle')
    setResult(null)
    setError(null)
  }

  const meta = getScenarioMeta(selectedScenario.scenario_id)
  const IconComponent = meta.icon

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl border border-gray-800 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#10B981]" />
          <div className="text-xs">
            <span className="font-bold block">Simulation Recorded</span>
            <span className="text-gray-400">Simulation completed and persisted to analytical storage.</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight flex items-center gap-2.5">
            <FlaskConical size={24} className="text-[#E11D48]" />
            <span>Network Stress Lab</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5 max-w-3xl">
            Deterministic simulation workspace for testing Pune blood response resilience against demand surges, capacity shocks, and bottlenecks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#374151] transition-colors shadow-2xs"
          >
            <History size={14} className="text-[#6B7280]" />
            <span>Simulation History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Simulation Disclaimer Banner */}
      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 flex items-start gap-3 text-xs text-[#92400E]">
        <Info size={16} className="text-[#D97706] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Isolated Analytical Simulation:</span> Simulations execute in a hermetic analytical environment. They do not alter real donor readiness, active incidents, wave dispatches, or audit logs, and are not clinical predictions.
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-[#991B1B]">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#991B1B]">Simulation Service Error</p>
              <p className="mt-0.5 text-[#B91C1C]">{error}</p>
            </div>
          </div>
          <button
            onClick={loadInitialData}
            className="px-3 py-1 bg-white border border-[#FCA5A5] rounded-lg text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2] shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Persisted History Drawer */}
      {showHistory && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
              <History size={16} className="text-[#E11D48]" />
              <span>Persisted Simulation History (Backend Store)</span>
            </h3>
            <button onClick={() => setShowHistory(false)} className="text-xs text-[#6B7280] hover:text-[#111827]">
              <X size={14} />
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-[#6B7280] py-4 text-center">No simulation runs recorded yet. Execute a simulation to record history.</p>
          ) : (
            <div className="divide-y divide-[#F3F4F6] max-h-60 overflow-y-auto">
              {history.map((h) => (
                <div key={h.simulation_id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#111827]">{h.scenario_name || h.scenario_id}</span>
                    <span className="text-[#6B7280] ml-2">ID: {h.simulation_id.slice(0, 8)}</span>
                    <span className="text-[#9CA3AF] ml-2">({h.simulated_at ? new Date(h.simulated_at).toLocaleString('en-GB') : 'Recorded'})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#DC2626] font-semibold">
                      -{Math.round(h.capacity_loss_pct || 0)}% Capacity
                    </span>
                    <button
                      onClick={() => {
                        setResult(h)
                        setSimPhase('complete')
                        setShowHistory(false)
                      }}
                      className="text-xs font-semibold text-[#E11D48] hover:underline"
                    >
                      View Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 1 — Scenario Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Select Stress Scenario</h3>
            <p className="text-xs text-[#6B7280]">Select a disruption model to evaluate network capacity breakdown.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(scenarios.length > 0 ? scenarios : [
            { scenario_id: 'S1', name: 'Donor Unavailability' },
            { scenario_id: 'S2', name: 'Demand Surge' },
            { scenario_id: 'S3', name: 'Rare Blood Shortage' },
            { scenario_id: 'S4', name: 'Partner Offline' },
            { scenario_id: 'S5', name: 'Multiple Emergencies' },
          ]).map((sc) => {
            const scMeta = getScenarioMeta(sc.scenario_id)
            const ScIcon = scMeta.icon
            const isSelected = selectedScenario.scenario_id === sc.scenario_id

            return (
              <div
                key={sc.scenario_id}
                onClick={() => {
                  setSelectedScenario(sc)
                  setSimPhase('idle')
                  setResult(null)
                }}
                className={cn(
                  'p-4 rounded-xl border transition-all cursor-pointer space-y-2 group',
                  isSelected
                    ? 'border-[#E11D48] bg-[#FFF1F2] shadow-xs'
                    : 'border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', scMeta.iconBg)}>
                    <ScIcon size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">{sc.scenario_id}</span>
                </div>

                <div className="space-y-1 pt-1">
                  <h4 className="text-xs font-bold font-display text-[#111827]">{sc.name || scMeta.title}</h4>
                  <p className="text-[11px] text-[#6B7280] leading-snug">{sc.description || scMeta.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2 — Simulation Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Simulation Parameters (Col 6 / 50%) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold font-display text-[#111827]">Simulation Parameters</h3>
              <span className="text-xs text-[#6B7280]">Configurable inputs</span>
            </div>
            <p className="text-xs text-[#6B7280]">Parameters sent to backend stress calculation engine.</p>

            {/* Selected Scenario Banner */}
            <div className="mt-4 p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.iconBg)}>
                <IconComponent size={16} />
              </div>
              <div>
                <span className="font-bold text-xs text-[#111827] block">{selectedScenario.name || meta.title}</span>
                <span className="text-[11px] text-[#4B5563]">{selectedScenario.description || meta.desc}</span>
              </div>
            </div>

            {/* Parameter Control UI */}
            <div className="mt-5 space-y-3">
              {selectedScenario.scenario_id === 'S1' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111827]">Donor Unavailability</span>
                    <span className="font-bold text-[#E11D48] text-sm font-mono">{sliderValue}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="w-full accent-[#E11D48] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#6B7280] font-semibold">
                    <span>0% (Baseline)</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100% (Full Crisis)</span>
                  </div>
                </div>
              )}

              {selectedScenario.scenario_id === 'S2' && (
                <div className="space-y-3">
                  <span className="font-bold text-xs text-[#111827] block">Demand Surge Multiplier</span>
                  <div className="grid grid-cols-5 gap-2">
                    {['1×', '1.25×', '1.5×', '2×', '3×'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSurgeMultiplier(m)}
                        className={cn(
                          'py-2 rounded-lg text-xs font-bold border transition-all',
                          surgeMultiplier === m
                            ? 'bg-[#E11D48] text-white border-[#E11D48]'
                            : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:bg-gray-100'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedScenario.scenario_id === 'S3' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111827]">Rare Blood Reduction (O− & AB−)</span>
                    <span className="font-bold text-[#E11D48] text-sm font-mono">60% Depletion</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="10"
                    defaultValue={60}
                    disabled
                    className="w-full accent-[#E11D48] opacity-70"
                  />
                  <p className="text-[11px] text-[#6B7280]">Targeted O− and AB− acute deficit profile across all hospital zones.</p>
                </div>
              )}

              {selectedScenario.scenario_id === 'S4' && (
                <div className="space-y-3">
                  <span className="font-bold text-xs text-[#111827] block">Select Offline Partner Organisation</span>
                  <select
                    value={selectedPartner}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs font-semibold text-[#111827] outline-none"
                  >
                    <option value="UPAY Pune">UPAY Pune (NGO Volunteer Network)</option>
                    <option value="Blood Bank Network">Blood Bank Network (Regional Hub)</option>
                    <option value="Campus Network">Campus Network (University Pool)</option>
                    <option value="Rotary Pune East">Rotary Pune East (Civic Group)</option>
                  </select>
                </div>
              )}

              {selectedScenario.scenario_id === 'S5' && (
                <div className="space-y-3">
                  <span className="font-bold text-xs text-[#111827] block">Simultaneous Emergency Incidents</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 5, 8].map((count) => (
                      <button
                        key={count}
                        onClick={() => setIncidentCount(count)}
                        className={cn(
                          'py-2 rounded-lg text-xs font-bold border transition-all',
                          incidentCount === count
                            ? 'bg-[#E11D48] text-white border-[#E11D48]'
                            : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:bg-gray-100'
                        )}
                      >
                        {count} Incidents
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F3F4F6] text-[11px] text-[#6B7280]">
            Deterministic parameters execute against real persistent donor network nodes in memory.
          </div>
        </div>

        {/* RIGHT COLUMN: Execution Action (Col 6 / 50%) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold font-display text-[#111827]">Simulation Execution</h3>
              <span className="text-xs text-[#6B7280]">FastAPI Domain Engine</span>
            </div>
            <p className="text-xs text-[#6B7280]">Trigger authoritative calculation of network degradation.</p>

            <div className="mt-6 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#111827]">
                <ShieldCheck size={16} className="text-[#10B981]" />
                <span>Deterministic Model Guarantees</span>
              </div>
              <ul className="space-y-1.5 text-[#4B5563] list-disc list-inside text-[11px]">
                <li>Zero impact on active patients, live hospital incidents or donor statuses.</li>
                <li>Simulations are persisted for historical comparison and auditability.</li>
                <li>Identifies exact zone bottlenecks and blood group coverage drops.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F3F4F6]">
            {simPhase === 'complete' && (
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-gray-50 text-xs font-semibold text-[#4B5563] transition-colors"
              >
                Reset Output
              </button>
            )}

            <button
              onClick={runSimulation}
              disabled={simPhase === 'running'}
              className="px-6 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              {simPhase === 'running' ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Calculating Simulation...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Run Stress Simulation →</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3 — Authoritative Simulation Results Workspace */}
      {simPhase === 'complete' && result && (
        <div className="space-y-6 animate-scale-up">
          {/* Result Banner */}
          <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FECDD3] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#E11D48] uppercase tracking-wider block">
                  SIMULATION RESULT (PERSISTED)
                </span>
                <h3 className="text-lg font-bold font-display text-[#111827]">
                  {result.scenario_name || meta.title}
                </h3>
                <span className="text-[11px] text-[#6B7280]">
                  Simulation ID: {result.simulation_id}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] text-xs font-bold self-start sm:self-auto">
                {result.capacity_loss_pct > 25 ? 'SEVERE IMPAIRMENT' : 'MODERATE IMPAIRMENT'}
              </span>
            </div>

            {/* Before vs After Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">Usable Donors</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-gray-400 line-through">
                    {result.baseline_usable_donors?.toLocaleString() || '5,060'}
                  </span>
                  <span className="text-xl font-bold font-display text-[#E11D48]">
                    {result.simulated_usable_donors?.toLocaleString()} ready
                  </span>
                </div>
                <span className="text-[10px] text-[#E11D48] font-bold block">
                  -{Math.round(result.capacity_loss_pct || 0)}% capacity reduction
                </span>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">Coverage Level</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-gray-400 line-through">
                    {Math.round(result.baseline_coverage_pct || 87)}%
                  </span>
                  <span className="text-xl font-bold font-display text-[#E11D48]">
                    {Math.round(result.simulated_coverage_pct || 0)}%
                  </span>
                </div>
                <span className="text-[10px] text-[#E11D48] font-bold block">
                  -{Math.round(result.coverage_loss_pct || 0)}% coverage loss
                </span>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">Bottlenecks Identified</span>
                <div className="text-xl font-bold font-display text-[#111827] pt-1">
                  {result.bottlenecks?.length || 0} Critical Points
                </div>
                <span className="text-[10px] text-[#D97706] font-semibold block">
                  Response cascade stress
                </span>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">Interventions</span>
                <div className="text-xl font-bold font-display text-[#10B981] pt-1">
                  {result.interventions?.length || 0} Actions
                </div>
                <span className="text-[10px] text-[#059669] font-semibold block">
                  Recommended mitigation
                </span>
              </div>
            </div>
          </div>

          {/* Vulnerability Insights & Recommended Interventions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bottlenecks (Col 6 / 50%) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#E11D48]" />
                <h3 className="text-base font-bold font-display text-[#111827]">Identified Bottlenecks</h3>
              </div>

              <div className="space-y-3 text-xs">
                {(!result.bottlenecks || result.bottlenecks.length === 0) ? (
                  <p className="text-[#6B7280]">No major bottlenecks identified in this simulation scenario.</p>
                ) : (
                  result.bottlenecks.map((b: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#E11D48]">Bottleneck #{idx + 1}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFE4E6] text-[#E11D48]">Critical</span>
                      </div>
                      <p className="text-[#4B5563]">{b}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recommended Interventions (Col 6 / 50%) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#10B981]" />
                <h3 className="text-base font-bold font-display text-[#111827]">Authoritative Interventions</h3>
              </div>

              <div className="space-y-3">
                {(!result.interventions || result.interventions.length === 0) ? (
                  <p className="text-xs text-[#6B7280]">Standard operational cascades remain adequate.</p>
                ) : (
                  result.interventions.map((it: string, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#D1FAE5] text-[#059669] flex items-center justify-center font-bold text-xs shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#111827]">Recommended Action</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D1FAE5] text-[#059669]">
                            HIGH IMPACT
                          </span>
                        </div>
                        <p className="text-[#6B7280]">{it}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
