// RAKTSETU — Network Stress Lab Page (Analytical Simulation Workspace)
import { useState, useRef } from 'react'
import {
  FlaskConical, Users, TrendingUp, Droplet, Building2, Zap,
  Sliders, Activity, CheckCircle2, AlertTriangle,
  RefreshCw, Info, Settings, ShieldCheck, Check, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { STRESS_SCENARIOS, computeStressResult } from '@/data/demoData'
import type { StressScenario, StressResult } from '@/types'

// Map scenario IDs to icon and styling helpers
function getScenarioMeta(id: string) {
  switch (id) {
    case 'S1':
      return {
        title: 'Donor Unavailability',
        desc: '30% of donors become temporarily unavailable.',
        icon: Users,
        iconBg: 'bg-[#FFF1F2] text-[#E11D48]',
      }
    case 'S2':
      return {
        title: 'Demand Surge',
        desc: 'Double the number of simultaneous blood requirements.',
        icon: TrendingUp,
        iconBg: 'bg-[#EFF6FF] text-[#2563EB]',
      }
    case 'S3':
      return {
        title: 'Rare Blood Shortage',
        desc: 'Critical shortage of O− and AB− blood groups.',
        icon: Droplet,
        iconBg: 'bg-[#FFE4E6] text-[#E11D48]',
      }
    case 'S4':
      return {
        title: 'Partner Unavailable',
        desc: 'Lead partner organisation goes offline.',
        icon: Building2,
        iconBg: 'bg-[#F3E8FF] text-[#8B5CF6]',
      }
    case 'S5':
      return {
        title: 'Multiple Emergencies',
        desc: '5 critical incidents open simultaneously across Pune.',
        icon: Zap,
        iconBg: 'bg-[#FEF3C7] text-[#D97706]',
      }
    default:
      return {
        title: 'Donor Unavailability',
        desc: '30% of donors become temporarily unavailable.',
        icon: Users,
        iconBg: 'bg-[#FFF1F2] text-[#E11D48]',
      }
  }
}

export function StressLabPage() {
  const scenarios = STRESS_SCENARIOS
  const [selectedScenario, setSelectedScenario] = useState<StressScenario>(scenarios[0])
  const [sliderValue, setSliderValue] = useState(30)
  const [surgeMultiplier, setSurgeMultiplier] = useState('2×')
  const [selectedPartner, setSelectedPartner] = useState('UPAY Pune')
  const [incidentCount, setIncidentCount] = useState(5)

  const [simPhase, setSimPhase] = useState<'idle' | 'running' | 'complete'>('idle')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [result, setResult] = useState<StressResult | null>(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const STEPS = [
    'Removing unavailable capacity',
    'Recalculating donor coverage',
    'Recalculating response probability',
    'Re-routing partner capacity',
    'Detecting critical gaps',
    'Generating interventions',
  ]

  function runSimulation() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setSimPhase('running')
    setCurrentStepIndex(0)
    setResult(null)

    STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setCurrentStepIndex(i + 1)
      }, 350 + i * 400)
      timers.current.push(t)
    })

    const tDone = setTimeout(() => {
      const capacityFactor = 100 - sliderValue
      setResult(computeStressResult(selectedScenario.scenario_id, capacityFactor))
      setSimPhase('complete')
    }, 350 + STEPS.length * 400 + 200)
    timers.current.push(tDone)
  }

  function handleReset() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setSimPhase('idle')
    setCurrentStepIndex(0)
    setResult(null)
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
            <span className="font-bold block">Custom Scenario Saved</span>
            <span className="text-gray-400">Custom stress scenario added to simulation workspace.</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight flex items-center gap-2.5">
            <FlaskConical size={24} className="text-[#E11D48]" />
            <span>Network Stress Lab</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5 max-w-3xl">
            What happens when the network is under pressure? Run deterministic stress simulations to identify vulnerabilities before emergencies occur.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold border border-[#BFDBFE] flex items-center gap-1.5">
            <Sliders size={14} />
            <span>Planning & Simulation</span>
          </span>
        </div>
      </div>

      {/* SECTION 1 — Simulation Scenarios Cards */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold font-display text-[#111827]">Simulation Scenario</h3>
            <p className="text-xs text-[#6B7280]">
              Choose a scenario or create a custom one to test network resilience.
            </p>
          </div>
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-xs font-semibold text-[#4B5563] self-start sm:self-auto transition-colors"
          >
            <Settings size={14} />
            <span>Custom Scenario</span>
          </button>
        </div>

        {/* 5 Scenario Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {scenarios.map((sc) => {
            const scMeta = getScenarioMeta(sc.scenario_id)
            const ScIcon = scMeta.icon
            const isSelected = selectedScenario.scenario_id === sc.scenario_id

            return (
              <div
                key={sc.scenario_id}
                onClick={() => {
                  setSelectedScenario(sc)
                  handleReset()
                }}
                className={cn(
                  'p-4 rounded-xl border transition-all cursor-pointer space-y-3 flex flex-col justify-between relative',
                  isSelected
                    ? 'border-[#E11D48] bg-[#FFF1F2]/40 shadow-xs ring-1 ring-[#E11D48]/30'
                    : 'border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'
                )}
              >
                {/* Radio Indicator top right */}
                <div className="flex items-center justify-between">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', scMeta.iconBg)}>
                    <ScIcon size={18} />
                  </div>
                  <div className={cn('w-4 h-4 rounded-full border flex items-center justify-center', isSelected ? 'border-[#E11D48] bg-[#E11D48]' : 'border-[#CBD5E1]')}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h4 className="text-xs font-bold font-display text-[#111827]">{scMeta.title}</h4>
                  <p className="text-[11px] text-[#6B7280] leading-snug">{scMeta.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2 — Simulation Parameters & Expected Impact Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Simulation Parameters (Col 6 / 50%) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold font-display text-[#111827]">Simulation Parameters</h3>
              <span className="text-xs text-[#6B7280]">Adjust for scenario</span>
            </div>
            <p className="text-xs text-[#6B7280]">Adjust parameters for the selected scenario.</p>

            {/* Selected Scenario Banner */}
            <div className="mt-4 p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.iconBg)}>
                <IconComponent size={16} />
              </div>
              <div>
                <span className="font-bold text-xs text-[#111827] block">{meta.title}</span>
                <span className="text-[11px] text-[#4B5563]">{meta.desc}</span>
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
                    min="20"
                    max="90"
                    step="10"
                    defaultValue="60"
                    className="w-full accent-[#E11D48] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#6B7280] font-semibold">
                    <span>20% Low</span>
                    <span>40% Moderate</span>
                    <span>60% High</span>
                    <span>80% Severe</span>
                  </div>
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
            Parameters feed into RAKTSETU's deterministic capacity routing model.
          </div>
        </div>

        {/* RIGHT COLUMN: Expected Impact (Estimated) (Col 6 / 50%) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold font-display text-[#111827]">Expected Impact (Estimated)</h3>
              <span className="text-xs text-[#6B7280]">Pune district model</span>
            </div>
            <p className="text-xs text-[#6B7280]">Estimated effect based on current Pune network data.</p>

            {/* 4 Estimated Impact Stat Cards */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center shrink-0">
                    <Users size={15} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#6B7280]">Donors Impacted</span>
                </div>
                <div className="text-xl font-bold font-display text-[#111827] pt-1">
                  {((sliderValue / 100) * 20000).toLocaleString()}
                </div>
                <span className="text-[10px] text-[#6B7280] block">{sliderValue}% of 20,000 donors</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <Activity size={15} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#6B7280]">Capacity Reduced</span>
                </div>
                <div className="text-xl font-bold font-display text-[#111827] pt-1">
                  {Math.round(4218 * (sliderValue / 100)).toLocaleString()}
                </div>
                <span className="text-[10px] text-[#D97706] block font-semibold">Fewer matching donors</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
                    <AlertTriangle size={15} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#6B7280]">Risk to Rare Groups</span>
                </div>
                <div className="text-xl font-bold font-display text-[#E11D48] pt-1">
                  High Risk
                </div>
                <span className="text-[10px] text-[#E11D48] block font-semibold">O− and AB− most affected</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                    <Building2 size={15} />
                  </div>
                  <span className="text-[11px] font-semibold text-[#6B7280]">Vulnerable Zones</span>
                </div>
                <div className="text-xl font-bold font-display text-[#2563EB] pt-1">
                  3 Zones
                </div>
                <span className="text-[10px] text-[#6B7280] block font-medium">Wagholi, Hadapsar, Baner</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F3F4F6] text-[11px] text-[#6B7280]">
            Click "Run Simulation" below to calculate full network stress outputs.
          </div>
        </div>
      </div>

      {/* SECTION 3 — Network Readiness & Stress Focus Areas Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Network Readiness (Col 7 / ~60%) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
            <div>
              <h3 className="text-base font-bold font-display text-[#111827]">Network Readiness</h3>
              <p className="text-xs text-[#6B7280]">Current usable donor capacity before simulation.</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] self-start sm:self-auto">
              Pune Network: 20,000 registered donors
            </span>
          </div>

          {/* Segmented Capacity Bar */}
          <div className="space-y-3">
            <div className="h-5 w-full rounded-lg overflow-hidden flex bg-[#F3F4F6] border border-[#E5E7EB] p-0.5">
              <div className="h-full bg-[#10B981] rounded-l" style={{ width: '21%' }} title="Ready Now (4,218)" />
              <div className="h-full bg-[#F59E0B]" style={{ width: '9%' }} title="May Be Available (1,842)" />
              <div className="h-full bg-[#E11D48]" style={{ width: '11%' }} title="Temporarily Unavailable (2,104)" />
              <div className="h-full bg-[#9CA3AF] rounded-r" style={{ width: '54%' }} title="Not Currently Usable (10,750)" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <span className="flex items-center gap-1.5 font-bold text-[#111827]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> 4,218
                </span>
                <span className="text-[11px] text-[#059669] block font-semibold">Ready Now (21%)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <span className="flex items-center gap-1.5 font-bold text-[#111827]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> 1,842
                </span>
                <span className="text-[11px] text-[#D97706] block font-semibold">May Be Available (9%)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <span className="flex items-center gap-1.5 font-bold text-[#111827]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" /> 2,104
                </span>
                <span className="text-[11px] text-[#E11D48] block font-semibold">Unavailable (11%)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <span className="flex items-center gap-1.5 font-bold text-[#111827]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]" /> 10,750
                </span>
                <span className="text-[11px] text-[#6B7280] block font-medium">Not Usable (54%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Stress Test Focus Areas (Col 5 / ~40%) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold font-display text-[#111827]">Stress Test Focus Areas</h3>
            <p className="text-xs text-[#6B7280]">Key aspects that will be evaluated during the simulation.</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-[#E11D48]" />
                <span className="font-bold text-[#111827]">Donor Matching</span>
              </div>
              <span className="text-[11px] text-[#6B7280]">Availability, response rate, reach</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 size={16} className="text-[#2563EB]" />
                <span className="font-bold text-[#111827]">Hospital Fulfilment</span>
              </div>
              <span className="text-[11px] text-[#6B7280]">Time to fulfil requirements</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity size={16} className="text-[#8B5CF6]" />
                <span className="font-bold text-[#111827]">Partner Escalation</span>
              </div>
              <span className="text-[11px] text-[#6B7280]">When partner support is required</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp size={16} className="text-[#F59E0B]" />
                <span className="font-bold text-[#111827]">Geographic Coverage</span>
              </div>
              <span className="text-[11px] text-[#6B7280]">Areas with potential service gaps</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-[#10B981]" />
                <span className="font-bold text-[#111827]">Network Resilience</span>
              </div>
              <span className="text-[11px] text-[#6B7280]">Overall system performance</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4 — Primary Action Bar & About Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-[#4B5563]">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <Info size={18} />
          </div>
          <div>
            <strong className="text-[#111827] font-bold block">About Network Stress Lab</strong>
            <span className="text-[#6B7280]">
              Run realistic what-if scenarios using deterministic models to understand network behaviour under pressure. This helps identify vulnerabilities and improve preparedness.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {simPhase === 'complete' && (
            <button
              onClick={handleReset}
              className="px-4 py-3 rounded-xl border border-[#E5E7EB] hover:bg-gray-100 text-xs font-bold text-[#4B5563] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={runSimulation}
            disabled={simPhase === 'running'}
            className="px-6 py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            {simPhase === 'running' ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Simulating Step {currentStepIndex}/6...</span>
              </>
            ) : simPhase === 'complete' ? (
              <>
                <Zap size={16} />
                <span>Run Again</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Run Simulation →</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 5 — Dynamic Simulation Results Workspace */}
      {simPhase === 'running' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 text-[#D97706] font-bold text-sm">
            <RefreshCw size={18} className="animate-spin" />
            <span>Simulation Execution in Progress...</span>
          </div>

          <div className="space-y-2">
            {STEPS.map((stepLabel, idx) => (
              <div
                key={stepLabel}
                className={cn(
                  'flex items-center gap-3 text-xs transition-all duration-300',
                  currentStepIndex > idx ? 'opacity-100 text-[#10B981] font-semibold' : 'opacity-40 text-[#9CA3AF]'
                )}
              >
                <CheckCircle2 size={16} className={currentStepIndex > idx ? 'text-[#10B981]' : 'text-gray-300'} />
                <span>{stepLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {simPhase === 'complete' && result && (
        <div className="space-y-6 animate-scale-up">
          {/* Result Banner */}
          <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FECDD3] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#E11D48] uppercase tracking-wider block">
                  SIMULATION RESULT
                </span>
                <h3 className="text-lg font-bold font-display text-[#111827]">
                  Network Stress Detected — Scenario: {meta.title}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] text-xs font-bold self-start sm:self-auto">
                {result.status} IMPAIRMENT
              </span>
            </div>

            {/* Before vs After Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">Ready Capacity Drop</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-gray-400 line-through">4,218</span>
                  <span className="text-xl font-bold font-display text-[#E11D48]">{result.o_neg_coverage_after * 40} ready</span>
                </div>
                <span className="text-[10px] text-[#E11D48] font-bold block">-{sliderValue}% capacity reduction</span>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">O− Coverage Level</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-gray-400 line-through">{result.o_neg_coverage_before}%</span>
                  <span className="text-xl font-bold font-display text-[#E11D48]">{result.o_neg_coverage_after}%</span>
                </div>
                <span className="text-[10px] text-[#E11D48] font-bold block">Critical Shortage Threshold</span>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">Weakest District Zone</span>
                <div className="text-xl font-bold font-display text-[#111827] pt-1">
                  {result.weakest_zone}
                </div>
                <span className="text-[10px] text-[#D97706] font-semibold block">Severe response gap</span>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] text-[#6B7280] font-medium block">Expected Response Delay</span>
                <div className="text-xl font-bold font-display text-[#D97706] pt-1">
                  +{result.expected_delay_increase_percent}%
                </div>
                <span className="text-[10px] text-[#D97706] font-semibold block">Additional elapsed time</span>
              </div>
            </div>
          </div>

          {/* Vulnerability Insights & Recommended Interventions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Vulnerability Insights (Col 6 / 50%) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#E11D48]" />
                <h3 className="text-base font-bold font-display text-[#111827]">Network Vulnerabilities</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#E11D48]">O− Capacity Shortage in Wagholi Zone</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFE4E6] text-[#E11D48]">Critical</span>
                  </div>
                  <p className="text-[#4B5563]">
                    Ready O− donor pool drops below minimum threshold for hospital emergency requirements in Wagholi.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#D97706]">Insufficient AB− Backup Coverage</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">Attention</span>
                  </div>
                  <p className="text-[#4B5563]">
                    Hadapsar zone lacks secondary response waves for AB− rare blood requirements.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2563EB]">Partner Network Escalation Required</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DBEAFE] text-[#2563EB]">Watch</span>
                  </div>
                  <p className="text-[#4B5563]">
                    UPAY Pune and Rotary East networks must be pre-activated to handle secondary wave demand.
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Interventions (Col 6 / 50%) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#10B981]" />
                <h3 className="text-base font-bold font-display text-[#111827]">Recommended Interventions</h3>
              </div>

              <div className="space-y-3">
                {result.interventions.map((it, idx) => (
                  <div key={it.title} className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#D1FAE5] text-[#059669] flex items-center justify-center font-bold text-xs shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111827]">{it.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D1FAE5] text-[#059669]">
                          {it.impact} IMPACT
                        </span>
                      </div>
                      <p className="text-[#6B7280]">{it.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM SCENARIO MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl overflow-hidden space-y-4 animate-scale-up">
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[#E11D48]" />
                <h3 className="font-bold font-display text-sm text-[#111827]">Custom Stress Scenario</h3>
              </div>
              <button onClick={() => setShowCustomModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-gray-600">
                Configure custom parameters to simulate combined stress vectors across Pune district.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Scenario Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Monsoon Transit Disruption"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Donor Unavailability %</label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    defaultValue="40"
                    className="w-full accent-[#E11D48]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Zone Focus</label>
                  <select className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none">
                    <option value="wagholi">Wagholi & East Pune</option>
                    <option value="kothrud">Kothrud & West Pune</option>
                    <option value="hadapsar">Hadapsar & South Pune</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCustomModal(false)
                  setShowToast(true)
                  setTimeout(() => setShowToast(false), 4000)
                }}
                className="px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Save & Apply Scenario</span>
                <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
