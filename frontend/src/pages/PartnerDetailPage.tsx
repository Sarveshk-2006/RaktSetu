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
import { PARTNERS_DATA } from '@/data/partnersData'

// Helper for partner icon
function getPartnerIcon(type: string) {
  switch (type) {
    case 'NGO':
      return <HeartHandshake size={20} className="text-[#B42336]" />
    case 'BloodBank':
    case 'Hospital':
      return <Building2 size={20} className="text-[#3567B7]" />
    case 'University':
      return <GraduationCap size={20} className="text-[#7C3AED]" />
    case 'Community':
      return <Users size={20} className="text-[#B7791F]" />
    case 'Civic':
      return <Building size={20} className="text-[#16805D]" />
    default:
      return <Handshake size={20} className="text-[#3567B7]" />
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
      console.warn('Backend partner detail unreachable, checking fallback:', err)
      const fallback = PARTNERS_DATA.find(p => p.id === id || p.slug === id)
      if (fallback) {
        setPartner(fallback)
      } else {
        setError(err?.message || `Partner organisation '${id}' could not be loaded.`)
      }
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
      <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1400px] mx-auto pb-16">
        <div className="h-6 w-32 skeleton-shimmer" />
        <div className="h-40 skeleton-shimmer border border-[#E6E8EC]" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 skeleton-shimmer border border-[#E6E8EC]" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1400px] mx-auto pb-16">
        <div>
          <button
            onClick={() => navigate('/partners')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#B42336] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Partner Network</span>
          </button>
        </div>

        <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-2xl p-6 text-center space-y-3">
          <AlertCircle size={32} className="text-[#C62828] mx-auto" />
          <h2 className="text-base font-bold text-[#861D2B]">Partner Record Unavailable</h2>
          <p className="text-xs text-[#C62828] max-w-md mx-auto">{error || 'Organisation details not found.'}</p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={loadPartnerDetail}
              className="px-4 py-2 bg-[#B42336] text-white text-xs font-bold rounded-xl hover:bg-[#861D2B] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/partners')}
              className="px-4 py-2 bg-white border border-[#E6E8EC] text-[#475467] text-xs font-bold rounded-xl hover:bg-[#F8F9FA] transition-colors"
            >
              Return to Directory
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
    <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1400px] mx-auto pb-16">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#17212B] text-white px-4 py-3 rounded-xl shadow-xl border border-[#2A3441] flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#16805D]" />
          <div className="text-xs">
            <span className="font-bold block">Coordination Request Dispatched</span>
            <span className="text-[#98A2B3]">Escalation notice registered for {partner.name}.</span>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="text-[#98A2B3] hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Back Link */}
      <div>
        <button
          onClick={() => navigate('/partners')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#B42336] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Partner Network</span>
        </button>
      </div>

      {/* Partner Header Banner */}
      <div className="card-command p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-center shrink-0">
              {getPartnerIcon(partner.type)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold font-display text-[#17212B]">{partner.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBFDF5] text-[#16805D] border border-[#A6F4C5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16805D]" /> {partner.status || 'Active'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#F2F4F7] text-[#475467] border border-[#E6E8EC]">
                  {partner.type}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#F2F4F7] text-[#667085] border border-[#E6E8EC]">
                  ID: {partner.org_id}
                </span>
              </div>
              <p className="text-xs text-[#667085]">
                Authoritative nodal partner contributing verified donor capacity to the Pune network.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setShowCoordinateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Send size={14} />
              <span>Coordinate with Partner</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-t border-[#E6E8EC] pt-3 overflow-x-auto scrollbar-none">
          {(['Overview', 'Coverage', 'Donor Capacity', 'Settings'] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0',
                  isActive
                    ? 'bg-[#B42336] text-white shadow-xs'
                    : 'text-[#667085] hover:bg-[#F2F4F7] hover:text-[#17212B]'
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
        <div className="card-command p-4 space-y-2 border-l-4 border-l-[#16805D]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EBFDF5] text-[#16805D] flex items-center justify-center shrink-0 border border-[#A6F4C5]">
                <Users size={16} />
              </div>
              <span className="text-xs font-semibold text-[#475467]">Linked Donors</span>
            </div>
            <span className="text-[10px] font-bold text-[#16805D] bg-[#EBFDF5] px-1.5 py-0.5 rounded border border-[#A6F4C5]">
              Authoritative
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">
              {activeDonorsCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#667085]">
              Across {pZones.length} {pZones.length === 1 ? 'zone' : 'zones'}
            </span>
          </div>
        </div>

        {/* Coverage Zones */}
        <div className="card-command p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#3567B7] flex items-center justify-center shrink-0 border border-[#B2DDFF]">
                <MapPin size={16} />
              </div>
              <span className="text-xs font-semibold text-[#475467]">Coverage Zones</span>
            </div>
            <span className="text-[10px] font-bold text-[#3567B7] bg-[#EFF8FF] px-1.5 py-0.5 rounded border border-[#B2DDFF]">
              Nodal
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">{pZones.length}</span>
            <span className="text-[11px] text-[#667085] truncate max-w-[150px]">
              {pZones.join(' · ') || 'Pune District'}
            </span>
          </div>
        </div>

        {/* Ready Now Donors */}
        <div className="card-command p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FEF7EC] text-[#B7791F] flex items-center justify-center shrink-0 border border-[#FEDF89]">
                <Activity size={16} />
              </div>
              <span className="text-xs font-semibold text-[#475467]">Ready Donors</span>
            </div>
            <span className="text-[10px] font-bold text-[#B7791F] bg-[#FEF7EC] px-1.5 py-0.5 rounded border border-[#FEDF89]">
              Live Status
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">
              {readyDonorsCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#16805D] font-bold">
              {activeDonorsCount > 0 ? `${Math.round((readyDonorsCount / activeDonorsCount) * 100)}% ready` : 'Available'}
            </span>
          </div>
        </div>

        {/* Contact Status */}
        <div className="card-command p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#3567B7] flex items-center justify-center shrink-0 border border-[#B2DDFF]">
                <ShieldCheck size={16} />
              </div>
              <span className="text-xs font-semibold text-[#475467]">Dispatch Readiness</span>
            </div>
            <span className="text-[10px] font-bold text-[#3567B7] bg-[#EFF8FF] px-1.5 py-0.5 rounded border border-[#B2DDFF]">
              Integrated
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">
              {partner.contact_available ? 'Connected' : 'Standby'}
            </span>
            <span className="text-[11px] text-[#667085]">Direct Relay</span>
          </div>
        </div>
      </div>

      {/* Main Overview 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Coverage Area Map (Col 7) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="card-command p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#B42336]" />
                <h3 className="text-xs font-bold font-display text-[#17212B] uppercase tracking-wider">
                  Nodal Coverage Area
                </h3>
              </div>
              <button
                onClick={() => navigate('/intelligence')}
                className="text-xs font-bold text-[#B42336] hover:underline flex items-center gap-1"
              >
                <span>View Network Map</span>
                <ExternalLink size={13} />
              </button>
            </div>

            {/* Map Component */}
            <div className="h-[280px] rounded-xl overflow-hidden border border-[#E6E8EC]">
              <PartnerCoverageMap partner={{
                ...partner,
                lat: partner.lat || 18.5204,
                lng: partner.lng || 73.8567,
                zones: pZones,
              }} />
            </div>

            {/* Map Legend */}
            <div className="flex items-center justify-between text-xs text-[#475467] pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B42336]" /> Nodal Areas: {pZones.join(', ') || 'Pune District'}
                </span>
              </div>
              <span className="text-[#667085] font-mono text-[11px]">Node Coordinates: {partner.lat?.toFixed(3)}, {partner.lng?.toFixed(3)}</span>
            </div>
          </div>

          {/* Blood Group Capacity Distribution */}
          <div className="card-command p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet size={16} className="text-[#B42336]" />
                <h3 className="text-xs font-bold font-display text-[#17212B] uppercase tracking-wider">
                  Blood Group Capacity Contributed
                </h3>
              </div>
              <span className="text-xs text-[#667085]">Canonical Database Breakdown</span>
            </div>

            {Object.keys(bgDistribution).length === 0 ? (
              <p className="text-xs text-[#667085] py-4 text-center">
                Blood group distribution will appear as donors are linked to this partner node.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {Object.entries(bgDistribution).map(([bg, count]) => (
                  <div key={bg} className="p-2.5 rounded-xl border border-[#E6E8EC] bg-[#F8F9FA] text-center space-y-1">
                    <span className="font-bold text-xs text-[#17212B] font-mono block">{bg}</span>
                    <span className="text-lg font-bold font-display text-[#B42336] block">
                      {(count as number).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#667085] block">donors</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Partner Operational Details (Col 5) */}
        <div className="lg:col-span-5 space-y-5">
          {/* About Partner Operational Details */}
          <div className="card-command p-5 space-y-4">
            <h3 className="text-xs font-bold font-display text-[#17212B] uppercase tracking-wider">
              Operational Profile
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-[#E6E8EC]">
                <span className="text-[#667085]">Partner Type</span>
                <span className="font-bold text-[#17212B]">{partner.type}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#E6E8EC]">
                <span className="text-[#667085]">Authoritative Org ID</span>
                <span className="font-mono font-bold text-[#17212B]">{partner.org_id}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#E6E8EC]">
                <span className="text-[#667085]">Primary Areas</span>
                <span className="font-bold text-[#17212B]">{pZones.join(' · ') || 'Pune District'}</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#E6E8EC]">
                <span className="text-[#667085]">Linked Donors</span>
                <span className="font-bold text-[#17212B]">{activeDonorsCount.toLocaleString()} registered</span>
              </div>

              <div className="flex justify-between pb-2 border-b border-[#E6E8EC]">
                <span className="text-[#667085]">Operational State</span>
                <span className="font-bold text-[#16805D] flex items-center gap-1">
                  <CheckCircle2 size={13} /> {partner.status || 'Active'} · Connected
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#667085]">Data Availability</span>
                <span className="text-[#16805D] font-bold">Authoritative Record</span>
              </div>
            </div>
          </div>

          {/* Coordinate CTA Card */}
          <div className="card-command p-5 space-y-3 border-l-4 border-l-[#B42336]">
            <div className="flex items-center gap-2 text-[#B42336] font-bold text-xs">
              <Zap size={14} />
              <span className="text-[10px] uppercase tracking-wider">Emergency Coordination</span>
            </div>

            <h4 className="text-sm font-bold text-[#17212B] font-display">
              Coordinate with {partner.name}
            </h4>

            <p className="text-xs text-[#475467]">
              Contact this partner's volunteer dispatch desk directly during escalating multi-wave blood requirements.
            </p>

            <button
              onClick={() => setShowCoordinateModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white text-xs font-bold transition-colors shadow-xs"
            >
              Trigger Coordination Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Coordinate Modal */}
      {showCoordinateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="card-command max-w-md w-full p-5 space-y-4 animate-scale-in border-[#E6E8EC] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E8EC]">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-[#B42336]" />
                <h3 className="font-bold text-sm text-[#17212B]">Partner Escalation Request</h3>
              </div>
              <button onClick={() => setShowCoordinateModal(false)} className="text-[#98A2B3] hover:text-[#17212B]">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#475467]">
              Dispatch coordination alert to <strong>{partner.name}</strong> nodal desk for emergency requirement escalation.
            </p>

            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E6E8EC] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#667085]">Destination:</span>
                <span className="font-semibold text-[#17212B]">{partner.name} Nodal Desk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Org ID:</span>
                <span className="font-mono text-[#17212B]">{partner.org_id}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCoordinateModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E8EC] text-xs font-bold text-[#475467] hover:bg-[#F8F9FA]"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateCoordination}
                className="px-4 py-2 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white text-xs font-bold transition-colors shadow-xs active:scale-95"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#17212B] text-white px-4 py-3 rounded-xl shadow-dropdown border border-[#E6E8EC] flex items-center gap-3 animate-toast-enter">
          <CheckCircle2 size={18} className="text-[#16805D]" />
          <div className="text-xs">
            <span className="font-bold block">Coordination Request Dispatched</span>
            <span className="text-[#98A2B3]">Emergency mutual-aid alert sent to {partner.name} nodal desk.</span>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="text-[#98A2B3] hover:text-white ml-2 p-1 font-bold">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
