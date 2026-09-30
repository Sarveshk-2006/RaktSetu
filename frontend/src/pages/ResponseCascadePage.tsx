// RAKTSETU — Response Cascade Workspace Page
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, CheckCircle2, ShieldCheck, Phone,
  Clock, MapPin, Building2, ArrowRight,
  RefreshCw, Users, Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_INCIDENT } from '@/data/demoData'

export function ResponseCascadePage() {
  const navigate = useNavigate()
  const incident = DEMO_INCIDENT

  // Cascade Simulation State
  const [phase, setPhase] = useState<'idle' | 'wave1' | 'wave1_insufficient' | 'wave2' | 'fulfilled'>('idle')
  const [contactedDonors, setContactedDonors] = useState<string[]>([])
  const [confirmedDonors, setConfirmedDonors] = useState<string[]>([])
  const [unitsSecured, setUnitsSecured] = useState(1) // Starts with 1 from DEMO_INCIDENT
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const totalRequired = incident.requirement.units_required // 2

  function clearTimers() {
    timerRef.current.forEach(t => clearTimeout(t))
    timerRef.current = []
  }

  // Handle individual donor outreach
  const handleContactDonor = (donorId: string) => {
    if (!contactedDonors.includes(donorId)) {
      setContactedDonors(prev => [...prev, donorId])
      setToastMsg(`Outreach request dispatched to ${donorId}. Audit logged.`)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3500)
    }
  }

  // Full Response Cascade Simulation Workflow
  function startSimulation() {
    clearTimers()
    setPhase('wave1')
    setContactedDonors(['D1042'])
    setConfirmedDonors(['D1042'])
    setUnitsSecured(1)

    // Step 1: D3819 declined
    const t1 = setTimeout(() => {
      setContactedDonors(prev => [...prev, 'D3819'])
    }, 1200)
    timerRef.current.push(t1)

    // Step 2: D5127 NoResponse -> Wave 1 Insufficient
    const t2 = setTimeout(() => {
      setContactedDonors(prev => [...prev, 'D5127'])
      setPhase('wave1_insufficient')
    }, 2400)
    timerRef.current.push(t2)

    // Step 3: Trigger Wave 2
    const t3 = setTimeout(() => {
      setPhase('wave2')
      setContactedDonors(prev => [...prev, 'D8821'])
    }, 3800)
    timerRef.current.push(t3)

    // Step 4: D8821 Accepts -> Requirement Fulfilled!
    const t4 = setTimeout(() => {
      setConfirmedDonors(prev => [...prev, 'D8821'])
      setUnitsSecured(2)
      setPhase('fulfilled')
    }, 5200)
    timerRef.current.push(t4)
  }

  function resetSimulation() {
    clearTimers()
    setPhase('idle')
    setContactedDonors([])
    setConfirmedDonors([])
    setUnitsSecured(1)
  }

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl border border-gray-800 flex items-center gap-3 animate-slide-up">
          <Phone size={18} className="text-[#10B981]" />
          <div className="text-xs">
            <span className="font-bold block">Donor Dispatch Initiated</span>
            <span className="text-gray-400">{toastMsg}</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight flex items-center gap-2.5">
            <Zap size={24} className="text-[#E11D48]" />
            <span>Response Cascade</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Progressively mobilise capacity instead of broadcasting every request to everyone.
          </p>
        </div>

        <button
          onClick={() => navigate(`/incidents/${incident.incident_id}`)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E7EB] hover:bg-gray-50 text-xs font-semibold text-[#4B5563] transition-colors self-start sm:self-auto"
        >
          <span>View Incident Command</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Incident Header Summary Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-3 h-3 rounded-full bg-[#E11D48] animate-ping" />
            <span className="text-lg font-bold font-mono text-[#111827]">{incident.incident_id}</span>
            <span className="px-2.5 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold text-xs font-mono">
              {incident.requirement.blood_group}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] text-xs font-bold uppercase">
              {incident.requirement.urgency} · {totalRequired} UNITS
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Clock size={14} /> Created 08m 42s ago
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#059669]">
              <CheckCircle2 size={13} /> Verified Incident
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#4B5563] pt-1 border-t border-[#F3F4F6]">
          <span className="flex items-center gap-1 font-medium">
            <MapPin size={14} className="text-[#E11D48]" /> Location: {incident.requirement.location.zone}, Pune
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Building2 size={14} className="text-[#2563EB]" /> Facility: {incident.requirement.requesting_facility}
          </span>
        </div>

        {/* 5-Stage Horizontal Workflow Tracker */}
        <div className="pt-2">
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {/* Stage 1: Wave 1 */}
            <div className="p-3 rounded-xl border border-[#E11D48] bg-[#FFF1F2] space-y-1 relative">
              <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-bold flex items-center justify-center mx-auto text-xs">
                1
              </div>
              <div className="font-bold text-[#111827]">Wave 1</div>
              <div className="text-[10px] text-[#6B7280]">Local Donors</div>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E11D48] text-white mt-1">
                Current Stage
              </span>
            </div>

            {/* Stage 2: Wave 2 */}
            <div className={cn(
              'p-3 rounded-xl border space-y-1 transition-all',
              phase === 'wave2' || phase === 'fulfilled' ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E5E7EB] bg-gray-50'
            )}>
              <div className={cn('w-7 h-7 rounded-full font-bold flex items-center justify-center mx-auto text-xs', phase === 'wave2' || phase === 'fulfilled' ? 'bg-[#2563EB] text-white' : 'bg-gray-200 text-gray-600')}>
                2
              </div>
              <div className="font-bold text-[#111827]">Wave 2</div>
              <div className="text-[10px] text-[#6B7280]">Extended Network</div>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-200 text-gray-600 mt-1">
                {phase === 'wave2' ? 'Active' : phase === 'fulfilled' ? 'Complete' : 'Pending'}
              </span>
            </div>

            {/* Stage 3: Wave 3 */}
            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-gray-50 space-y-1">
              <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 font-bold flex items-center justify-center mx-auto text-xs">
                3
              </div>
              <div className="font-bold text-[#111827]">Wave 3</div>
              <div className="text-[10px] text-[#6B7280]">Partner Network</div>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-200 text-gray-600 mt-1">
                Pending
              </span>
            </div>

            {/* Stage 4: On Route */}
            <div className="p-3 rounded-xl border border-[#E5E7EB] bg-gray-50 space-y-1">
              <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 font-bold flex items-center justify-center mx-auto text-xs">
                4
              </div>
              <div className="font-bold text-[#111827]">On Route</div>
              <div className="text-[10px] text-[#6B7280]">Units in Transit</div>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-200 text-gray-600 mt-1">
                Pending
              </span>
            </div>

            {/* Stage 5: Fulfilled */}
            <div className={cn(
              'p-3 rounded-xl border space-y-1 transition-all',
              phase === 'fulfilled' ? 'border-[#10B981] bg-[#D1FAE5]' : 'border-[#E5E7EB] bg-gray-50'
            )}>
              <div className={cn('w-7 h-7 rounded-full font-bold flex items-center justify-center mx-auto text-xs', phase === 'fulfilled' ? 'bg-[#10B981] text-white' : 'bg-gray-200 text-gray-600')}>
                5
              </div>
              <div className="font-bold text-[#111827]">Fulfilled</div>
              <div className="text-[10px] text-[#6B7280]">Requirement Met</div>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-gray-200 text-gray-600 mt-1">
                {phase === 'fulfilled' ? 'Complete' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Active Wave & Candidate List (Col 8 / ~65%) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card 1: Wave 1 Active Card */}
          <div className="bg-white rounded-2xl border border-[#E11D48] p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E11D48] text-white font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-[#111827]">Wave 1 — Local Donor Activation</h3>
                  <p className="text-xs text-[#6B7280]">Contacting best matched donors within 5km radius.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold border border-[#FDE68A]">
                  In Progress
                </span>
                <span className="text-xs text-[#6B7280] font-mono">⏱ 08m 42s</span>
              </div>
            </div>

            {/* 4 Compact Wave Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <Users size={14} className="text-[#E11D48]" />
                  <span>Candidates</span>
                </div>
                <div className="text-xl font-bold font-display text-[#111827]">3</div>
                <span className="text-[10px] text-[#059669] font-semibold">High match score</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <Phone size={14} className="text-[#2563EB]" />
                  <span>Contacted</span>
                </div>
                <div className="text-xl font-bold font-display text-[#111827]">
                  {contactedDonors.length}
                </div>
                <span className="text-[10px] text-[#2563EB] font-semibold">
                  {Math.round((contactedDonors.length / 3) * 100)}% completed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <CheckCircle2 size={14} className="text-[#10B981]" />
                  <span>Confirmed</span>
                </div>
                <div className="text-xl font-bold font-display text-[#111827]">
                  {confirmedDonors.length}
                </div>
                <span className="text-[10px] text-[#10B981] font-semibold">
                  {Math.round((confirmedDonors.length / totalRequired) * 100)}% secured
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <Zap size={14} className="text-[#E11D48]" />
                  <span>Secured</span>
                </div>
                <div className="text-xl font-bold font-display text-[#E11D48]">
                  {unitsSecured} / {totalRequired}
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-[#E11D48]" style={{ width: `${(unitsSecured / totalRequired) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Candidate Donors List */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#111827] block">Selected Donors for Wave 1</span>

              {/* Donor #1: D1042 */}
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#E11D48] transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-[#6B7280]">#1</span>
                  <span className="font-mono font-bold text-sm text-[#111827]">D1042</span>
                  <span className="px-2 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold text-xs font-mono">
                    O-
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#059669]">
                    Ready
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                  <span>📍 3.2 km</span>
                  <span className="text-[#10B981] font-semibold">⚡ 92% response likelihood</span>
                  <button
                    onClick={() => handleContactDonor('D1042')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5',
                      contactedDonors.includes('D1042')
                        ? 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]'
                        : 'bg-white text-[#E11D48] border border-[#E11D48] hover:bg-[#FFF1F2]'
                    )}
                  >
                    <Phone size={13} />
                    <span>{contactedDonors.includes('D1042') ? 'Contacted ✓' : 'Contact Donor'}</span>
                  </button>
                </div>
              </div>

              {/* Donor #2: D3819 */}
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#E11D48] transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-[#6B7280]">#2</span>
                  <span className="font-mono font-bold text-sm text-[#111827]">D3819</span>
                  <span className="px-2 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold text-xs font-mono">
                    O-
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706]">
                    Available
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                  <span>📍 5.7 km</span>
                  <span className="text-[#10B981] font-semibold">⚡ 86% response likelihood</span>
                  <button
                    onClick={() => handleContactDonor('D3819')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5',
                      contactedDonors.includes('D3819')
                        ? 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]'
                        : 'bg-white text-[#E11D48] border border-[#E11D48] hover:bg-[#FFF1F2]'
                    )}
                  >
                    <Phone size={13} />
                    <span>{contactedDonors.includes('D3819') ? 'Contacted ✓' : 'Contact Donor'}</span>
                  </button>
                </div>
              </div>

              {/* Donor #3: D5127 */}
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#E11D48] transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-[#6B7280]">#3</span>
                  <span className="font-mono font-bold text-sm text-[#111827]">D5127</span>
                  <span className="px-2 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold text-xs font-mono">
                    O-
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706]">
                    Available
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                  <span>📍 7.1 km</span>
                  <span className="text-[#10B981] font-semibold">⚡ 81% response likelihood</span>
                  <button
                    onClick={() => handleContactDonor('D5127')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5',
                      contactedDonors.includes('D5127')
                        ? 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]'
                        : 'bg-white text-[#E11D48] border border-[#E11D48] hover:bg-[#FFF1F2]'
                    )}
                  >
                    <Phone size={13} />
                    <span>{contactedDonors.includes('D5127') ? 'Contacted ✓' : 'Contact Donor'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Future Cascade Waves Rows */}
          <div className="space-y-3">
            {/* Wave 2 */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center justify-between opacity-85">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">Wave 2 — Extended Network</h4>
                  <p className="text-[11px] text-[#6B7280]">Expands to city-wide donor network if required.</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                Pending
              </span>
            </div>

            {/* Wave 3 */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center justify-between opacity-85">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">Wave 3 — Partner Network</h4>
                  <p className="text-[11px] text-[#6B7280]">Activates partner hospitals, NGOs and regional network.</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                Pending
              </span>
            </div>

            {/* On Route */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center justify-between opacity-85">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-xs">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">On Route</h4>
                  <p className="text-[11px] text-[#6B7280]">Confirmed units in transit to hospital.</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                Pending
              </span>
            </div>
          </div>

          {/* Primary Action Button Bar */}
          <div className="pt-2 flex gap-3">
            {phase === 'idle' ? (
              <button
                onClick={startSimulation}
                className="w-full py-3.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                <span>START RESPONSE CASCADE SIMULATION →</span>
              </button>
            ) : (
              <button
                onClick={resetSimulation}
                className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-white text-xs font-bold text-[#4B5563] transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Reset Simulation</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Units Secured, Incident Details, Principles & Privacy (Col 4 / ~35%) */}
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
                  style={{ width: `${(unitsSecured / totalRequired) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-[#6B7280] font-semibold block">
                {Math.round((unitsSecured / totalRequired) * 100)}% Fulfilled
              </span>
            </div>
          </div>

          {/* Incident Details Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold font-display text-[#111827]">Incident Details</h3>

            <div className="space-y-2.5 text-xs text-[#4B5563]">
              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Blood Group</span>
                <span className="font-bold text-[#111827] font-mono">{incident.requirement.blood_group}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Units Required</span>
                <span className="font-bold text-[#111827]">{totalRequired} Units</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Priority</span>
                <span className="font-bold text-[#E11D48] uppercase">{incident.requirement.urgency}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Elapsed Time</span>
                <span className="font-bold text-[#111827]">08m 42s</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Location</span>
                <span className="font-bold text-[#111827]">{incident.requirement.location.zone}, Pune</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Hospital</span>
                <span className="font-bold text-[#111827]">{incident.requirement.requesting_facility}</span>
              </div>
            </div>
          </div>

          {/* Cascade Principles Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold font-display text-[#111827]">Cascade Principles</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827] block font-bold">Verified Requirement</strong>
                  <span className="text-[#6B7280]">Requirement confirmed before outreach.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Users size={18} className="text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827] block font-bold">Explainable Matching</strong>
                  <span className="text-[#6B7280]">Donors ranked by compatibility, proximity and reliability.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Zap size={18} className="text-[#E11D48] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827] block font-bold">Progressive Waves</strong>
                  <span className="text-[#6B7280]">Tiered outreach to maximise response rate.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Activity size={18} className="text-[#8B5CF6] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827] block font-bold">Deduplication</strong>
                  <span className="text-[#6B7280]">Prevents donor alert fatigue and ensures fair distribution.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Protected Card */}
          <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-4 shadow-2xs flex items-center gap-3 text-xs text-[#4B5563]">
            <ShieldCheck size={20} className="text-[#E11D48] shrink-0" />
            <div className="space-y-0.5">
              <strong className="text-[#E11D48] font-bold block">Privacy Protected</strong>
              <p className="text-[11px] text-[#6B7280]">
                Contact information is revealed only after the donor responds. All access is audit-logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
