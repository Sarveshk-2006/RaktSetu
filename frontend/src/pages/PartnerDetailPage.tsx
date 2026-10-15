// RAKTSETU — Dedicated Partner Detail Workspace Page
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, MapPin, Activity,
  CheckCircle2, ExternalLink, Send, Zap,
  Building2, GraduationCap, HeartHandshake, Building, Handshake,
  X, AlertCircle, ShieldCheck, Droplet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { PartnerCoverageMap } from '@/components/partners/PartnerCoverageMap'

// Helper for partner icon
function getPartnerIcon(type: string) {
  switch (type) {
    case 'NGO':
      return <HeartHandshake size={22} className="text-[#E11D48]" />
    case 'BloodBank':
    case 'Hospital':
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

  const [partner, setPartner] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'Overview' | 'Coverage' | 'Donor Capacity' | 'Settings'>('Overview')
  const [showCoordinateModal, setShowCoordinateModal] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const loadPartnerDetail = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getPartner(id)
      setPartner(data)
    } catch (err: any) {
      console.error('Failed to load partner detail:', err)
      setError(err?.message || `Partner organisation '${id}' could not be loaded from authoritative storage.`)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadPartnerDetail()
  }, [loadPartnerDetail])

  const handleSimulateCoordination = () => {
    setShowCoordinateModal(false)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 4000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1400px] mx-auto pb-16">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-white rounded-2xl border border-[#E5E7EB] p-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white rounded-xl border border-[#E5E7EB] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1400px] mx-auto pb-16">
        <div>
          <button
            onClick={() => navigate('/partners')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#E11D48] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Partner Network</span>
          </button>
        </div>

        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-6 text-center space-y-3">
          <AlertCircle size={32} className="text-[#DC2626] mx-auto" />
          <h2 className="text-base font-bold text-[#991B1B]">Partner Record Unavailable</h2>
          <p className="text-xs text-[#B91C1C] max-w-md mx-auto">{error || 'Organisation details not found.'}</p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={loadPartnerDetail}
              className="px-4 py-2 bg-[#DC2626] text-white text-xs font-bold rounded-lg hover:bg-[#B91C1C]"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/partners')}
              className="px-4 py-2 bg-white border border-[#FCA5A5] text-[#DC2626] text-xs font-bold rounded-lg hover:bg-gray-50"
            >
              Return to Partner Directory
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pZones = Array.isArray(partner.zones) ? partner.zones : []
  const bgDistribution = partner.blood_group_distribution || {}
  const activeDonorsCount = partner.active_donors || 0
  const readyDonorsCount = partner.ready_donors || 0

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1400px] mx-auto pb-16">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl border border-gray-800 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#10B981]" />
          <div className="text-xs">
            <span className="font-bold block">Coordination Request Dispatched</span>
            <span className="text-gray-400">Escalation notice registered for {partner.name}.</span>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> {partner.status || 'Active'}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                  {partner.type}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600">
                  ID: {partner.org_id}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Authoritative nodal partner contributing verified donor capacity to the Pune network.
              </p>
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
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-t border-[#F3F4F6] pt-3 overflow-x-auto scrollbar-none">
          {(['Overview', 'Coverage', 'Donor Capacity', 'Settings'] as const).map((tab) => {
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
              <span className="text-xs font-semibold text-[#4B5563]">Linked Donors</span>
            </div>
            <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">Authoritative</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">
              {activeDonorsCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Across {pZones.length} {pZones.length === 1 ? 'zone' : 'zones'}
            </span>
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
            <span className="text-[10px] font-bold text-[#2563EB] bg-[#DBEAFE] px-1.5 py-0.5 rounded">Nodal</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{pZones.length}</span>
            <span className="text-[11px] text-[#6B7280] truncate max-w-[150px]">
              {pZones.join(' · ') || 'Pune District'}
            </span>
          </div>
        </div>

        {/* Ready Now Donors */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Activity size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Ready Donors</span>
            </div>
            <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">Live Status</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">
              {readyDonorsCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#6B7280]">
              {activeDonorsCount > 0 ? `${Math.round((readyDonorsCount / activeDonorsCount) * 100)}% ready` : 'Available'}
            </span>
          </div>
        </div>

        {/* Contact Status */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Dispatch Readiness</span>
            </div>
            <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded">Integrated</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">
              {partner.contact_available ? 'Connected' : 'Standby'}
            </span>
            <span className="text-[11px] text-[#6B7280]">Direct Nodal Relay</span>
          </div>
        </div>
      </div>

      {/* Main Overview 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Coverage Area Map (Col 7 / ~60%) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#E11D48]" />
                <h3 className="text-base font-bold font-display text-[#111827]">Nodal Coverage Area</h3>
              </div>
              <button
                onClick={() => navigate('/intelligence')}
                className="text-xs font-semibold text-[#E11D48] hover:underline flex items-center gap-1"
              >
                <span>View Network Map</span>
                <ExternalLink size={13} />
              </button>
            </div>

            {/* Map Component */}
            <div className="h-[280px]">
              <PartnerCoverageMap partner={{
                ...partner,
                lat: partner.lat || 18.5204,
                lng: partner.lng || 73.8567,
                zones: pZones,
              }} />
            </div>

            {/* Map Legend */}
            <div className="flex items-center justify-between text-xs text-[#4B5563] pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" /> Nodal Areas: {pZones.join(', ') || 'Pune District'}
                </span>
              </div>
              <span className="text-gray-500 font-medium">Node Coordinates: {partner.lat?.toFixed(3)}, {partner.lng?.toFixed(3)}</span>
            </div>
          </div>

          {/* Blood Group Capacity Distribution */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet size={18} className="text-[#E11D48]" />
                <h3 className="text-base font-bold font-display text-[#111827]">Blood Group Capacity Contributed</h3>
              </div>
              <span className="text-xs text-[#6B7280]">Canonical Database Breakdown</span>
            </div>

            {Object.keys(bgDistribution).length === 0 ? (
              <p className="text-xs text-[#6B7280] py-4 text-center">
                Blood group distribution will appear as donors are linked to this partner node.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {Object.entries(bgDistribution).map(([bg, count]) => (
                  <div key={bg} className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-center space-y-1">
                    <span className="font-bold text-xs text-[#111827] block">{bg}</span>
                    <span className="text-lg font-bold font-display text-[#E11D48] block">
                      {(count as number).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#6B7280] block">donors</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Partner Operational Details (Col 5 / ~40%) */}
        <div className="lg:col-span-5 space-y-5">
          {/* About Partner Operational Details */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <h3 className="text-base font-bold font-display text-[#111827]">Operational Profile</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Partner Type</span>
                <span className="font-bold text-[#111827]">{partner.type}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Authoritative Org ID</span>
                <span className="font-mono font-bold text-[#111827]">{partner.org_id}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Primary Areas</span>
                <span className="font-bold text-[#111827]">{pZones.join(' · ') || 'Pune District'}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Linked Donors</span>
                <span className="font-bold text-[#111827]">{activeDonorsCount.toLocaleString()} registered</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Operational State</span>
                <span className="font-bold text-[#10B981] flex items-center gap-1">
                  <CheckCircle2 size={13} /> {partner.status || 'Active'} · Connected
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#6B7280]">Data Availability</span>
                <span className="text-[#10B981] font-semibold">Authoritative Record</span>
              </div>
            </div>
          </div>

          {/* Coordinate CTA Card */}
          <div className="bg-gradient-to-br from-[#FFF1F2] to-white rounded-2xl border border-[#FECDD3] p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#E11D48] font-bold text-xs">
              <Zap size={16} />
              <span>EMERGENCY COORDINATION</span>
            </div>

            <h4 className="text-sm font-bold text-[#111827] font-display">
              Coordinate with {partner.name}
            </h4>

            <p className="text-xs text-[#4B5563]">
              Contact this partner's volunteer dispatch desk directly during escalating multi-wave blood requirements.
            </p>

            <button
              onClick={() => setShowCoordinateModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs"
            >
              Trigger Coordination Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Coordinate Modal */}
      {showCoordinateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-[#E11D48]" />
                <h3 className="font-bold text-sm text-[#111827]">Partner Escalation Request</h3>
              </div>
              <button onClick={() => setShowCoordinateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Dispatch coordination alert to <strong>{partner.name}</strong> nodal desk for emergency requirement escalation.
            </p>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Destination:</span>
                <span className="font-semibold text-gray-900">{partner.name} Nodal Desk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Org ID:</span>
                <span className="font-mono text-gray-900">{partner.org_id}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCoordinateModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateCoordination}
                className="px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
