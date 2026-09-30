// RAKTSETU — Response Cascade Page (HERO EXPERIENCE #1)
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, XCircle, AlertCircle,
  Zap, ArrowDown, ArrowRight
} from 'lucide-react'
import { BloodGroupBadge } from '@/components/ui/BloodGroupBadge'
import { cn, formatTime } from '@/lib/utils'
import { CASCADE_FEED, DEMO_INCIDENT } from '@/data/demoData'
import type { ResponseEvent } from '@/types'

type CascadePhase =
  | 'idle'
  | 'wave1'
  | 'wave1_insufficient'
  | 'wave2'
  | 'fulfilled'

interface CascadeState {
  phase: CascadePhase
  events: ResponseEvent[]
  wave1Confirmed: number
  wave2Confirmed: number
  unitsSec: number
  unitsNeeded: number
  totalContacted: number
  duplicatesAvoided: number
}

function ResponseRow({ event, delay }: { event: ResponseEvent; delay: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const icon = event.response === 'Accepted'
    ? <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
    : event.response === 'Declined'
    ? <XCircle size={15} className="text-rose-400 flex-shrink-0" />
    : <AlertCircle size={15} className="text-slate-500 flex-shrink-0" />

  const responseText: Record<string, string> = {
    Accepted:   'I CAN HELP',
    Declined:   'NOT AVAILABLE',
    NoResponse: 'NO RESPONSE',
    Pending:    'PENDING…',
  }

  return (
    <div className={cn(
      'flex items-center gap-3 py-2 border-b border-[#1F2937] transition-all duration-300 font-mono text-xs',
      visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
    )}>
      {icon}
      <div className="flex-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">{formatTime(event.timestamp)}</span>
          <span className="font-bold text-white">{event.donor_id}</span>
          <BloodGroupBadge group={event.blood_group} size="sm" />
          <span className="text-slate-400">{event.distance_km} km</span>
        </div>
        <span className={cn(
          'font-semibold tracking-wider uppercase text-[11px]',
          event.response === 'Accepted' ? 'text-emerald-400' :
          event.response === 'Declined' ? 'text-rose-400' : 'text-slate-500',
        )}>
          {responseText[event.response]}
        </span>
      </div>
    </div>
  )
}

function WaveBlock({
  waveNum, status, contacted, confirmed, unitsSec, active
}: {
  waveNum: number; status: 'pending' | 'active' | 'insufficient' | 'complete'
  contacted: number; confirmed: number; unitsSec: number; active: boolean
}) {
  const statusStyles = {
    pending:      'border-[#1F2937] bg-[#111827] text-slate-500',
    active:       'border-amber-800/60 bg-amber-950/20 text-amber-400',
    insufficient: 'border-rose-900/60 bg-rose-950/20 text-rose-400',
    complete:     'border-emerald-900/60 bg-emerald-950/20 text-emerald-400',
  }

  return (
    <div className={cn(
      'rounded border p-4 transition-all duration-300',
      statusStyles[status],
    )}>
      <div className="flex items-center justify-between mb-3 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider uppercase">
            WAVE {waveNum} · {waveNum === 1 ? 'HIGH CONFIDENCE' : 'SECONDARY NETWORK'}
          </span>
          {status === 'active' && (
            <span className="text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded animate-pulse">
              LIVE
            </span>
          )}
          {status === 'insufficient' && (
            <span className="text-[10px] text-rose-400 bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded">
              INSUFFICIENT
            </span>
          )}
          {status === 'complete' && (
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 size={10} /> COMPLETE
            </span>
          )}
        </div>
        {active && <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center font-mono">
        <div className="bg-[#0B0F14] border border-[#1F2937] p-2 rounded">
          <div className="text-xl font-bold text-white">{contacted}</div>
          <div className="text-[10px] text-slate-400 uppercase">Contacted</div>
        </div>
        <div className="bg-[#0B0F14] border border-[#1F2937] p-2 rounded">
          <div className="text-xl font-bold text-white">{confirmed}</div>
          <div className="text-[10px] text-slate-400 uppercase">Confirmed</div>
        </div>
        <div className="bg-[#0B0F14] border border-[#1F2937] p-2 rounded">
          <div className={cn('text-xl font-bold', unitsSec > 0 ? 'text-emerald-400' : 'text-white')}>{unitsSec}</div>
          <div className="text-[10px] text-slate-400 uppercase">Units Secured</div>
        </div>
      </div>
    </div>
  )
}

export function ResponseCascadePage() {
  const navigate = useNavigate()
  const [state, setState] = useState<CascadeState>({
    phase: 'idle',
    events: [],
    wave1Confirmed: 0,
    wave2Confirmed: 0,
    unitsSec: 0,
    unitsNeeded: 2,
    totalContacted: 0,
    duplicatesAvoided: 0,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearTimers() {
    timerRef.current.forEach(t => clearTimeout(t))
    timerRef.current = []
  }

  function startDemo() {
    clearTimers()
    setState({
      phase: 'wave1', events: [], wave1Confirmed: 0, wave2Confirmed: 0,
      unitsSec: 0, unitsNeeded: 2, totalContacted: 0, duplicatesAvoided: 0,
    })

    const schedule = [
      { delay: 600,  event: CASCADE_FEED[0] },  // D1042: Accepted
      { delay: 1500, event: CASCADE_FEED[1] },  // D3819: Declined
      { delay: 2400, event: CASCADE_FEED[2] },  // D5127: NoResponse
    ]

    schedule.forEach(({ delay, event }) => {
      const t = setTimeout(() => {
        setState(prev => {
          const newEvents = [...prev.events, event]
          const accepted = newEvents.filter(e => e.response === 'Accepted').length
          return {
            ...prev,
            events: newEvents,
            wave1Confirmed: accepted,
            unitsSec: accepted,
            totalContacted: prev.totalContacted + 1,
          }
        })
      }, delay)
      timerRef.current.push(t)
    })

    const t1 = setTimeout(() => {
      setState(prev => ({ ...prev, phase: 'wave1_insufficient' }))
    }, 3400)
    timerRef.current.push(t1)

    const t2 = setTimeout(() => {
      setState(prev => ({ ...prev, phase: 'wave2', duplicatesAvoided: 6 }))
    }, 4500)
    timerRef.current.push(t2)

    const t3 = setTimeout(() => {
      const event = CASCADE_FEED[3] // D8821: Accepted
      setState(prev => ({
        ...prev,
        events: [...prev.events, event],
        wave2Confirmed: 1,
        unitsSec: 2,
        totalContacted: prev.totalContacted + 1,
      }))
    }, 5800)
    timerRef.current.push(t3)

    const t4 = setTimeout(() => {
      const event = CASCADE_FEED[4] // D2234: Declined
      setState(prev => ({
        ...prev,
        events: [...prev.events, event],
        totalContacted: prev.totalContacted + 1,
      }))
    }, 7000)
    timerRef.current.push(t4)

    const t5 = setTimeout(() => {
      setState(prev => ({ ...prev, phase: 'fulfilled' }))
    }, 8200)
    timerRef.current.push(t5)
  }

  function resetDemo() {
    clearTimers()
    setState({
      phase: 'idle', events: [], wave1Confirmed: 0, wave2Confirmed: 0,
      unitsSec: 0, unitsNeeded: 2, totalContacted: 0, duplicatesAvoided: 0,
    })
  }

  const wave1Events = state.events.slice(0, 3)
  const wave2Events = state.events.slice(3)

  const wave1Status =
    state.phase === 'idle' || state.phase === 'wave1' ? (state.phase === 'wave1' && state.events.length > 0 ? 'active' : 'pending') :
    'insufficient'

  const wave2Status =
    state.phase === 'wave2' || state.phase === 'fulfilled'
      ? (state.phase === 'fulfilled' ? 'complete' : 'active')
      : 'pending'

  return (
    <div className="max-w-[1200px] animate-fade-in space-y-6">
      <div className="border-b border-[#1F2937] pb-4">
        <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
          <Zap className="text-amber-400" size={24} />
          RESPONSE CASCADE
        </h1>
        <p className="text-slate-400 text-xs font-mono mt-1 max-w-2xl">
          "Progressively mobilise capacity instead of broadcasting every request to everyone."
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="rounded bg-[#111827] border border-rose-900/60 border-l-4 border-l-[#E11D48] p-4 flex items-center justify-between font-mono">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-pulse" />
              <span className="text-sm font-bold text-white">{DEMO_INCIDENT.incident_id}</span>
              <BloodGroupBadge group="O-" size="sm" />
              <span className="text-xs text-rose-400 font-semibold">CRITICAL · 2 UNITS</span>
            </div>
            <span className="text-xs text-slate-400">Wagholi · Sahyadri Hospital</span>
          </div>

          <div className="space-y-3">
            <div className="rounded bg-emerald-950/20 border border-emerald-800/40 p-3 flex items-center gap-2.5 font-mono text-xs text-emerald-400 font-semibold">
              <CheckCircle2 size={16} />
              <span>VERIFIED INCIDENT REQUISITION</span>
            </div>

            <div className="flex justify-center"><ArrowDown size={16} className="text-slate-600" /></div>

            <WaveBlock
              waveNum={1}
              status={wave1Status === 'pending' && state.phase !== 'idle' ? 'active' : wave1Status === 'active' ? 'active' : wave1Status}
              contacted={state.phase === 'idle' ? 0 : 5}
              confirmed={state.wave1Confirmed}
              unitsSec={state.wave1Confirmed}
              active={state.phase === 'wave1'}
            />

            {wave1Events.length > 0 && (
              <div className="ml-4 rounded bg-[#0B0F14] border border-[#1F2937] p-3 space-y-1">
                {wave1Events.map(e => (
                  <ResponseRow key={e.donor_id} event={e} delay={0} />
                ))}
              </div>
            )}

            {(state.phase === 'wave1_insufficient' || state.phase === 'wave2' || state.phase === 'fulfilled') && (
              <div className="rounded bg-amber-950/30 border border-amber-900/50 p-3 flex items-center justify-between font-mono text-xs text-amber-400">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span className="font-bold">INSUFFICIENT CAPACITY — Wave 2 Activated</span>
                </div>
                <span className="text-[11px] text-amber-500">{state.duplicatesAvoided} duplicate outreach requests avoided</span>
              </div>
            )}

            {(state.phase === 'wave2' || state.phase === 'fulfilled') && (
              <>
                <div className="flex justify-center"><ArrowDown size={16} className="text-slate-600" /></div>

                <WaveBlock
                  waveNum={2}
                  status={wave2Status}
                  contacted={wave2Events.length > 0 ? 4 : 0}
                  confirmed={state.wave2Confirmed}
                  unitsSec={state.wave2Confirmed}
                  active={state.phase === 'wave2'}
                />

                {wave2Events.length > 0 && (
                  <div className="ml-4 rounded bg-[#0B0F14] border border-[#1F2937] p-3 space-y-1">
                    {wave2Events.map(e => (
                      <ResponseRow key={e.donor_id} event={e} delay={0} />
                    ))}
                  </div>
                )}
              </>
            )}

            {state.phase === 'fulfilled' && (
              <div className="rounded bg-emerald-950/40 border border-emerald-700/60 p-5 space-y-4 font-mono animate-scale-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                    <div>
                      <h3 className="text-emerald-400 font-bold text-base font-display">INCIDENT FULFILLED ✓</h3>
                      <p className="text-slate-300 text-xs">2 / 2 units secured in 11m 24s</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  <div className="bg-[#0B0F14] border border-[#1F2937] p-2.5 rounded">
                    <div className="text-lg font-bold text-white">11m 24s</div>
                    <div className="text-[10px] text-slate-400 uppercase">Response Time</div>
                  </div>
                  <div className="bg-[#0B0F14] border border-[#1F2937] p-2.5 rounded">
                    <div className="text-lg font-bold text-white">{state.totalContacted}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Donors Contacted</div>
                  </div>
                  <div className="bg-[#0B0F14] border border-[#1F2937] p-2.5 rounded">
                    <div className="text-lg font-bold text-white">3</div>
                    <div className="text-[10px] text-slate-400 uppercase">Responses</div>
                  </div>
                  <div className="bg-[#0B0F14] border border-[#1F2937] p-2.5 rounded">
                    <div className="text-lg font-bold text-emerald-400">{state.duplicatesAvoided}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Duplicates Avoided</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetDemo}
                    className="flex-1 py-2 rounded border border-emerald-800 text-emerald-300 text-xs font-bold hover:bg-emerald-900/30 transition-colors uppercase"
                  >
                    Close Incident
                  </button>
                  <button
                    onClick={() => navigate('/intelligence')}
                    className="flex-1 py-2 rounded bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-bold transition-colors uppercase flex items-center justify-center gap-1.5"
                  >
                    Network Intelligence Updated <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            {state.phase === 'idle' ? (
              <button
                onClick={startDemo}
                className="w-full py-3 rounded bg-[#E11D48] hover:bg-rose-700 text-white font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Zap size={16} /> START RESPONSE CASCADE SIMULATION
              </button>
            ) : (
              <button
                onClick={resetDemo}
                className="px-4 py-2 rounded bg-[#161E2E] border border-[#1F2937] text-slate-400 hover:text-white font-mono text-xs"
              >
                Reset Cascade Demo
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded bg-[#111827] border border-[#1F2937] p-4 text-center space-y-3 font-mono">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
              UNITS SECURED METRIC
            </h3>
            <div className={cn(
              'text-5xl font-bold font-mono transition-colors',
              state.unitsSec >= state.unitsNeeded ? 'text-emerald-400' : 'text-amber-400'
            )}>
              {state.unitsSec} / {state.unitsNeeded}
            </div>
            <p className="text-xs text-slate-400">Verified Units Confirmed</p>
            <div className="h-2 rounded bg-[#0B0F14] overflow-hidden border border-[#1F2937]">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  state.unitsSec >= state.unitsNeeded ? 'bg-emerald-500' : 'bg-amber-500'
                )}
                style={{ width: `${(state.unitsSec / state.unitsNeeded) * 100}%` }}
              />
            </div>
          </div>

          <div className="rounded bg-[#111827] border border-[#1F2937] p-4 space-y-3">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300 border-b border-[#1F2937] pb-2">
              CASCADE PRINCIPLES
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong className="text-white">Verified Need:</strong> Requirement confirmed before outreach</span>
              </div>
              <div className="flex gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong className="text-white">Explainable Matching:</strong> Donor readiness score</span>
              </div>
              <div className="flex gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong className="text-white">Progressive Waves:</strong> Tiered cohort outreach</span>
              </div>
              <div className="flex gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong className="text-white">Deduplication:</strong> Prevents donor alert fatigue</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
