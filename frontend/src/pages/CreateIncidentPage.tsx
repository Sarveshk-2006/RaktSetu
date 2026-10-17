// RAKTSETU — Create Blood Incident / Requirement Page
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Droplets, MapPin,
  Building2, Phone, User,
  CheckCircle2, Loader2, ShieldAlert,
  Clock, Flame, AlertCircle, ShieldCheck
} from 'lucide-react'

import { PuneNetworkMap } from '@/components/overview/PuneNetworkMap'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { BloodGroup, IncidentUrgency } from '@/types'

type Step = 'form' | 'submitting' | 'created'

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
const UNITS_OPTIONS = [1, 2, 3, 4, 5, 6]

const ZONE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Wagholi, Pune': { lat: 18.579, lng: 73.981 },
  'Hadapsar, Pune': { lat: 18.502, lng: 73.927 },
  'Kothrud, Pune': { lat: 18.507, lng: 73.807 },
  'Hinjawadi, Pune': { lat: 18.591, lng: 73.738 },
  'Baner, Pune': { lat: 18.559, lng: 73.780 },
  'Aundh, Pune': { lat: 18.563, lng: 73.807 },
  'Shivajinagar, Pune': { lat: 18.531, lng: 73.844 },
  'Viman Nagar, Pune': { lat: 18.567, lng: 73.914 },
  'Yerawada, Pune': { lat: 18.553, lng: 73.882 },
  'Pimpri Chinchwad, Pune': { lat: 18.628, lng: 73.800 },
}

const URGENCY_OPTIONS: { level: IncidentUrgency; label: string; desc: string; icon: typeof AlertTriangle; activeColor: string }[] = [
  {
    level: 'Critical',
    label: 'Critical',
    desc: 'Immediate response required',
    icon: Flame,
    activeColor: 'border-[#B42336] bg-[#FEF3F2] text-[#912020]',
  },
  {
    level: 'High',
    label: 'High',
    desc: 'Within 2–6 hours',
    icon: ShieldAlert,
    activeColor: 'border-[#B7791F] bg-[#FEF7EC] text-[#8D5A0F]',
  },
  {
    level: 'Moderate',
    label: 'Moderate',
    desc: 'Within 6–24 hours',
    icon: Clock,
    activeColor: 'border-[#3567B7] bg-[#EFF4FB] text-[#234B8E]',
  },
  {
    level: 'Routine',
    label: 'Routine',
    desc: 'Planned requisition',
    icon: Building2,
    activeColor: 'border-[#667085] bg-[#F8F9FA] text-[#17212B]',
  },
]

