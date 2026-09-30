// RAKTSETU — Complete Create Blood Incident / Requirement Page Redesign (Reference-Driven)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Droplets, Network, MapPin,
  Building2, Phone, User, FileText, ShieldCheck,
  CheckCircle2, Circle, ArrowRight, Loader2, ShieldAlert,
  Clock, Flame
} from 'lucide-react'

import { PuneNetworkMap } from '@/components/overview/PuneNetworkMap'
import { cn } from '@/lib/utils'
import type { BloodGroup, IncidentUrgency } from '@/types'

type Step = 'form' | 'verifying' | 'verified' | 'created'

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
const UNITS_OPTIONS = [1, 2, 3, 4, 5, 6]

const URGENCY_OPTIONS: { level: IncidentUrgency; label: string; desc: string; icon: typeof AlertTriangle; activeColor: string }[] = [
  {
    level: 'Critical',
    label: 'Critical',
    desc: 'Immediate response required',
    icon: Flame,
    activeColor: 'border-[#E11D48] bg-[#FFF1F2] text-[#E11D48]',
  },
  {
    level: 'High',
    label: 'High',
    desc: 'Within 2–6 hours',
    icon: ShieldAlert,
    activeColor: 'border-[#F59E0B] bg-[#FFFBEB] text-[#D97706]',
  },
  {
    level: 'Moderate',
    label: 'Moderate',
    desc: 'Within 6–24 hours',
    icon: Clock,
    activeColor: 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]',
  },
  {
    level: 'Routine',
    label: 'Routine',
    desc: 'Planned requirement',
    icon: Building2,
    activeColor: 'border-[#4B5563] bg-[#F9FAFB] text-[#374151]',
  },
]

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
    contactPerson: 'Dr. A. Sharma',
    contactNumber: '+91 98765 43210',
    clinicalNotes: '',
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

  return (
    <div className="space-y-5 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-12">
      {/* Back Link & Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <button
            onClick={() => navigate('/incidents')}
            className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] mb-1 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Incidents
          </button>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight">
            Create Blood Incident
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Register a verified blood requirement to trigger the response cascade.
          </p>
        </div>

        {/* Top Right Contextual Alert Pill */}
        <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center gap-3 self-start lg:self-auto max-w-md">
          <div className="w-8 h-8 rounded-full bg-[#E11D48] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Droplets size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#E11D48] block">Critical cases are automatically prioritised</span>
            <span className="text-[11px] text-[#4B5563]">Verified requirements are broadcasted to nearby donors and partner networks.</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace Grid */}
      {(step === 'form' || step === 'verifying') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Requirement Registration Form (Col 8 / ~68%) */}
          <div className="lg:col-span-8 space-y-5">
            {/* STEP 1: Blood Requirement Details */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-bold text-xs flex items-center justify-center font-display shadow-2xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827] font-display">Blood Requirement Details</h3>
                  <p className="text-xs text-[#6B7280]">Specify the blood group, units and urgency level for this requirement.</p>
                </div>
              </div>

              {/* Blood Group & Units Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
                {/* Blood Group Selection */}
                <div className="md:col-span-7 space-y-2">
                  <label className="text-xs font-bold text-[#374151] block">Blood Group</label>
                  <div className="flex flex-wrap gap-2">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        key={bg}
                        onClick={() => setForm((f) => ({ ...f, blood_group: bg }))}
                        className={cn(
                          'w-11 h-9 rounded-lg border text-xs font-bold font-mono transition-all',
                          form.blood_group === bg
                            ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-2xs'
                            : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-white hover:border-[#D1D5DB]'
                        )}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Units Required Selection */}
                <div className="md:col-span-5 space-y-2">
                  <label className="text-xs font-bold text-[#374151] block">Units Required</label>
                  <div className="flex items-center gap-2">
                    {UNITS_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setForm((f) => ({ ...f, units: n }))}
                        className={cn(
                          'w-9 h-9 rounded-lg border text-xs font-bold font-mono transition-all',
                          form.units === n
                            ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-2xs'
                            : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-white hover:border-[#D1D5DB]'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Urgency Level Cards Selection */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-[#374151] block">Urgency Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {URGENCY_OPTIONS.map((opt) => {
                    const IconComp = opt.icon
                    const isSelected = form.urgency === opt.level
                    return (
                      <div
                        key={opt.level}
                        onClick={() => setForm((f) => ({ ...f, urgency: opt.level }))}
                        className={cn(
                          'p-3 rounded-xl border transition-all cursor-pointer space-y-1.5',
                          isSelected
                            ? opt.activeColor + ' shadow-2xs'
                            : 'bg-[#F9FAFB] border-[#E5E7EB] hover:bg-white hover:border-[#D1D5DB]'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp size={16} />
                          <span className="text-xs font-bold font-display">{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] leading-tight">{opt.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* STEP 2: Location & Facility */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-bold text-xs flex items-center justify-center font-display shadow-2xs">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827] font-display">Location & Facility</h3>
                  <p className="text-xs text-[#6B7280]">Specify where the blood is needed.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Location (Area) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151] block">Location (Area)</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <select
                      value={form.zone}
                      onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
                      className="w-full bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#E11D48] rounded-lg pl-9 pr-8 py-2 text-xs font-medium text-[#111827] outline-none cursor-pointer"
                    >
                      <option value="Wagholi, Pune">Wagholi, Pune</option>
                      <option value="Kothrud, Pune">Kothrud, Pune</option>
                      <option value="Baner, Pune">Baner, Pune</option>
                      <option value="Hadapsar, Pune">Hadapsar, Pune</option>
                      <option value="Wakad, Pune">Wakad, Pune</option>
                      <option value="Pimpri, Pune">Pimpri, Pune</option>
                    </select>
                  </div>
                </div>

                {/* Requesting Facility */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151] block">Requesting Facility</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <select
                      value={form.facility}
                      onChange={(e) => setForm((f) => ({ ...f, facility: e.target.value }))}
                      className="w-full bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#E11D48] rounded-lg pl-9 pr-8 py-2 text-xs font-medium text-[#111827] outline-none cursor-pointer"
                    >
                      <option value="Sahyadri Hospital, Hadapsar">Sahyadri Hospital, Hadapsar</option>
                      <option value="Ruby Hall Clinic, Kothrud">Ruby Hall Clinic, Kothrud</option>
                      <option value="Deenanath Mangeshkar Hospital">Deenanath Mangeshkar Hospital</option>
                      <option value="Noble Hospital, Hadapsar">Noble Hospital, Hadapsar</option>
                      <option value="Jupiter Hospital, Baner">Jupiter Hospital, Baner</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Requirement Source */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-[#374151] block">Requirement Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  className="w-full bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#E11D48] rounded-lg px-3 py-2 text-xs font-medium text-[#111827] outline-none cursor-pointer"
                >
                  <option value="Hospital">Hospital</option>
                  <option value="Blood Bank">Blood Bank</option>
                  <option value="Community">Community</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>

            {/* STEP 3: Additional Information */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#E11D48] text-white font-bold text-xs flex items-center justify-center font-display shadow-2xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827] font-display">Additional Information</h3>
                  <p className="text-xs text-[#6B7280]">Provide clinical context and contact details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Contact Person */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151] block">Contact Person</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="text"
                      value={form.contactPerson}
                      onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                      className="w-full bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#E11D48] rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-[#111827] outline-none"
                    />
                  </div>
                </div>

                {/* Contact Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151] block">Contact Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="text"
                      value={form.contactNumber}
                      onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
                      className="w-full bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#E11D48] rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-[#111827] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Notes (Optional) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-[#374151] block">Clinical Notes (Optional)</label>
                <div className="relative">
                  <FileText size={15} className="absolute left-3 top-3 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="e.g. Patient condition, surgery type, special requirements..."
                    value={form.clinicalNotes}
                    onChange={(e) => setForm((f) => ({ ...f, clinicalNotes: e.target.value }))}
                    className="w-full bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#E11D48] rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-[#111827] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Verification & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
              <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center gap-3 max-w-lg">
                <ShieldCheck size={18} className="text-[#E11D48] shrink-0" />
                <div className="text-[11px] text-[#4B5563] leading-snug">
                  <strong className="text-[#E11D48] block">All requirements are verified by hospital authorities before broadcast</strong>
                  This helps prevent false alerts and ensures donor safety.
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={step === 'verifying'}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-60 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                {step === 'verifying' ? (
                  <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                ) : (
                  <>VERIFY & CREATE INCIDENT <ArrowRight size={15} /></>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Context & Dynamic Preview (Col 4 / ~32%) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Card 1: Live Network Context */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827] font-display">Live Network Context</h4>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#047857]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Real-time data
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#D1FAE5] text-[#10B981] flex items-center justify-center shrink-0">
                    <User size={15} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#111827] font-display block">4,218</span>
                    <span className="text-[10px] text-[#6B7280]">Ready Donors</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <User size={15} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#111827] font-display block">1,842</span>
                    <span className="text-[10px] text-[#6B7280]">May be Available</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
                    <User size={15} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#111827] font-display block">2,104</span>
                    <span className="text-[10px] text-[#6B7280]">Temp. Unavailable</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                    <Network size={15} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#111827] font-display block">87%</span>
                    <span className="text-[10px] text-[#6B7280]">Network Coverage</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Selected Location Map Container */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827] font-display">Selected Location</h4>
                <button className="text-[11px] font-semibold text-[#E11D48] hover:underline">Change</button>
              </div>

              <div className="h-[200px] rounded-xl overflow-hidden border border-[#E5E7EB]">
                <PuneNetworkMap />
              </div>

              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#E11D48] shrink-0" />
                  <div>
                    <span className="font-bold text-[#111827] block">{form.zone}</span>
                    <span className="text-[11px] text-[#6B7280]">{form.facility}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#6B7280]">~ 3.2 km from center</span>
              </div>
            </div>

            {/* Card 3: Requirement Summary (Dynamic Live Preview) */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111827] font-display">Requirement Summary</h4>
                <span className="text-[11px] font-semibold text-[#E11D48]">Preview</span>
              </div>

              {/* Dynamic Live Preview Box */}
              <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#E11D48] text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                  <Droplets size={20} />
                </div>

                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#111827] font-display">
                    {form.blood_group} · {form.units} Unit{form.units > 1 ? 's' : ''} · <span className="text-[#E11D48]">{form.urgency}</span>
                  </div>
                  <div className="text-xs text-[#4B5563] flex items-center gap-1 font-medium">
                    <Building2 size={13} className="text-[#9CA3AF]" />
                    {form.facility}
                  </div>
                  <div className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <MapPin size={12} className="text-[#9CA3AF]" />
                    {form.zone}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification checks list during verifying state */}
      {step === 'verifying' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-2.5 max-w-lg mx-auto shadow-sm animate-fade-in">
          <h4 className="text-sm font-bold text-[#111827] font-display mb-3">Verification Progress</h4>
          {VERIFICATION_CHECKS.map((check, i) => (
            <div key={check} className="flex items-center gap-3 text-xs">
              {i < checkedItems ? (
                <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
              ) : (
                <Circle size={16} className="text-[#D1D5DB] shrink-0" />
              )}
              <span className={i < checkedItems ? 'font-semibold text-[#111827]' : 'text-[#6B7280]'}>{check}</span>
            </div>
          ))}
        </div>
      )}

      {/* Verified State Card */}
      {step === 'verified' && (
        <div className="bg-white rounded-xl border border-emerald-200 p-6 max-w-lg mx-auto shadow-sm space-y-4 animate-scale-in text-center">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mx-auto border border-[#A7F3D0]">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827] font-display">Requirement Verified</h3>
            <p className="text-xs text-[#6B7280]">All verification checks passed for hospital broadcast</p>
          </div>

          <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-mono flex items-center justify-between">
            <span className="text-[#6B7280]">Generated Incident ID</span>
            <span className="font-bold text-[#111827]">INC-PN-48291</span>
          </div>

          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs shadow-xs transition-colors"
          >
            <span>CREATE INCIDENT</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Created State Confirmation */}
      {step === 'created' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 max-w-md mx-auto shadow-sm text-center space-y-5 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mx-auto border border-[#A7F3D0]">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#111827] font-display">Incident Broadcast Triggered</h2>
            <p className="font-mono text-sm font-bold text-[#E11D48] mt-1">INC-PN-48291</p>
            <p className="text-xs text-[#6B7280] mt-1">{form.blood_group} · {form.units} Units · {form.urgency} · {form.zone}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/incidents/INC-PN-48291')}
              className="flex-1 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs transition-colors shadow-xs"
            >
              View Incident Command
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB] font-semibold text-xs transition-colors"
            >
              Back to Incidents
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
