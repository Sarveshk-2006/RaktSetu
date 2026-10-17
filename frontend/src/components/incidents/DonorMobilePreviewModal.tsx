// RAKTSETU — Interactive Donor Mobile Alert & Response Simulation Modal
// Implements the exact mobile donor interface showcased in Presentation Slide 3 & Slide 4
import { useState } from 'react'
import {
  X, CheckCircle2, Droplets, AlertTriangle, ThumbsUp, ThumbsDown, Check
} from 'lucide-react'
import { api } from '@/lib/api'

interface DonorMobilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  incidentId: string
  candidate: {
    donor_id: string
    blood_group: string
    distance_km?: number
    estimated_arrival_minutes?: number
    composite_score?: number
    explanation?: string
    reasons?: string[]
    zone?: string
  } | null
  facilityName?: string
  unitsRequested?: number
  urgency?: string
  onResponseSimulated?: (donorId: string, response: 'Accepted' | 'Declined') => void
}

export function DonorMobilePreviewModal({
  isOpen,
  onClose,
  incidentId,
  candidate,
  facilityName = 'Sahyadri Hospital, Hadapsar',
  unitsRequested = 2,
  urgency = 'Critical',
  onResponseSimulated,
}: DonorMobilePreviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [responseState, setResponseState] = useState<'idle' | 'accepted' | 'declined'>('idle')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  if (!isOpen || !candidate) return null

  const dist = candidate.distance_km ? candidate.distance_km.toFixed(1) : '3.1'
  const eta = candidate.estimated_arrival_minutes || Math.round(Number(dist) * 4) + 5

  async function handleDonorAction(action: 'Accepted' | 'Declined') {
    setIsSubmitting(true)
    try {
      await api.recordDonorResponse(incidentId, {
        contact_attempt_id: 1,
        response: action,
        actor: candidate?.donor_id || 'Donor Mobile App',
        distance_km: Number(dist),
        eta_minutes: eta,
        notes: action === 'Accepted' ? 'Donor confirmed willing to donate via mobile alert.' : 'Donor unavailable for this request.',
      })
      setResponseState(action === 'Accepted' ? 'accepted' : 'declined')
      setToastMessage(
        action === 'Accepted'
          ? `Donor ${candidate?.donor_id} accepted: Confirmed willing to travel. Note: Clinical blood unit fulfillment requires transfusion verification.`
          : `Donor ${candidate?.donor_id} indicated unavailable. Next candidate in wave active.`
      )
      if (onResponseSimulated && candidate?.donor_id) {
        onResponseSimulated(candidate.donor_id, action)
      }
    } catch (err: any) {
      console.warn('Response simulation error:', err)
      // In demo mode, trigger state update
      setResponseState(action === 'Accepted' ? 'accepted' : 'declined')
      if (onResponseSimulated && candidate?.donor_id) {
        onResponseSimulated(candidate.donor_id, action)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border-4 border-[#17212B] overflow-hidden flex flex-col my-auto">
        {/* Mobile Device Speaker Notch */}
        <div className="bg-[#17212B] h-6 w-full flex items-center justify-center relative">
          <div className="w-16 h-1.5 bg-[#2A3441] rounded-full" />
          <button
            onClick={onClose}
            className="absolute right-3 text-white/70 hover:text-white p-1"
            aria-label="Close Mobile Preview"
          >
            <X size={14} />
          </button>
        </div>

        {/* Mobile App Header */}
        <div className="px-4 py-3 bg-[#F8F9FA] border-b border-[#E6E8EC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#B42336] flex items-center justify-center text-white">
              <Droplets size={14} className="fill-white/20" />
            </div>
            <span className="font-display font-bold text-xs text-[#17212B] tracking-tight">
              रक्तसेतु RAKTSETU
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#EBFDF5] text-[#085D40] px-2 py-0.5 rounded-full border border-[#A6F4C5]">
            Donor App
          </span>
        </div>

        {/* Presentation Slide 3/4 Exact Content */}
        <div className="p-4 space-y-3.5 max-h-[560px] overflow-y-auto">
          {/* Header Card */}
          <div className="p-3.5 rounded-2xl bg-[#FEF3F2] border border-[#FECDCA] space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#B42336] text-white uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={11} /> {urgency} Request
              </span>
              <span className="text-[10px] font-bold text-[#16805D] bg-white px-2 py-0.5 rounded border border-[#A6F4C5]">
                ✓ Verified
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <h3 className="text-xl font-bold font-display text-[#912020]">
                  {candidate.blood_group} | {unitsRequested} Unit{unitsRequested > 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-[#475467] font-medium mt-0.5 truncate max-w-[200px]">
                  {facilityName}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#17212B] block">📍 {dist} km away</span>
                <span className="text-[10px] text-[#667085]">~{eta} mins arrival</span>
              </div>
            </div>
          </div>

          {/* Action Buttons from Slide 3 & 4 */}
          {responseState === 'idle' ? (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleDonorAction('Accepted')}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#B42336] hover:bg-[#861D2B] active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ThumbsUp size={15} />
                <span>I Can Donate</span>
              </button>
              <button
                onClick={() => handleDonorAction('Declined')}
                disabled={isSubmitting}
                className="w-full py-2 rounded-xl bg-[#F2F4F7] hover:bg-[#E4E7EC] active:scale-98 text-[#475467] font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <ThumbsDown size={14} />
                <span>Not Available</span>
              </button>
            </div>
          ) : responseState === 'accepted' ? (
            <div className="p-3.5 rounded-xl bg-[#EBFDF5] border border-[#A6F4C5] text-center space-y-1.5 animate-fade-in">
              <CheckCircle2 size={24} className="text-[#16805D] mx-auto" />
              <h4 className="text-xs font-bold text-[#085D40]">Donation Availability Confirmed!</h4>
              <p className="text-[11px] text-[#085D40] leading-snug">
                Thank you, Donor {candidate.donor_id}. Incident command has registered your willingness to travel to {facilityName}.
              </p>
              {toastMessage && (
                <div className="text-[10px] text-[#085D40] bg-white/80 p-2 rounded-lg border border-[#A6F4C5] mt-1 font-mono text-left">
                  {toastMessage}
                </div>
              )}
              <span className="inline-block text-[9px] font-mono text-[#667085] bg-white px-2 py-0.5 rounded border border-[#A6F4C5] mt-1">
                State: Willingness Confirmed (Clinical Units Pending Verification)
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E6E8EC] text-center space-y-1 animate-fade-in">
              <p className="text-xs font-bold text-[#667085]">Response Recorded: Unavailable</p>
              <p className="text-[10px] text-[#98A2B3]">
                Thank you for notifying us. You will not be contacted again for this wave.
              </p>
              {toastMessage && (
                <div className="text-[10px] text-[#667085] bg-white p-2 rounded-lg border border-[#E6E8EC] mt-1 font-mono text-left">
                  {toastMessage}
                </div>
              )}
            </div>
          )}

          {/* "Why You Were Selected?" Section (Exact Match to Presentation Slide 3) */}
          <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E6E8EC] space-y-2">
            <span className="text-xs font-bold text-[#17212B] block font-display">
              Why you were selected?
            </span>
            <div className="space-y-1.5 text-xs text-[#475467]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EBFDF5] text-[#16805D] flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} />
                </div>
                <span>Available now (Ready status)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EBFDF5] text-[#16805D] flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} />
                </div>
                <span>{dist} km away ({candidate.zone || 'Pune'} zone)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EBFDF5] text-[#16805D] flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} />
                </div>
                <span>High response history (Historical reliability)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EBFDF5] text-[#16805D] flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} />
                </div>
                <span>Low recent request load (Zero outreach in &gt;60 days)</span>
              </div>
            </div>
          </div>

          {/* Request Details Section (From Slide 4 Mockup) */}
          <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E6E8EC] space-y-2 text-xs">
            <span className="text-xs font-bold text-[#17212B] block font-display">
              Request Details
            </span>
            <div className="space-y-1 text-[#667085]">
              <div className="flex justify-between">
                <span>Incident Ref:</span>
                <span className="font-mono font-bold text-[#17212B]">{incidentId}</span>
              </div>
              <div className="flex justify-between">
                <span>Required By:</span>
                <span className="font-medium text-[#17212B]">Within 4 hours</span>
              </div>
              <div className="flex justify-between">
                <span>Patient Category:</span>
                <span className="font-medium text-[#17212B]">Emergency Trauma / Surgical</span>
              </div>
              <div className="flex justify-between">
                <span>Donor ID:</span>
                <span className="font-mono text-[#17212B]">{candidate.donor_id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-[#F2F4F7] border-t border-[#E6E8EC] flex items-center justify-between text-[11px] text-[#667085]">
          <span>Prototype Simulation Sandbox</span>
          <button
            onClick={onClose}
            className="font-bold text-[#17212B] hover:underline"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
