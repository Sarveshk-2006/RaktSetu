// RAKTSETU — Dedicated Partner Detail Workspace Page
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, MapPin, Activity, Clock,
  CheckCircle2, MoreVertical, ExternalLink, Send, Zap,
  Building2, GraduationCap, HeartHandshake, Building, Handshake,
  X, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPartnerByIdOrSlug, type Partner } from '@/data/partnersData'
import { PartnerCoverageMap } from '@/components/partners/PartnerCoverageMap'

// Helper for partner icon
function getPartnerIcon(type: Partner['type']) {
  switch (type) {
    case 'NGO':
      return <HeartHandshake size={22} className="text-[#E11D48]" />
    case 'BloodBank':
      return <Building2 size={22} className="text-[#2563EB]" />
    case 'University':
      return <GraduationCap size={22} className="text-[#8B5CF6]" />
    case 'Community':
      return <Users size={22} className="text-[#F59E0B]" />
    case 'Civic':
      return <Building size={22} className="text-[#10B981]" />
    default:
      return <Handshake size={22} className="text-[#2563EB]" />
  }
}

export function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const partner = getPartnerByIdOrSlug(id || 'upay-pune')

  const [activeTab, setActiveTab] = useState<'Overview' | 'Coverage' | 'Donor Capacity' | 'Recent Activity' | 'Incidents' | 'Settings'>('Overview')
  const [showCoordinateModal, setShowCoordinateModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const capacity = partner.donor_capacity

  const handleSimulateCoordination = () => {
    setShowCoordinateModal(false)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 4000)
  }

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1400px] mx-auto pb-16">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl border border-gray-800 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#10B981]" />
          <div className="text-xs">
            <span className="font-bold block">Coordination Request Sent</span>
            <span className="text-gray-400">Escalation dispatch triggered for {partner.name} nodal office.</span>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="text-gray-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Back Link */}
      <div>
        <button
          onClick={() => navigate('/partners')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#E11D48] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Partner Network</span>
        </button>
      </div>

      {/* Partner Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center shrink-0">
              {getPartnerIcon(partner.type)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold font-display text-[#111827]">{partner.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#059669]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Active
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                  {partner.type}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">{partner.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setShowCoordinateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs transition-all"
            >
              <Send size={14} />
              <span>Coordinate with Partner</span>
            </button>
            <button className="p-2.5 rounded-xl border border-[#E5E7EB] hover:bg-gray-50 text-gray-500">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-t border-[#F3F4F6] pt-3 overflow-x-auto scrollbar-none">
          {(['Overview', 'Coverage', 'Donor Capacity', 'Recent Activity', 'Incidents', 'Settings'] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0',
                  isActive
                    ? 'bg-[#E11D48] text-white shadow-2xs'
                    : 'text-[#4B5563] hover:bg-gray-100 hover:text-[#111827]'
                )}
              >
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Dynamic Detail KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Donors */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D1FAE5] text-[#10B981] flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Active Donors</span>
            </div>
            <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">+6%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{partner.active_donors.toLocaleString()}</span>
            <span className="text-[11px] text-[#6B7280]">Across {partner.zones.length} zones</span>
          </div>
        </div>

        {/* Coverage Zones */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                <MapPin size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Coverage Zones</span>
            </div>
            <span className="text-[10px] font-bold text-[#2563EB] bg-[#DBEAFE] px-1.5 py-0.5 rounded">Primary</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{partner.zones.length}</span>
            <span className="text-[11px] text-[#6B7280]">{partner.zones.join(' · ')}</span>
          </div>
        </div>

        {/* Response Rate */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Activity size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Response Rate</span>
            </div>
            <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">Last 30d</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{partner.response_rate}</span>
            <span className="text-[11px] text-[#6B7280]">High reliability</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Avg. Response Time</span>
            </div>
            <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded">Fast</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{partner.avg_response_time}</span>
            <span className="text-[11px] text-[#6B7280]">From activation</span>
          </div>
        </div>
      </div>

      {/* Main Overview 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Coverage Area Map & Recent Activity (Col 7 / ~60%) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Coverage Area Map */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#E11D48]" />
                <h3 className="text-base font-bold font-display text-[#111827]">Coverage Area</h3>
              </div>
              <button
                onClick={() => navigate('/intelligence')}
                className="text-xs font-semibold text-[#E11D48] hover:underline flex items-center gap-1"
              >
                <span>View Full Map</span>
                <ExternalLink size={13} />
              </button>
            </div>

            {/* Map Component */}
            <div className="h-[280px]">
              <PartnerCoverageMap partner={partner} />
            </div>

            {/* Map Legend */}
            <div className="flex items-center justify-between text-xs text-[#4B5563] pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" /> Primary Coverage ({partner.zones.join(', ')})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Secondary Coverage
                </span>
              </div>
              <span className="text-gray-500 font-medium">Node Center: {partner.name}</span>
            </div>
          </div>

          {/* Card 2: Recent Activity Timeline */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#2563EB]" />
                <h3 className="text-base font-bold font-display text-[#111827]">Recent Activity</h3>
              </div>
              <span className="text-xs text-[#6B7280]">Last 7 days</span>
            </div>

            <div className="space-y-3">
              {partner.recent_activities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <p className="font-bold text-[#111827]">{act.title}</p>
                    <p className="text-[11px] text-[#6B7280]">{act.time}</p>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', act.badgeColor || 'bg-gray-100 text-gray-700')}>
                    {act.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Donor Capacity & About Partner Details (Col 5 / ~40%) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Donor Capacity Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-[#111827]">Donor Capacity</h3>
              <span className="text-xs text-[#6B7280]">Readiness Distribution</span>
            </div>

            <p className="text-xs text-[#6B7280]">
              Current donor readiness within {partner.name} network.
            </p>

            {/* Capacity Progress Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-[#F3F4F6] border border-[#E5E7EB]">
                <div className="h-full bg-[#10B981]" style={{ width: `${Math.round((capacity.ready_now / partner.active_donors) * 100)}%` }} title="Ready Now" />
                <div className="h-full bg-[#F59E0B]" style={{ width: `${Math.round((capacity.maybe_available / partner.active_donors) * 100)}%` }} title="May Be Available" />
                <div className="h-full bg-[#E11D48]" style={{ width: `${Math.round((capacity.temporarily_unavailable / partner.active_donors) * 100)}%` }} title="Temporarily Unavailable" />
                <div className="h-full bg-[#9CA3AF]" style={{ width: `${Math.round((capacity.status_unknown / partner.active_donors) * 100)}%` }} title="Status Unknown" />
              </div>

              <div className="space-y-2 text-xs pt-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Ready Now
                  </span>
                  <span className="font-bold text-[#111827]">{capacity.ready_now} donors ({Math.round((capacity.ready_now / partner.active_donors) * 100)}%)</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> May Be Available
                  </span>
                  <span className="font-bold text-[#111827]">{capacity.maybe_available} donors ({Math.round((capacity.maybe_available / partner.active_donors) * 100)}%)</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" /> Unavailable / Cooldown
                  </span>
                  <span className="font-bold text-[#111827]">{capacity.temporarily_unavailable} donors ({Math.round((capacity.temporarily_unavailable / partner.active_donors) * 100)}%)</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]" /> Status Unknown
                  </span>
                  <span className="font-bold text-[#111827]">{capacity.status_unknown} donors ({Math.round((capacity.status_unknown / partner.active_donors) * 100)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: About Partner Operational Details */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <h3 className="text-base font-bold font-display text-[#111827]">About Partner</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Partner Type</span>
                <span className="font-bold text-[#111827]">{partner.type} ({partner.coordination_model})</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Primary Areas</span>
                <span className="font-bold text-[#111827]">{partner.zones.join(' · ')}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Primary Contact</span>
                <span className="font-bold text-[#111827]">{partner.primary_contact} ({partner.contact_role})</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Total Registered Pool</span>
                <span className="font-bold text-[#111827]">{partner.total_registered.toLocaleString()} donors</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Integration Status</span>
                <span className="font-bold text-[#10B981] flex items-center gap-1">
                  <CheckCircle2 size={13} /> Active · Data Syncing
                </span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Partnership Since</span>
                <span className="font-bold text-[#111827]">{partner.joined}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6B7280]">Last Node Sync</span>
                <span className="font-mono text-[#4B5563]">{partner.last_sync}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Coordinate CTA Card */}
          <div className="bg-gradient-to-br from-[#FFF1F2] to-white rounded-2xl border border-[#FECDD3] p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#E11D48] font-bold text-xs">
              <Zap size={16} />
              <span>EMERGENCY COORDINATION</span>
            </div>

            <h4 className="text-sm font-bold text-[#111827] font-display">
              Coordinate with {partner.name}
            </h4>

            <p className="text-xs text-[#4B5563]">
              Trigger partner escalation or discuss a specific blood-response requirement for Pune incidents.
            </p>

            <button
              onClick={() => setShowCoordinateModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Coordinate with Partner →</span>
            </button>
          </div>
        </div>
      </div>

      {/* COORDINATION MODAL */}
      {showCoordinateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl overflow-hidden space-y-4 animate-scale-up">
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-[#E11D48]" />
                <h3 className="font-bold font-display text-sm text-[#111827]">Coordinate with {partner.name}</h3>
              </div>
              <button onClick={() => setShowCoordinateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-gray-600">
                Select an open blood requirement or trigger an emergency capacity escalation call with {partner.name}.
              </p>

              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Incident</label>
                  <select className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E11D48]">
                    <option value="INC-PN-48291">INC-PN-48291 (Wagholi · O- Critical · 2 Units)</option>
                    <option value="INC-PN-48287">INC-PN-48287 (Kothrud · B+ High · 3 Units)</option>
                    <option value="INC-PN-48279">INC-PN-48279 (Baner · A+ Moderate · 1 Unit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Coordinated Action</label>
                  <select className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E11D48]">
                    <option value="wave">Trigger Wave 2 Partner Activation</option>
                    <option value="rare">Request Rare Blood Stock Check</option>
                    <option value="mobile">Deploy Partner Mobile Collection Unit</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCoordinateModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateCoordination}
                className="px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Dispatch Request</span>
                <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
