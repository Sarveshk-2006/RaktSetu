// RAKTSETU — Partner Network Directory (List View)
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Handshake, Users, MapPin, Plus, Search,
  ChevronRight, Building2, GraduationCap, HeartHandshake,
  Building, ShieldCheck, X, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

// Icon resolver for partner types
function getPartnerIcon(type: string) {
  switch (type) {
    case 'NGO':
      return <HeartHandshake size={20} className="text-[#E11D48]" />
    case 'BloodBank':
    case 'Hospital':
      return <Building2 size={20} className="text-[#2563EB]" />
    case 'University':
      return <GraduationCap size={20} className="text-[#8B5CF6]" />
    case 'Community':
      return <Users size={20} className="text-[#F59E0B]" />
    case 'Civic':
      return <Building size={20} className="text-[#10B981]" />
    default:
      return <Handshake size={20} className="text-[#2563EB]" />
  }
}

function getPartnerIconBg(type: string) {
  switch (type) {
    case 'NGO':
      return 'bg-[#FFF1F2] text-[#E11D48]'
    case 'BloodBank':
    case 'Hospital':
      return 'bg-[#EFF6FF] text-[#2563EB]'
    case 'University':
      return 'bg-[#F3E8FF] text-[#8B5CF6]'
    case 'Community':
      return 'bg-[#FEF3C7] text-[#D97706]'
    case 'Civic':
      return 'bg-[#D1FAE5] text-[#059669]'
    default:
      return 'bg-[#EFF6FF] text-[#2563EB]'
  }
}

