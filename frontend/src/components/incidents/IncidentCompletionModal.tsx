// RAKTSETU — Incident Fulfilment & Completion Modal
// Implements Slide 4 Step 5 "Fulfil & Close" Prototype Demonstration Screen
import { CheckCircle2, ShieldCheck, Heart, Clock, Users, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface IncidentCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  incidentId: string
  bloodGroup: string
  unitsRequired: number
  unitsSecured: number
  facilityName: string
  responseTimeMinutes?: number
  donorsMobilisedCount?: number
}

export function IncidentCompletionModal({
  isOpen,
  onClose,
  incidentId,
  bloodGroup,
  unitsRequired,
  unitsSecured,
  facilityName,
  responseTimeMinutes = 19,
  donorsMobilisedCount = 2,
}: IncidentCompletionModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E6E8EC] overflow-hidden my-auto p-6 space-y-5 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full text-[#667085] hover:text-[#17212B] hover:bg-[#F3F4F6]"
          aria-label="Close Completion Summary"
        >
          <X size={18} />
        </button>

        {/* Hero Success Badge */}
        <div className="w-16 h-16 rounded-full bg-[#EBFDF5] border-2 border-[#A6F4C5] flex items-center justify-center mx-auto text-[#16805D] shadow-sm animate-scale-up">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>

        {/* Header from Slide 4 Step 5 */}
        <div className="space-y-1">
          <span className="text-xs font-mono font-bold text-[#16805D] bg-[#EBFDF5] px-3 py-1 rounded-full border border-[#A6F4C5]">
            Requirement Fulfilled!
          </span>
          <h2 className="text-2xl font-bold font-display text-[#17212B] tracking-tight pt-2">
            {incidentId}
          </h2>
          <p className="text-xs text-[#667085]">
            {bloodGroup} · {unitsSecured} of {unitsRequired} Unit{unitsRequired > 1 ? 's' : ''} Secured for {facilityName}
          </p>
        </div>

        {/* Key Metrics Grid from Slide 4 Step 5 */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E6E8EC] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#667085]">
              <Clock size={14} className="text-[#3567B7]" />
              <span>Response Time</span>
            </div>
            <div className="text-lg font-bold font-display text-[#17212B]">
              ~{responseTimeMinutes} minutes
            </div>
            <span className="text-[10px] text-[#16805D] font-semibold block">Under target SLA</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E6E8EC] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#667085]">
              <Users size={14} className="text-[#B42336]" />
              <span>Donors Mobilised</span>
            </div>
            <div className="text-lg font-bold font-display text-[#17212B]">
              {donorsMobilisedCount} confirmed
            </div>
            <span className="text-[10px] text-[#667085] font-semibold block">Zero duplicate outreach</span>
          </div>
        </div>

        {/* Slide 4 Step 5: "Thank you Messages sent to donors" Banner */}
        <div className="p-3.5 rounded-2xl bg-[#FEF3F2] border border-[#FECDCA] text-xs text-left flex items-start gap-3">
          <Heart size={18} className="text-[#B42336] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#912020] block">Donor Appreciation & Telemetry Updated</span>
            <span className="text-[#475467]">
              Simulated Thank-You notifications recorded for mobilised donors. 90-day cooldown schedule activated to prevent outreach fatigue.
            </span>
          </div>
        </div>

        {/* Verified Ledger Footnote */}
        <div className="p-3 rounded-xl bg-[#EBFDF5] border border-[#A6F4C5] text-[11px] text-[#085D40] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} />
            <span className="font-semibold">Cryptographic Audit Entry Appended</span>
          </div>
          <button
            onClick={() => navigate('/audit')}
            className="font-bold underline hover:text-[#053827]"
          >
            Inspect Ledger
          </button>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#17212B] hover:bg-black text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>View Incident Summary</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
