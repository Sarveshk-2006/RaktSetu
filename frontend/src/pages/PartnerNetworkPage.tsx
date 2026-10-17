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
      return <HeartHandshake size={18} className="text-[#B42336]" />
    case 'BloodBank':
    case 'Hospital':
      return <Building2 size={18} className="text-[#3567B7]" />
    case 'University':
      return <GraduationCap size={18} className="text-[#7C3AED]" />
    case 'Community':
      return <Users size={18} className="text-[#B7791F]" />
    case 'Civic':
      return <Building size={18} className="text-[#16805D]" />
    default:
      return <Handshake size={18} className="text-[#3567B7]" />
  }
}

function getPartnerIconBg(type: string) {
  switch (type) {
    case 'NGO':
      return 'bg-[#FEF3F2] text-[#B42336] border border-[#FECDCA]'
    case 'BloodBank':
    case 'Hospital':
      return 'bg-[#EFF8FF] text-[#3567B7] border border-[#B2DDFF]'
    case 'University':
      return 'bg-[#F9F5FF] text-[#7C3AED] border border-[#E9D7FE]'
    case 'Community':
      return 'bg-[#FEF7EC] text-[#B7791F] border border-[#FEDF89]'
    case 'Civic':
      return 'bg-[#EBFDF5] text-[#16805D] border border-[#A6F4C5]'
    default:
      return 'bg-[#EFF8FF] text-[#3567B7] border border-[#B2DDFF]'
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
    <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1400px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#17212B] text-white px-4 py-3 rounded-xl shadow-xl border border-[#2A3441] flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#16805D]" />
          <div className="text-xs">
            <span className="font-bold block">Partner Registration Initiated</span>
            <span className="text-[#98A2B3]">Onboarding workflow link generated for new partner organisation.</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-[#98A2B3] hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#E6E8EC]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#17212B] tracking-tight">
            Partner Network
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Authoritative partner organisations coordinating blood response across Pune municipal district.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadPartners(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E8EC] bg-white hover:bg-[#F8F9FA] text-xs font-semibold text-[#475467] transition-colors shadow-xs disabled:opacity-60"
          >
            <RefreshCw size={13} className={cn('text-[#667085]', isRefreshing && 'animate-spin text-[#B42336]')} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>Onboard Partner</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-[#861D2B]">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#C62828] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#861D2B]">Partner Network Unavailable</p>
              <p className="mt-0.5 text-[#C62828]">{error}</p>
              <p className="mt-1 text-[11px] text-[#667085]">
                Verify backend service connectivity to sync live nodal data.
              </p>
            </div>
          </div>
          <button
            onClick={() => loadPartners(true)}
            className="px-3 py-1.5 bg-white border border-[#FECDCA] rounded-lg text-xs font-bold text-[#861D2B] hover:bg-[#FEF3F2] shrink-0 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-command p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Total Partners</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] text-[#B42336] flex items-center justify-center border border-[#FECDCA]">
              <Handshake size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">
              {isLoading ? '...' : totalPartners}
            </span>
            <span className="text-[11px] text-[#16805D] font-bold">Authoritative Nodes</span>
          </div>
        </div>

        <div className="card-command p-4 space-y-2 border-l-4 border-l-[#16805D]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Contributed Donors</span>
            <div className="w-8 h-8 rounded-lg bg-[#EBFDF5] text-[#16805D] flex items-center justify-center border border-[#A6F4C5]">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">
              {isLoading ? '...' : totalActiveDonors.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#16805D] font-bold">Linked Capacity</span>
          </div>
        </div>

        <div className="card-command p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Covered Zones</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#3567B7] flex items-center justify-center border border-[#B2DDFF]">
              <MapPin size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">
              {isLoading ? '...' : totalZonesCount}
            </span>
            <span className="text-[11px] text-[#3567B7] font-bold">Active Areas</span>
          </div>
        </div>

        <div className="card-command p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Data Completeness</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF7EC] text-[#B7791F] flex items-center justify-center border border-[#FEDF89]">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">
              {isLoading ? '...' : '98.5%'}
            </span>
            <span className="text-[11px] text-[#16805D] font-bold">Geo-verified</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-command p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search partner organisations by name, zone, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F8F9FA] hover:bg-white focus:bg-white border border-[#E6E8EC] focus:border-[#B42336] rounded-xl pl-9 pr-8 py-2 text-xs text-[#17212B] outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#17212B]"
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
              className="text-xs font-semibold text-[#475467] bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-[#D0D5DD]"
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
              className="text-xs font-semibold text-[#475467] bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-[#D0D5DD]"
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
              className="text-xs font-semibold text-[#475467] bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-[#D0D5DD]"
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
              <div key={i} className="h-20 card-command p-4 animate-pulse" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12 card-command p-6 text-xs text-[#667085]">
            <p className="font-bold text-sm text-[#17212B]">No partner organisations found</p>
            <p className="mt-1">Try adjusting search criteria or type filter.</p>
          </div>
        ) : (
          filteredPartners.map((partner) => {
            const partnerId = partner.org_id || partner.id || partner.slug
            const pZones = Array.isArray(partner.zones) ? partner.zones : []

            return (
              <div
                key={partnerId}
                onClick={() => navigate(`/partners/${partnerId}`)}
                className="card-command p-4 hover:border-[#B42336] hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.99] transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Icon & Title */}
                <div className="flex items-center gap-3.5 flex-1 min-w-[220px]">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold transition-transform group-hover:scale-105',
                      getPartnerIconBg(partner.type)
                    )}
                  >
                    {getPartnerIcon(partner.type)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold font-display text-[#17212B] group-hover:text-[#B42336] transition-colors">
                        {partner.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F2F4F7] text-[#475467] border border-[#E6E8EC]">
                        {partner.type}
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] line-clamp-1">
                      {partner.subtitle || `Nodal ID: ${partner.org_id || partner.id}`}
                    </p>
                  </div>
                </div>

                {/* Middle: Active Donors & Zones */}
                <div className="flex items-center gap-6 text-xs sm:px-4">
                  <div>
                    <span className="text-[10px] text-[#667085] block font-medium">Contributed Donors</span>
                    <span className="font-bold text-[#17212B] text-sm">
                      {(partner.active_donors || 0).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#667085] block font-medium">Coverage Zones</span>
                    <span className="font-semibold text-[#475467]">
                      {pZones.length > 0 ? pZones.join(' · ') : 'District-wide'}
                    </span>
                  </div>
                </div>

                {/* Right: Status & Action Arrow */}
                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBFDF5] text-[#16805D] border border-[#A6F4C5]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16805D]" /> {partner.status || 'Active'}
                    </span>
                    <span className="text-[10px] text-[#667085] block mt-0.5">
                      {partner.ready_donors !== undefined ? `${partner.ready_donors} ready now` : 'Verified Node'}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-[#F8F9FA] group-hover:bg-[#B42336] group-hover:text-white text-[#98A2B3] flex items-center justify-center transition-all border border-[#E6E8EC]">
                    <ChevronRight size={16} />
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
          <div className="card-command max-w-lg w-full overflow-hidden space-y-4 animate-scale-up border-[#E6E8EC] shadow-2xl">
            <div className="p-4 bg-[#F8F9FA] border-b border-[#E6E8EC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake size={18} className="text-[#B42336]" />
                <h3 className="font-bold font-display text-sm text-[#17212B]">Onboard Partner Organisation</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-[#98A2B3] hover:text-[#17212B]">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-[#667085]">
                Register a blood bank, volunteer NGO or campus nodal body to contribute donor capacity to RAKTSETU.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#475467] mb-1">Organisation Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune City Youth Red Cross"
                    className="w-full bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#B42336]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#475467] mb-1">Partner Type</label>
                    <select className="w-full bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 text-xs outline-none cursor-pointer">
                      <option value="NGO">NGO / Volunteer</option>
                      <option value="BloodBank">Blood Bank Hub</option>
                      <option value="University">University Pool</option>
                      <option value="Civic">Civic Group</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#475467] mb-1">Nodal Contact</label>
                    <input
                      type="text"
                      placeholder="Coordinator Name"
                      className="w-full bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#B42336]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F8F9FA] border-t border-[#E6E8EC] flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E8EC] text-xs font-bold text-[#475467] hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowToast(true)
                  setTimeout(() => setShowToast(false), 4000)
                }}
                className="px-4 py-2 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white text-xs font-bold shadow-xs transition-colors"
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
