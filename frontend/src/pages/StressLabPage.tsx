// RAKTSETU — Network Stress Lab (HERO EXPERIENCE #2)
// Run deterministic stress simulations to identify network weaknesses.

import { useState, useRef } from 'react'
import { CheckCircle2, Zap, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STRESS_SCENARIOS, computeStressResult } from '@/data/demoData'
import type { StressScenario, StressResult } from '@/types'

function SimStep({ label, visible }: { label: string; visible: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 text-xs font-mono transition-all duration-300',
      visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
    )}>
      <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
      <span className="text-white">{label}</span>
    </div>
  )
}

function InterventionCard({ rank, title, description, impact }: {
  rank: number; title: string; description: string; impact: string
}) {
  return (
    <div className="rounded bg-[#111827] border border-[#1F2937] p-3.5 flex items-start gap-3 animate-fade-in font-mono">
      <div className="w-7 h-7 rounded bg-[#161E2E] border border-[#1F2937] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        #{rank}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-bold text-xs">{title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded border font-semibold uppercase bg-emerald-950 text-emerald-400 border-emerald-800">
            {impact} IMPACT
          </span>
        </div>
        <p className="text-xs text-slate-400 font-sans">{description}</p>
      </div>
    </div>
  )
}

export function StressLabPage() {
  const [selectedScenario, setSelectedScenario] = useState<StressScenario>(STRESS_SCENARIOS[0])
  const [capacityPct, setCapacityPct] = useState(70)
  const [simPhase, setSimPhase] = useState<'idle' | 'running' | 'complete'>('idle')
  const [stepsVisible, setStepsVisible] = useState(0)
  const [result, setResult] = useState<StressResult | null>(null)
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
    setStepsVisible(0)
    setResult(null)

    STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setStepsVisible(v => Math.max(v, i + 1))
      }, 400 + i * 450)
      timers.current.push(t)
    })

    const tDone = setTimeout(() => {
      setResult(computeStressResult(selectedScenario.scenario_id, capacityPct))
      setSimPhase('complete')
    }, 400 + STEPS.length * 450 + 200)
    timers.current.push(tDone)
  }

  return (
    <div className="max-w-[1200px] animate-fade-in space-y-6">
      {/* Header */}
      <div className="border-b border-[#1F2937] pb-4">
        <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
          <FlaskConical className="text-rose-500" size={24} />
          NETWORK STRESS LAB
        </h1>
        <p className="text-slate-400 text-xs font-mono mt-1 max-w-2xl">
          "What happens when the network is under pressure?"
          Run deterministic stress simulations to identify vulnerabilities before emergencies occur.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5 font-mono">
        {/* Controls Column */}
        <div className="space-y-4">
          <div className="rounded bg-[#111827] border border-[#1F2937] p-4 space-y-3">
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-300 border-b border-[#1F2937] pb-2">
              SIMULATION SCENARIO
            </h2>
            <div className="space-y-2">
              {STRESS_SCENARIOS.map(s => (
                <button
                  key={s.scenario_id}
                  onClick={() => { setSelectedScenario(s); setSimPhase('idle'); setResult(null) }}
                  className={cn(
                    'w-full rounded border px-3 py-2.5 text-left text-xs transition-colors',
                    selectedScenario.scenario_id === s.scenario_id
                      ? 'border-rose-800 bg-rose-950/40 text-white font-bold'
                      : 'border-[#1F2937] bg-[#0B0F14] text-slate-400 hover:text-white',
                  )}
                >
                  <div className="font-bold">{s.name}</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded bg-[#111827] border border-[#1F2937] p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold uppercase">Active Capacity Slider</span>
              <span className="text-rose-400 font-bold text-sm">{capacityPct}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={capacityPct}
              onChange={(e) => setCapacityPct(Number(e.target.value))}
              className="w-full accent-[#E11D48]"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>30% Crisis</span>
              <span>70% Baseline</span>
              <span>100% Full</span>
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={simPhase === 'running'}
            className="w-full py-3 rounded bg-[#E11D48] hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Zap size={16} /> RUN SIMULATION
          </button>
        </div>

        {/* Results / Execution Area */}
        <div className="col-span-2 space-y-4">
          {simPhase === 'running' && (
            <div className="rounded bg-[#111827] border border-[#1F2937] p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 animate-pulse">
                SIMULATION IN PROGRESS…
              </h3>
              <div className="space-y-2 pt-2">
                {STEPS.map((s, idx) => (
                  <SimStep key={s} label={s} visible={stepsVisible > idx} />
                ))}
              </div>
            </div>
          )}

          {simPhase === 'complete' && result && (
            <div className="space-y-4 animate-scale-in">
              <div className="rounded bg-[#111827] border border-rose-900/60 border-l-4 border-l-[#E11D48] p-5 space-y-4 shadow-md">
                <div className="flex justify-between items-center">
                  <h3 className="text-rose-400 font-bold text-sm uppercase tracking-wider">
                    NETWORK STRESS DETECTED
                  </h3>
                  <span className="px-2.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-xs uppercase font-bold">
                    CRITICAL IMPAIRMENT
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-[#0B0F14] border border-[#1F2937] p-3 rounded">
                    <div className="text-slate-400 text-[10px] uppercase">O− Coverage Drop</div>
                    <div className="text-xl font-bold text-rose-400">{result.o_neg_coverage_before}% → {result.o_neg_coverage_after}%</div>
                  </div>
                  <div className="bg-[#0B0F14] border border-[#1F2937] p-3 rounded">
                    <div className="text-slate-400 text-[10px] uppercase">Weakest Zone</div>
                    <div className="text-xl font-bold text-white">{result.weakest_zone}</div>
                  </div>
                  <div className="bg-[#0B0F14] border border-[#1F2937] p-3 rounded">
                    <div className="text-slate-400 text-[10px] uppercase">Response Delay</div>
                    <div className="text-xl font-bold text-amber-400">+{result.expected_delay_increase_percent}%</div>
                  </div>
                </div>
              </div>

              {/* Recommended Interventions */}
              <div className="rounded bg-[#111827] border border-[#1F2937] p-4 space-y-3">
                <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase border-b border-[#1F2937] pb-2">
                  RECOMMENDED INTERVENTIONS
                </h3>
                <div className="space-y-2.5">
                  {result.interventions.map((it, idx) => (
                    <InterventionCard
                      key={it.title}
                      rank={idx + 1}
                      title={it.title}
                      description={it.description}
                      impact={it.impact}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {simPhase === 'idle' && (
            <div className="rounded bg-[#111827] border border-[#1F2937] p-8 text-center space-y-3">
              <FlaskConical size={32} className="text-slate-500 mx-auto" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                READY FOR STRESS TESTING
              </h3>
              <p className="text-slate-400 text-xs font-sans max-w-md mx-auto">
                Select a scenario on the left and click "RUN SIMULATION" to evaluate community network resilience under peak stress.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
