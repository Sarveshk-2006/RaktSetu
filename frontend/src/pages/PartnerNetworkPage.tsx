// RAKTSETU — Partner Network Directory (List View)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Handshake, Users, MapPin, Activity, Plus, Search,
  ChevronRight, Building2, GraduationCap, HeartHandshake,
  Building, ShieldCheck, X, CheckCircle2, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PARTNERS_DATA, type Partner } from '@/data/partnersData'

// Icon resolver for partner types
function getPartnerIcon(type: Partner['type']) {
  switch (type) {
    case 'NGO':
      return <HeartHandshake size={20} className="text-[#E11D48]" />
    case 'BloodBank':
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

function getPartnerIconBg(type: Partner['type']) {
  switch (type) {
    case 'NGO':
      return 'bg-[#FFF1F2] text-[#E11D48]'
    case 'BloodBank':
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedArea, setSelectedArea] = useState('All')
  const [sortBy, setSortBy] = useState('active_donors')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Calculate totals
  const totalPartners = PARTNERS_DATA.length
  const totalActiveDonors = PARTNERS_DATA.reduce((sum, p) => sum + p.active_donors, 0)
  const totalZonesCount = 18 // Total unique zones in district

  // Filtered & Sorted list
  const filteredPartners = PARTNERS_DATA.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.zones.some((z) => z.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === 'All' || p.type === selectedType
    const matchesArea = selectedArea === 'All' || p.zones.includes(selectedArea)

    return matchesSearch && matchesType && matchesArea
  }).sort((a, b) => {
    if (sortBy === 'active_donors') return b.active_donors - a.active_donors
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  const handleSimulateAdd = () => {
    setShowAddModal(false)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight">
            Partner Network
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Partner organisations supporting blood availability across Pune.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Add Partner</span>
        </button>
      </div>

      {/* Compact KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Partners */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D1FAE5] text-[#10B981] flex items-center justify-center shrink-0">
                <Handshake size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Active Partners</span>
            </div>
            <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">Operational</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{totalPartners}</span>
            <span className="text-[11px] text-[#6B7280]">Across Pune</span>
          </div>
        </div>

        {/* Card 2: Active Donors */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#E11D48] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Active Donors</span>
            </div>
            <span className="text-[10px] font-bold text-[#E11D48] bg-[#FFE4E6] px-1.5 py-0.5 rounded">Contributed</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{totalActiveDonors.toLocaleString()}</span>
            <span className="text-[11px] text-[#6B7280]">Partner-contributed</span>
          </div>
        </div>

        {/* Card 3: Coverage Zones */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#2563EB] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                <MapPin size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Coverage Zones</span>
            </div>
            <span className="text-[10px] font-bold text-[#2563EB] bg-[#DBEAFE] px-1.5 py-0.5 rounded">District Grid</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{totalZonesCount}</span>
            <span className="text-[11px] text-[#6B7280]">Across partners</span>
          </div>
        </div>

        {/* Card 4: Partner Availability */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#F59E0B] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Activity size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Partner Availability</span>
            </div>
            <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">High Capacity</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">87%</span>
            <span className="text-[11px] text-[#6B7280]">Operational capacity</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search partners..."
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
              <option value="All">All Areas</option>
              <option value="Baner">Baner</option>
              <option value="Aundh">Aundh</option>
              <option value="Wakad">Wakad</option>
              <option value="Yerawada">Yerawada</option>
              <option value="Viman Nagar">Viman Nagar</option>
              <option value="Wagholi">Wagholi</option>
              <option value="Shivajinagar">Shivajinagar</option>
              <option value="Deccan">Deccan</option>
              <option value="Kothrud">Kothrud</option>
              <option value="Hadapsar">Hadapsar</option>
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
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            onClick={() => navigate(`/partners/${partner.slug}`)}
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
                <p className="text-xs text-[#6B7280] line-clamp-1">{partner.subtitle}</p>
              </div>
            </div>

            {/* Middle: Active Donors & Zones */}
            <div className="flex items-center gap-6 text-xs sm:px-4">
              <div>
                <span className="text-[10px] text-[#6B7280] block font-medium">Active Donors</span>
                <span className="font-bold text-[#111827] text-sm">{partner.active_donors.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#6B7280] block font-medium">Coverage Zones</span>
                <span className="font-semibold text-[#4B5563]">{partner.zones.join(' · ')}</span>
              </div>
            </div>

            {/* Right: Status & Action Arrow */}
            <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#059669]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Active
                </span>
                <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Sync: {partner.last_sync}</span>
              </div>

              <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-[#E11D48] group-hover:text-white text-[#9CA3AF] flex items-center justify-center transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        ))}

        {filteredPartners.length === 0 && (
          <div className="p-12 bg-white rounded-xl border border-[#E5E7EB] text-center text-xs text-[#6B7280] space-y-2">
            <Search size={24} className="mx-auto text-gray-300" />
            <p className="font-semibold text-gray-700">No partner organisations match your search criteria</p>
            <p>Try resetting filters or searching with different keywords.</p>
          </div>
        )}
      </div>

      {/* Subtle Bottom Information Banner */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs flex items-center gap-3 text-xs text-[#4B5563]">
        <ShieldCheck size={20} className="text-[#2563EB] shrink-0" />
        <div className="space-y-0.5">
          <p className="font-bold text-[#111827]">
            RAKTSETU coordinates existing organisations without replacing their internal workflows or systems.
          </p>
          <p className="text-[#6B7280] text-[11px]">
            Partners manage their own donors and operations. RAKTSETU provides coordination, visibility and faster emergency response.
          </p>
        </div>
      </div>

      {/* ADD PARTNER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl overflow-hidden space-y-4 animate-scale-up">
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#E11D48]" />
                <h3 className="font-bold font-display text-sm text-[#111827]">Add Partner Organisation</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-gray-600">
                Register a new NGO, Blood Bank, University, or Civic group on the RAKTSETU Pune Network node.
              </p>

              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Organisation Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rotary Club Wakad"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Partner Type</label>
                  <select className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E11D48]">
                    <option value="NGO">NGO Volunteer Network</option>
                    <option value="BloodBank">Blood Bank / Storage Hub</option>
                    <option value="University">University Campus Network</option>
                    <option value="Community">Community Group</option>
                    <option value="Civic">Civic Service Club</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Primary Coverage Zones</label>
                  <input
                    type="text"
                    placeholder="e.g. Wakad, Hinjawadi"
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E11D48]"
                  />
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
                onClick={handleSimulateAdd}
                className="px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Send Integration Link</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
