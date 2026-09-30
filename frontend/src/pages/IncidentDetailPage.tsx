// RAKTSETU — Incident Command Page (Screen 4)
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, Zap, Info, Activity, Navigation, ArrowLeft
} from 'lucide-react'
import { BloodGroupBadge } from '@/components/ui/BloodGroupBadge'
import { cn, readinessColor } from '@/lib/utils'
import { DEMO_INCIDENT, DEMO_CANDIDATES, ALL_INCIDENTS } from '@/data/demoData'
import type { DonorCandidate, Incident } from '@/types'

function DonorCandidateCard({
  candidate, rank, expanded, onToggle, onContact
}: {
  candidate: DonorCandidate
  rank: number
  expanded: boolean
  onToggle: () => void
  onContact: () => void
}) {
  const confidencePct = Math.round(candidate.match_confidence * 100)
  const likelihoodPct = Math.round(candidate.response_likelihood * 100)

  return (
    <div className={cn(
      'rounded bg-[#111827] border transition-all duration-200 shadow-sm',
      rank === 1 ? 'border-rose-800/60 border-l-4 border-l-[#E11D48]' : 'border-[#1F2937]',
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left font-mono"
      >
        <div className={cn(
          'w-8 h-8 rounded border flex items-center justify-center text-xs font-bold font-mono flex-shrink-0',
          rank === 1 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-[#161E2E] border-[#1F2937] text-slate-400',
        )}>
          #{rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-white">{candidate.donor_id}</span>
            <BloodGroupBadge group={candidate.blood_group} size="sm" />
            <span className={cn('text-xs font-semibold', readinessColor(candidate.availability))}>
              {candidate.availability}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Navigation size={11} className="text-sky-400" /> {candidate.distance_km} km
            </span>
            <span className="flex items-center gap-1">
              <Activity size={11} className="text-emerald-400" /> {likelihoodPct}% response likelihood
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-xl font-bold font-mono text-white">{confidencePct}</div>
          <div className="text-[10px] text-slate-400 uppercase">Match Score</div>
        </div>

        <ChevronRight size={16} className={cn('text-slate-500 transition-transform flex-shrink-0', expanded && 'rotate-90')} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#1F2937] pt-4 space-y-3 font-mono">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
              <span className="text-slate-400">Compatibility:</span>
              <span className="text-emerald-400 font-bold">✓ Direct Match</span>
            </div>
            <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
              <span className="text-slate-400">Availability:</span>
              <span className="text-emerald-400 font-bold">Available Now</span>
            </div>
            <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
              <span className="text-slate-400">Distance:</span>
              <span className="text-white font-bold">{candidate.distance_km} km</span>
            </div>
            <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
              <span className="text-slate-400">Response Likelihood:</span>
              <span className="text-white font-bold">{likelihoodPct}%</span>
            </div>
            <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
              <span className="text-slate-400">Recent Load:</span>
              <span className="text-emerald-400 font-bold">{candidate.recent_load_level}</span>
            </div>
            <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
              <span className="text-slate-400">Contact Reliability:</span>
              <span className="text-emerald-400 font-bold">{candidate.contact_reliability_level}</span>
            </div>
          </div>

          <div className="rounded bg-[#0B0F14] border border-[#1F2937] p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Info size={13} /> PRIVACY SAFE CONTACT DETAILS
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              Contact information is unlocked only after the donor responds. Access is audit-logged.
            </p>
          </div>

          <button
            onClick={onContact}
            className="w-full py-2 rounded bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Add Candidate to Wave 1 Cohort
          </button>
        </div>
      )}
    </div>
  )
}

const WORKFLOW = ['Verified', 'Matching', 'Mobilising', 'Fulfilled'] as const

function WorkflowStepper({ currentStatus }: { currentStatus: string }) {
  const currentIdx = WORKFLOW.indexOf(currentStatus as typeof WORKFLOW[number])
  return (
    <div className="flex items-center gap-1 font-mono">
      {WORKFLOW.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={step} className="flex items-center">
            <div className={cn(
              'px-3 py-1 rounded text-xs font-bold uppercase tracking-wider',
              active ? 'bg-amber-950 text-amber-400 border border-amber-800' :
              done ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40' : 'text-slate-500 bg-[#0B0F14] border border-[#1F2937]',
            )}>
              {step}
            </div>
            {i < WORKFLOW.length - 1 && (
              <div className={cn('w-4 h-px mx-1', done || active ? 'bg-emerald-500/50' : 'bg-[#1F2937]')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>('D1042')

  const incident: Incident = ALL_INCIDENTS.find(i => i.incident_id === id) ?? DEMO_INCIDENT
  const { requirement: req } = incident
  const wave1Candidates = DEMO_CANDIDATES.filter(c => c.wave === 1)

  return (
    <div className="max-w-[1200px] animate-fade-in space-y-5">
      <button
        onClick={() => navigate('/incidents')}
        className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5"
      >
        <ArrowLeft size={14} /> Back to Incidents
      </button>

      {/* Header Banner */}
      <div className="rounded bg-[#111827] border border-[#1F2937] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-white tracking-widest">
              {incident.incident_id}
            </span>
            <BloodGroupBadge group={req.blood_group} size="md" />
            <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono font-bold uppercase">
              {req.urgency} · {req.units_required} UNITS
            </span>
          </div>
          <WorkflowStepper currentStatus={incident.status} />
        </div>

        <div className="grid grid-cols-4 gap-4 text-xs font-mono text-slate-300">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Location</span>
            <span className="font-bold text-white">{req.location.zone} · {req.requesting_facility}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Requirement</span>
            <span className="font-bold text-white">{req.units_required} Units ({req.source})</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Status</span>
            <span className="font-bold text-amber-400">{incident.status}</span>
          </div>
          <div className="text-right">
            <button
              onClick={() => navigate('/response')}
              className="px-4 py-2 rounded bg-[#E11D48] hover:bg-rose-700 text-white font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 ml-auto"
            >
              <Zap size={14} /> LAUNCH RESPONSE CASCADE
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 font-mono">
            <h2 className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              RECOMMENDED DONOR CAPACITY (WAVE 1)
            </h2>
            <span className="text-xs text-emerald-400 font-semibold">{wave1Candidates.length} Candidates Ranked</span>
          </div>

          <div className="space-y-3">
            {wave1Candidates.map((c, i) => (
              <DonorCandidateCard
                key={c.donor_id}
                candidate={c}
                rank={i + 1}
                expanded={expandedId === c.donor_id}
                onToggle={() => setExpandedId(expandedId === c.donor_id ? null : c.donor_id)}
                onContact={() => navigate('/response')}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 font-mono">
          <div className="rounded bg-[#111827] border border-[#1F2937] p-4 space-y-3">
            <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase border-b border-[#1F2937] pb-2">
              WHY THESE DONORS?
            </h3>
            <p className="text-slate-400 text-xs font-sans">
              RAKTSETU ranks candidates using an explainable multi-factor mobilization algorithm:
            </p>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2 rounded bg-[#0B0F14] border border-[#1F2937]">
                <div className="text-emerald-400 font-bold mb-0.5">1. Blood Group Compatibility</div>
                <div className="text-[11px] text-slate-400">Strict antigen match for O- universal recipient safety.</div>
              </div>
              <div className="p-2 rounded bg-[#0B0F14] border border-[#1F2937]">
                <div className="text-sky-400 font-bold mb-0.5">2. Distance & Travel Time</div>
                <div className="text-[11px] text-slate-400">Proximity priority (under 5 km radius first cohort).</div>
              </div>
              <div className="p-2 rounded bg-[#0B0F14] border border-[#1F2937]">
                <div className="text-amber-400 font-bold mb-0.5">3. Historical Response Rate</div>
                <div className="text-[11px] text-slate-400">92%+ probability score derived from past responses.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