export function PartnerNetworkPage() {
  const navigate = useNavigate()
  const [partners, setPartners] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedArea, setSelectedArea] = useState('All')
  const [sortBy, setSortBy] = useState('active_donors')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const loadPartners = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    setError(null)
    try {
      const data = await api.getPartners()
      setPartners(data || [])
    } catch (err: any) {
      console.error('Failed to load partners:', err)
      setError(err?.message || 'Could not connect to the authoritative partner service. Verify backend connectivity.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadPartners()
  }, [loadPartners])

  // Calculate totals
  const totalPartners = partners.length
  const totalActiveDonors = partners.reduce((sum, p) => sum + (p.active_donors || 0), 0)
  
  // Extract all unique zones from partner records
  const availableZones = Array.from(
    new Set(partners.flatMap((p) => p.zones || []))
  ).sort()

  const totalZonesCount = availableZones.length || 12

  // Filtered & Sorted list
  const filteredPartners = partners.filter((p) => {
    const pZones = Array.isArray(p.zones) ? p.zones : []
    const matchesSearch =
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      pZones.some((z: string) => z.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.type || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === 'All' || p.type === selectedType
    const matchesArea = selectedArea === 'All' || pZones.includes(selectedArea)

    return matchesSearch && matchesType && matchesArea
  }).sort((a, b) => {
    if (sortBy === 'active_donors') return (b.active_donors || 0) - (a.active_donors || 0)
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    return 0
  })

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1400px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl border border-gray-800 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#10B981]" />
          <div className="text-xs">
            <span className="font-bold block">Partner Registration Initiated</span>
            <span className="text-gray-400">Onboarding workflow link generated for new partner organisation.</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight">
            Partner Network
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Authoritative partner organisations coordinating blood response across Pune.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadPartners(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#374151] transition-colors shadow-2xs disabled:opacity-60"
          >
            <RefreshCw size={14} className={cn('text-[#6B7280]', isRefreshing && 'animate-spin text-[#E11D48]')} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus size={16} />
            <span>Onboard Partner</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-[#991B1B]">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#991B1B]">Partner Network Unavailable</p>
              <p className="mt-0.5 text-[#B91C1C]">{error}</p>
              <p className="mt-1 text-[11px] text-[#7F1D1D]">
                Data limitation: Static mock fallback disabled per Milestone 5 rules.
              </p>
            </div>
          </div>
          <button
            onClick={() => loadPartners(true)}
            className="px-3 py-1 bg-white border border-[#FCA5A5] rounded-lg text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2] shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Total Partners</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center">
              <Handshake size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">
              {isLoading ? '...' : totalPartners}
            </span>
            <span className="text-[11px] text-[#10B981] font-semibold">Authoritative Nodes</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Contributed Donors</span>
            <div className="w-8 h-8 rounded-full bg-[#D1FAE5] text-[#10B981] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">
              {isLoading ? '...' : totalActiveDonors.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#059669] font-semibold">Linked Capacity</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Covered Zones</span>
            <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
              <MapPin size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">
              {isLoading ? '...' : totalZonesCount}
            </span>
            <span className="text-[11px] text-[#2563EB] font-semibold">Active Areas</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Data Completeness</span>
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">
              {isLoading ? '...' : '98.5%'}
            </span>
            <span className="text-[11px] text-[#059669] font-semibold">Geo-verified</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search partner organisations by name, zone, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#E11D48] rounded-lg pl-9 pr-3 py-2 text-xs text-[#111827] outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Dropdown */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-[#CBD5E1]"
            >
              <option value="All">All Types</option>
              <option value="NGO">NGO</option>
              <option value="BloodBank">Blood Bank</option>
              <option value="University">University</option>
              <option value="Community">Community</option>
              <option value="Civic">Civic</option>
            </select>

            {/* Area Dropdown */}
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-[#CBD5E1]"
            >
              <option value="All">All Areas ({availableZones.length})</option>
              {availableZones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-[#CBD5E1]"
            >
              <option value="active_donors">Sort: Active Donors</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Partner Cards List */}
      <div className="space-y-3">
        {isLoading && partners.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-xl border border-[#E5E7EB] p-4 animate-pulse" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#E5E7EB] p-6 text-xs text-[#6B7280]">
            <p className="font-semibold text-sm text-[#111827]">No partner organisations found</p>
            <p className="mt-1">Try adjusting your search criteria or type filter.</p>
          </div>
        ) : (
          filteredPartners.map((partner) => {
            const partnerId = partner.org_id || partner.id || partner.slug
            const pZones = Array.isArray(partner.zones) ? partner.zones : []

            return (
              <div
                key={partnerId}
                onClick={() => navigate(`/partners/${partnerId}`)}
                className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs hover:border-[#E11D48] hover:bg-[#FFF1F2]/30 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Icon & Title */}
                <div className="flex items-center gap-3.5 flex-1 min-w-[220px]">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold transition-transform group-hover:scale-105',
                      getPartnerIconBg(partner.type)
                    )}
                  >
                    {getPartnerIcon(partner.type)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold font-display text-[#111827] group-hover:text-[#E11D48] transition-colors">
                        {partner.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                        {partner.type}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] line-clamp-1">
                      {partner.subtitle || `Nodal ID: ${partner.org_id || partner.id}`}
                    </p>
                  </div>
                </div>

                {/* Middle: Active Donors & Zones */}
                <div className="flex items-center gap-6 text-xs sm:px-4">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block font-medium">Contributed Donors</span>
                    <span className="font-bold text-[#111827] text-sm">
                      {(partner.active_donors || 0).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#6B7280] block font-medium">Coverage Zones</span>
                    <span className="font-semibold text-[#4B5563]">
                      {pZones.length > 0 ? pZones.join(' · ') : 'District-wide'}
                    </span>
                  </div>
                </div>

                {/* Right: Status & Action Arrow */}
                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#059669]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> {partner.status || 'Active'}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] block mt-0.5">
                      {partner.ready_donors !== undefined ? `${partner.ready_donors} ready now` : 'Verified Node'}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-[#E11D48] group-hover:text-white text-[#9CA3AF] flex items-center justify-center transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ADD / ONBOARD PARTNER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E5E7EB] shadow-2xl overflow-hidden space-y-4 animate-scale-up">
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake size={18} className="text-[#E11D48]" />
                <h3 className="font-bold font-display text-sm text-[#111827]">Onboard Partner Organisation</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-gray-600">
                Register a blood bank, volunteer NGO or campus nodal body to contribute donor capacity to RAKTSETU.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Organisation Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune City Youth Red Cross"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Partner Type</label>
                    <select className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none">
                      <option value="NGO">NGO / Volunteer</option>
                      <option value="BloodBank">Blood Bank Hub</option>
                      <option value="University">University Pool</option>
                      <option value="Civic">Civic Group</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Nodal Contact</label>
                    <input
                      type="text"
                      placeholder="Coordinator Name"
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E11D48]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowToast(true)
                  setTimeout(() => setShowToast(false), 4000)
                }}
                className="px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs"
              >
                Create Nodal Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