export function CreateIncidentPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdIncident, setCreatedIncident] = useState<any | null>(null)
  const [duplicateAdvisory, setDuplicateAdvisory] = useState<{
    duplicate_found: boolean
    incident_id?: string
    message?: string
  } | null>(null)

  const [form, setForm] = useState({
    blood_group: 'O-' as BloodGroup,
    units: 2,
    urgency: 'Critical' as IncidentUrgency,
    zone: 'Wagholi, Pune',
    facility: 'Sahyadri Hospital, Hadapsar',
    source: 'Hospital',
    contactPerson: 'Dr. A. Sharma',
    contactNumber: '+91 98765 43210',
    clinicalNotes: '',
  })

  // Unified Blood Incident: Live duplicate check as operator specifies hospital & blood group
  useEffect(() => {
    let active = true
    if (form.facility && form.blood_group) {
      const timer = setTimeout(() => {
        api.checkDuplicateRequirement({ facility: form.facility, blood_group: form.blood_group })
          .then(res => {
            if (active) setDuplicateAdvisory(res)
          })
          .catch(() => {
            if (active) setDuplicateAdvisory(null)
          })
      }, 250)
      return () => {
        active = false
        clearTimeout(timer)
      }
    } else {
      setDuplicateAdvisory(null)
    }
  }, [form.facility, form.blood_group])

  async function handleSubmitRequirement(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!form.facility.trim()) {
      setError('Please provide the requesting medical facility or hospital.')
      return
    }
    if (!form.zone.trim()) {
      setError('Please select a geographic zone for response matching.')
      return
    }
    if (form.units < 1 || form.units > 50) {
      setError('Units requested must be between 1 and 50.')
      return
    }

    setStep('submitting')

    const cleanZone = form.zone.replace(', Pune', '').trim()
    const coords = ZONE_COORDINATES[form.zone] || { lat: 18.5204, lng: 73.8567 }

    try {
      const result = await api.createIncident({
        blood_group: form.blood_group,
        component: 'Whole Blood',
        units_requested: form.units,
        urgency: form.urgency,
        requesting_facility: form.facility,
        zone: cleanZone,
        district: 'Pune',
        lat: coords.lat,
        lng: coords.lng,
        source: form.source,
        auto_verify: false,
        actor: form.contactPerson || 'Attending Physician',
      })

      setCreatedIncident(result)
      setStep('created')
    } catch (err: any) {
      console.error('Incident creation failed:', err)
      setError(err?.message || 'Failed to create requirement on authoritative server. Please check all fields.')
      setStep('form')
    }
  }

  async function handleVerifyNow() {
    if (!createdIncident?.incident_id) return
    setIsVerifying(true)
    setError(null)
    try {
      const verified = await api.verifyIncident(createdIncident.incident_id, {
        actor: form.contactPerson || 'Authorized Clinical Officer',
        clinical_approval: true,
        verification_notes: 'Clinical approval confirmed via emergency creation portal.',
      })
      setCreatedIncident(verified)
    } catch (err: any) {
      console.error('Verification failed:', err)
      setError(err?.message || 'Verification transition rejected by backend lifecycle rules.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1600px] mx-auto pb-12">
      {/* Back Link & Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E6E8EC]">
        <div>
          <button
            onClick={() => navigate('/incidents')}
            className="text-xs font-semibold text-[#667085] hover:text-[#17212B] mb-1.5 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Incidents Work Queue
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#17212B] tracking-tight">
            Create Blood Requirement Requisition
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Submit a real clinical blood requirement to the canonical database and trigger candidate matching waves.
          </p>
        </div>

        {/* Top Right Contextual Alert Pill */}
        <div className="p-3 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] flex items-center gap-3 self-start lg:self-auto max-w-md">
          <div className="w-8 h-8 rounded-lg bg-[#B42336] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Droplets size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#912020] block">Authoritative Clinical Flow</span>
            <span className="text-[11px] text-[#475467]">Requirements are persisted to database as PendingVerification until clinically approved.</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-[#912020] animate-dropdown">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#C62828] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#912020]">Submission Error</p>
              <p className="mt-0.5 text-[#B42336]">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-semibold text-[#B42336] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Form State */}
      {step === 'form' && (
        <form onSubmit={handleSubmitRequirement}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Requirement Specifications (7 cols) */}
            <div className="lg:col-span-7 card-command p-6 space-y-6">
              {/* Section 1: Blood Group & Units */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#17212B] uppercase tracking-wider block">
                  Required Blood Group
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setForm({ ...form, blood_group: bg })}
                      className={cn(
                        'py-2.5 rounded-xl text-xs font-bold font-mono border transition-all duration-150 text-center active:scale-95',
                        form.blood_group === bg
                          ? 'bg-[#B42336] text-white border-[#B42336] shadow-xs'
                          : 'bg-[#F8F9FA] text-[#475467] border-[#E6E8EC] hover:bg-[#F2F4F7] hover:border-[#D0D5DD]'
                      )}
                    >
                      {bg}
                    </button>
                  ))}
                </div>

                <div className="pt-3">
                  <label className="text-xs font-bold text-[#17212B] uppercase tracking-wider block mb-2">
                    Units Required
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {UNITS_OPTIONS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setForm({ ...form, units: u })}
                        className={cn(
                          'py-2 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95',
                          form.units === u
                            ? 'bg-[#17212B] text-white border-[#17212B] shadow-2xs'
                            : 'bg-[#F8F9FA] text-[#475467] border-[#E6E8EC] hover:bg-[#F2F4F7]'
                        )}
                      >
                        {u} Unit{u > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Urgency Level */}
              <div className="space-y-3 pt-2 border-t border-[#F2F4F7]">
                <label className="text-xs font-bold text-[#17212B] uppercase tracking-wider block">
                  Clinical Urgency Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {URGENCY_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = form.urgency === opt.level
                    return (
                      <div
                        key={opt.level}
                        onClick={() => setForm({ ...form, urgency: opt.level })}
                        className={cn(
                          'p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-start gap-3 hover:-translate-y-0.5 active:scale-[0.99]',
                          isSelected
                            ? `${opt.activeColor} shadow-2xs`
                            : 'border-[#E6E8EC] bg-[#F8F9FA] hover:border-[#D0D5DD] hover:bg-white text-[#475467]'
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white shadow-2xs border border-[#E6E8EC] transition-transform duration-150">
                          <Icon size={16} />
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs block text-[#17212B]">{opt.label}</span>
                          <span className="text-[11px] leading-tight block text-[#667085]">{opt.desc}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Section 3: Facility & Geographic Zone */}
              <div className="space-y-4 pt-2 border-t border-[#F2F4F7]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17212B] mb-1.5">
                      Requesting Medical Facility *
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                      <input
                        type="text"
                        required
                        value={form.facility}
                        onChange={(e) => setForm({ ...form, facility: e.target.value })}
                        placeholder="Hospital or Blood Bank Name"
                        className="w-full bg-[#F8F9FA] border border-[#E6E8EC] focus:border-[#B42336] focus:ring-2 focus:ring-[#FDF2F4] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#17212B] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17212B] mb-1.5">
                      Geographic Response Zone *
                    </label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                      <select
                        value={form.zone}
                        onChange={(e) => setForm({ ...form, zone: e.target.value })}
                        className="w-full bg-[#F8F9FA] border border-[#E6E8EC] focus:border-[#B42336] focus:ring-2 focus:ring-[#FDF2F4] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#17212B] outline-none transition-all cursor-pointer"
                      >
                        {Object.keys(ZONE_COORDINATES).map((z) => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17212B] mb-1.5">
                      Attending Contact Name
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                      <input
                        type="text"
                        value={form.contactPerson}
                        onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                        placeholder="Dr. / Officer Name"
                        className="w-full bg-[#F8F9FA] border border-[#E6E8EC] focus:border-[#B42336] focus:ring-2 focus:ring-[#FDF2F4] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#17212B] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17212B] mb-1.5">
                      Emergency Contact Number
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                      <input
                        type="text"
                        value={form.contactNumber}
                        onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                        placeholder="+91 Phone Number"
                        className="w-full bg-[#F8F9FA] border border-[#E6E8EC] focus:border-[#B42336] focus:ring-2 focus:ring-[#FDF2F4] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#17212B] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Unified Blood Incident Duplicate Advisory Notice */}
              {duplicateAdvisory?.duplicate_found && (
                <div className="p-4 rounded-xl bg-[#FEF7EC] border border-[#FEDF89] text-xs text-[#8D5A0F] space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#B7791F]">
                    <AlertTriangle size={16} />
                    <span>Unified Blood Incident Coordination Alert</span>
                  </div>
                  <p className="leading-relaxed text-[#8D5A0F]">
                    {duplicateAdvisory.message}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/incidents/${duplicateAdvisory.incident_id}`)}
                      className="px-3 py-1.5 rounded-lg bg-[#B7791F] hover:bg-[#8D5A0F] text-white font-bold text-xs transition-colors self-start shadow-xs flex items-center gap-1.5"
                    >
                      <span>Coordinate Under Active Incident ({duplicateAdvisory.incident_id}) →</span>
                    </button>
                    <span className="text-[11px] text-[#667085]">
                      Or proceed below if this is a distinct concurrent patient case.
                    </span>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-3 border-t border-[#F2F4F7] flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>Submit Requirement to Database →</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Live Summary & Map Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="card-command p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#17212B] uppercase tracking-wider">Requirement Summary</h3>

                <div className="p-4 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#B42336] text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                    <Droplets size={20} />
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-[#17212B] font-display">
                      {form.blood_group} · {form.units} Unit{form.units > 1 ? 's' : ''} · <span className="text-[#912020]">{form.urgency}</span>
                    </div>
                    <div className="text-xs text-[#475467] flex items-center gap-1 font-medium">
                      <Building2 size={13} className="text-[#98A2B3]" />
                      {form.facility}
                    </div>
                    <div className="text-[11px] text-[#667085] flex items-center gap-1">
                      <MapPin size={12} className="text-[#98A2B3]" />
                      {form.zone}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden">
                  <PuneNetworkMap />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Submitting State */}
      {step === 'submitting' && (
        <div className="card-command p-10 max-w-md mx-auto shadow-sm text-center space-y-4 animate-fade-in">
          <Loader2 size={36} className="text-[#B42336] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-[#17212B]">Persisting Blood Requirement...</h3>
          <p className="text-xs text-[#667085]">
            Sending canonical payload to FastAPI persistence engine and registering audit trail.
          </p>
        </div>
      )}

      {/* Created State Confirmation */}
      {step === 'created' && createdIncident && (
        <div className="card-command p-8 max-w-lg mx-auto shadow-sm text-center space-y-5 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-[#EBFDF5] text-[#16805D] flex items-center justify-center mx-auto border border-[#A6F4C5] transition-transform duration-300">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#085D40] uppercase tracking-wider block">
              CANONICAL INCIDENT PERSISTED
            </span>
            <h2 className="text-xl font-bold text-[#17212B] font-display mt-0.5">
              Requirement Successfully Created
            </h2>
            <p className="font-mono text-base font-bold text-[#912020] mt-2 bg-[#FEF3F2] py-1 px-3 rounded-lg inline-block border border-[#FECDCA]">
              {createdIncident.incident_id}
            </p>
            <p className="text-xs text-[#667085] mt-2">
              Status: <span className="font-bold text-[#17212B]">{createdIncident.status}</span> · {createdIncident.blood_group} · {createdIncident.units_requested} Units · {createdIncident.zone}
            </p>
          </div>

          {createdIncident.status === 'PendingVerification' && (
            <div className="p-4 bg-[#FEF7EC] border border-[#FDE2B5] rounded-xl text-xs text-[#8D5A0F] text-left space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert size={15} className="text-[#B7791F]" />
                <span>Verification Required</span>
              </div>
              <p className="text-[11px] text-[#8D5A0F]">
                Per clinical safety rules, this requirement is saved in <strong>PendingVerification</strong> status. Waves cannot be dispatched until verified.
              </p>
              <button
                type="button"
                onClick={handleVerifyNow}
                disabled={isVerifying}
                className="w-full py-2 bg-[#B7791F] hover:bg-[#8D5A0F] disabled:opacity-60 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Verifying Requirement...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Verify & Authorize Clinical Approval</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate(`/incidents/${createdIncident.incident_id}`)}
              className="flex-1 py-2.5 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white font-bold text-xs transition-colors shadow-xs"
            >
              Open Incident Command →
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="flex-1 py-2.5 rounded-xl border border-[#E6E8EC] text-[#475467] hover:text-[#17212B] hover:bg-[#F8F9FA] font-semibold text-xs transition-colors"
            >
              Back to Incidents List
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

