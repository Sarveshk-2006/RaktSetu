// RAKTSETU — Create Incident Page (Multi-step flow)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, ArrowRight, Loader2 } from 'lucide-react'
import { BloodGroupBadge } from '@/components/ui/BloodGroupBadge'
import { cn } from '@/lib/utils'
import type { BloodGroup, IncidentUrgency } from '@/types'

type Step = 'form' | 'verifying' | 'verified' | 'created'

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
const URGENCY_LEVELS: IncidentUrgency[] = ['Critical', 'High', 'Moderate', 'Routine']

const VERIFICATION_CHECKS = [
  'Requesting facility verified',
  'Requirement received',
  'Blood group confirmed',
  'Unit requirement recorded',
  'Location confirmed',
]

export function CreateIncidentPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [checkedItems, setCheckedItems] = useState<number>(0)

  const [form, setForm] = useState({
    blood_group: 'O-' as BloodGroup,
    units: 2,
    urgency: 'Critical' as IncidentUrgency,
    zone: 'Wagholi, Pune',
    facility: 'Sahyadri Hospital, Hadapsar',
    source: 'Hospital',
  })

  function handleVerify() {
    setStep('verifying')
    let count = 0
    const interval = setInterval(() => {
      count++
      setCheckedItems(count)
      if (count >= VERIFICATION_CHECKS.length) {
        clearInterval(interval)
        setTimeout(() => setStep('verified'), 400)
      }
    }, 350)
  }

  function handleCreate() {
    setStep('created')
  }

  const urgencyColors: Record<IncidentUrgency, string> = {
    Critical: 'bg-red-700 hover:bg-red-600 border-red-600 text-white',
    High:     'bg-amber-700 hover:bg-amber-600 border-amber-600 text-white',
    Moderate: 'bg-blue-700 hover:bg-blue-600 border-blue-600 text-white',
    Routine:  'bg-slate-700 hover:bg-slate-600 border-slate-600 text-white',
  }

  return (
    <div className="max-w-[600px] animate-fade-in">
      <div className="mb-6">
        <button
          onClick={() => navigate('/incidents')}
          className="text-[12px] text-slate-500 hover:text-slate-300 mb-3 flex items-center gap-1"
        >
          ← Back to Incidents
        </button>
        <h1 className="text-xl font-bold text-white">Create Blood Incident</h1>
        <p className="text-slate-500 text-sm mt-0.5">Register a verified blood requirement</p>
      </div>

      {/* Step: Form */}
      {(step === 'form' || step === 'verifying') && (
        <div className="rounded-lg border border-white/10 bg-[#12121e] p-6 space-y-5">

          {/* Blood Group */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-400 mb-2">
              Blood Group
            </label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map(bg => (
                <button
                  key={bg}
                  onClick={() => setForm(f => ({ ...f, blood_group: bg }))}
                  className={cn(
                    'px-3 py-1.5 rounded border text-[12px] font-mono font-semibold transition-all',
                    form.blood_group === bg
                      ? 'bg-red-950/60 border-red-700 text-red-300'
                      : 'bg-white/4 border-white/10 text-slate-400 hover:border-white/20 hover:text-white',
                  )}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Units */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-400 mb-2">
              Units Required
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, units: n }))}
                  className={cn(
                    'w-10 h-10 rounded-lg border text-[14px] font-bold font-mono transition-all',
                    form.units === n
                      ? 'bg-white/15 border-white/40 text-white'
                      : 'bg-white/4 border-white/10 text-slate-400 hover:border-white/20 hover:text-white',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-400 mb-2">
              Urgency Level
            </label>
            <div className="flex gap-2">
              {URGENCY_LEVELS.map(u => (
                <button
                  key={u}
                  onClick={() => setForm(f => ({ ...f, urgency: u }))}
                  className={cn(
                    'px-3 py-1.5 rounded border text-[12px] font-semibold transition-all',
                    form.urgency === u
                      ? urgencyColors[u]
                      : 'bg-white/4 border-white/10 text-slate-400 hover:border-white/20 hover:text-white',
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-400 mb-2">
              Location
            </label>
            <input
              type="text"
              value={form.zone}
              onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
              className="w-full bg-white/4 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          {/* Facility */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-400 mb-2">
              Requesting Facility
            </label>
            <input
              type="text"
              value={form.facility}
              onChange={e => setForm(f => ({ ...f, facility: e.target.value }))}
              className="w-full bg-white/4 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-400 mb-2">
              Requirement Source
            </label>
            <select
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className="w-full bg-white/4 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-slate-300 focus:outline-none focus:border-white/25 transition-colors"
            >
              <option value="Hospital">Hospital</option>
              <option value="Blood Bank">Blood Bank</option>
              <option value="Community">Community</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* Summary preview */}
          <div className="flex items-center gap-3 p-3 rounded-md bg-white/4 border border-white/8">
            <BloodGroupBadge group={form.blood_group} size="lg" />
            <div>
              <p className="text-white font-semibold text-sm">
                {form.units} unit{form.units > 1 ? 's' : ''} · {form.urgency}
              </p>
              <p className="text-slate-400 text-[12px]">{form.zone}</p>
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={step === 'verifying'}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-[13px] transition-colors"
          >
            {step === 'verifying' ? (
              <><Loader2 size={15} className="animate-spin" /> Verifying…</>
            ) : (
              <>VERIFY REQUIREMENT <ArrowRight size={14} /></>
            )}
          </button>
        </div>
      )}

      {/* Step: Verification checks */}
      {step === 'verifying' && (
        <div className="mt-3 rounded-lg border border-white/10 bg-[#12121e] p-5 space-y-2 animate-fade-in">
          {VERIFICATION_CHECKS.map((check, i) => (
            <div key={check} className="flex items-center gap-2.5 text-[13px]">
              {i < checkedItems ? (
                <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
              ) : (
                <Circle size={15} className="text-slate-700 flex-shrink-0" />
              )}
              <span className={i < checkedItems ? 'text-white' : 'text-slate-600'}>{check}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step: Verified */}
      {step === 'verified' && (
        <div className="rounded-lg border border-green-900/40 bg-[#12121e] p-6 animate-scale-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-950 border border-green-800 flex items-center justify-center">
              <CheckCircle size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-green-400 font-bold text-sm tracking-wide uppercase">VERIFIED</p>
              <p className="text-slate-400 text-[12px]">All checks passed</p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {VERIFICATION_CHECKS.map(check => (
              <div key={check} className="flex items-center gap-2.5 text-[13px]">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                <span className="text-white">{check}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-white/4 border border-white/8 mb-4">
            <span className="text-slate-400 text-[12px]">Incident ID</span>
            <span className="font-mono font-bold text-white text-[13px]">INC-PN-48291</span>
          </div>

          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-[13px] tracking-wide transition-colors"
          >
            CREATE INCIDENT <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Step: Created */}
      {step === 'created' && (
        <div className="rounded-lg border border-green-900/40 bg-[#12121e] p-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-green-950 border border-green-800 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Incident Created</h2>
          <p className="font-mono text-[15px] text-red-400 font-bold mb-1">INC-PN-48291</p>
          <p className="text-slate-400 text-sm mb-6">O− · 2 Units · Critical · Wagholi</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/incidents/INC-PN-48291')}
              className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold text-[13px] transition-colors"
            >
              View Incident Command
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-[13px] transition-colors"
            >
              Back to Incidents
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
