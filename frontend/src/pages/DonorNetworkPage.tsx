import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, Clock, Network, Search,
  ChevronRight, MapPin, Activity, ShieldCheck,
  Info, Plus, UserX, AlertTriangle, Filter, X,
  CheckCircle2, ArrowRight, Zap
} from 'lucide-react'
import { PuneNetworkMap } from '@/components/overview/PuneNetworkMap'
import { cn } from '@/lib/utils'
import { NETWORK_METRICS } from '@/data/demoData'

// Comprehensive synthetic donor dataset (Privacy-protected with IDs, no PII)
const SYNTHETIC_DONORS = [
  {
    id: 'D1042',
    group: 'O-',
    readiness: 'Ready Now',
    readinessColor: 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]',
    zone: 'Wagholi, Pune',
    distance: '3.2 km',
    likelihood: '92%',
    lastActive: 'Today',
    load: 'Low',
    loadColor: 'bg-[#D1FAE5] text-[#059669]',
    cooldownEnd: 'Ready for activation',
    lastIncident: 'INC-PN-48291',
    donationsCount: 8,
    reliability: '98%',
    availableDays: 'Mon, Wed, Sat'
  },
  {
    id: 'D3819',
    group: 'O-',
    readiness: 'May Be Available',
    readinessColor: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    zone: 'Kothrud, Pune',
    distance: '5.7 km',
    likelihood: '86%',
    lastActive: 'Yesterday',
    load: 'Low',
    loadColor: 'bg-[#D1FAE5] text-[#059669]',
    cooldownEnd: 'Ready for activation',
    lastIncident: 'INC-PN-48287',
    donationsCount: 12,
    reliability: '94%',
    availableDays: 'Weekends'
  },
  {
    id: 'D5127',
    group: 'O-',
    readiness: 'May Be Available',
    readinessColor: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    zone: 'Baner, Pune',
    distance: '7.1 km',
    likelihood: '81%',
    lastActive: '2 days ago',
    load: 'Medium',
    loadColor: 'bg-[#FEF3C7] text-[#D97706]',
    cooldownEnd: 'Ready in 24h',
    lastIncident: 'INC-PN-48265',
    donationsCount: 5,
    reliability: '91%',
    availableDays: 'Evenings'
  },
  {
    id: 'D8821',
    group: 'O-',
    readiness: 'Ready Now',
    readinessColor: 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]',
    zone: 'Hadapsar, Pune',
    distance: '6.1 km',
    likelihood: '78%',
    lastActive: 'Today',
    load: 'Low',
    loadColor: 'bg-[#D1FAE5] text-[#059669]',
    cooldownEnd: 'Ready for activation',
    lastIncident: 'INC-PN-48210',
    donationsCount: 14,
    reliability: '96%',
    availableDays: 'All days'
  },
  {
    id: 'D2234',
    group: 'O-',
    readiness: 'Temporarily Unavailable',
    readinessColor: 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]',
    zone: 'Aundh, Pune',
    distance: '8.9 km',
    likelihood: '73%',
    lastActive: '5 days ago',
    load: 'High',
    loadColor: 'bg-[#FFE4E6] text-[#E11D48]',
    cooldownEnd: 'Cooling: 14 days remaining',
    lastIncident: 'INC-PN-48190',
    donationsCount: 9,
    reliability: '89%',
    availableDays: 'On cooldown'
  },
  {
    id: 'D9012',
    group: 'AB-',
    readiness: 'Status Unknown',
    readinessColor: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
    zone: 'Hadapsar, Pune',
    distance: '4.5 km',
    likelihood: '64%',
    lastActive: '12 days ago',
    load: 'Low',
    loadColor: 'bg-[#D1FAE5] text-[#059669]',
    cooldownEnd: 'Verification pending',
    lastIncident: 'None',
    donationsCount: 2,
    reliability: '75%',
    availableDays: 'Unspecified'
  },
  {
    id: 'D4411',
    group: 'A-',
    readiness: 'Ready Now',
    readinessColor: 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]',
    zone: 'Baner, Pune',
    distance: '6.8 km',
    likelihood: '89%',
    lastActive: 'Today',
    load: 'Low',
    loadColor: 'bg-[#D1FAE5] text-[#059669]',
    cooldownEnd: 'Ready for activation',
    lastIncident: 'INC-PN-48279',
    donationsCount: 6,
    reliability: '93%',
    availableDays: 'Tue, Thu, Sun'
  },
  {
    id: 'D6730',
    group: 'B-',
    readiness: 'May Be Available',
    readinessColor: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    zone: 'Wagholi, Pune',
    distance: '2.9 km',
    likelihood: '83%',
    lastActive: '3 days ago',
    load: 'Medium',
    loadColor: 'bg-[#FEF3C7] text-[#D97706]',
    cooldownEnd: 'Ready for activation',
    lastIncident: 'INC-PN-48201',
    donationsCount: 7,
    reliability: '88%',
    availableDays: 'Weekdays'
  },
  {
    id: 'D1109',
    group: 'O+',
    readiness: 'Ready Now',
    readinessColor: 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]',
    zone: 'Pimpri, Pune',
    distance: '12.1 km',
    likelihood: '95%',
    lastActive: 'Today',
    load: 'Low',
    loadColor: 'bg-[#D1FAE5] text-[#059669]',
    cooldownEnd: 'Ready for activation',
    lastIncident: 'INC-PN-48155',
    donationsCount: 21,
    reliability: '99%',
    availableDays: 'All days'
  },
  {
    id: 'D7854',
    group: 'A+',
    readiness: 'Ready Now',
    readinessColor: 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]',
    zone: 'Shivajinagar, Pune',
    distance: '4.1 km',
    likelihood: '91%',
    lastActive: 'Yesterday',
    load: 'Low',
    loadColor: 'bg-[#D1FAE5] text-[#059669]',
    cooldownEnd: 'Ready for activation',
    lastIncident: 'INC-PN-48240',
    donationsCount: 11,
    reliability: '95%',
    availableDays: 'Weekends'
  },
  {
    id: 'D3021',
    group: 'B+',
    readiness: 'May Be Available',
    readinessColor: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    zone: 'Kothrud, Pune',
    distance: '5.2 km',
    likelihood: '84%',
    lastActive: 'Today',
    load: 'Medium',
    loadColor: 'bg-[#FEF3C7] text-[#D97706]',
    cooldownEnd: 'Ready in 12h',
    lastIncident: 'INC-PN-48230',
    donationsCount: 4,
    reliability: '87%',
    availableDays: 'Mornings'
  },
  {
    id: 'D9543',
    group: 'AB+',
    readiness: 'Temporarily Unavailable',
    readinessColor: 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]',
    zone: 'Viman Nagar, Pune',
    distance: '9.4 km',
    likelihood: '68%',
    lastActive: '8 days ago',
    load: 'High',
    loadColor: 'bg-[#FFE4E6] text-[#E11D48]',
    cooldownEnd: 'Cooling: 45 days remaining',
    lastIncident: 'INC-PN-48100',
    donationsCount: 15,
    reliability: '92%',
    availableDays: 'On post-donation cooldown'
  }
]

export function DonorNetworkPage() {
  const navigate = useNavigate()
  const metrics = NETWORK_METRICS
  const [searchTerm, setSearchTerm] = useState('')
  const [readinessFilter, setReadinessFilter] = useState('All')
  const [selectedGroup, setSelectedGroup] = useState('All')
  const [selectedZone, setSelectedZone] = useState('All')
  const [selectedLoad, setSelectedLoad] = useState('All')
  const [selectedDonor, setSelectedDonor] = useState<typeof SYNTHETIC_DONORS[0] | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportToast, setShowImportToast] = useState(false)

  // Filtered Donors Logic
  const filteredDonors = SYNTHETIC_DONORS.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.group.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesReadiness = readinessFilter === 'All' || d.readiness === readinessFilter
    const matchesGroup = selectedGroup === 'All' || d.group === selectedGroup
    const matchesZone = selectedZone === 'All' || d.zone.toLowerCase().includes(selectedZone.toLowerCase())
    const matchesLoad = selectedLoad === 'All' || d.load === selectedLoad

    return matchesSearch && matchesReadiness && matchesGroup && matchesZone && matchesLoad
  })

  const handleSimulateImport = () => {
    setShowAddModal(false)
    setShowImportToast(true)
    setTimeout(() => setShowImportToast(false), 4000)
  }

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-16">
      {/* Toast Notification for Import Simulation */}
      {showImportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl border border-gray-800 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#10B981]" />
          <div className="text-xs">
            <span className="font-bold block">Donor Registry Updated</span>
            <span className="text-gray-400">150 verified donors imported to Pune node. Capacity updated.</span>
          </div>
          <button onClick={() => setShowImportToast(false)} className="text-gray-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight flex items-center gap-2">
            <span>Donor Network</span>
            <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold border border-[#BFDBFE]">
              Pune Operational Pool
            </span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Understand usable donor capacity, readiness and network coverage across Pune.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#6B7280] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="font-mono">Last updated: 21:42 IST</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus size={16} />
            <span>+ Add / Import Donors</span>
          </button>
        </div>
      </div>

      {/* SECTION 1 — 5 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Registered Donors */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Registered Donors</span>
            </div>
            <span className="text-[10px] font-bold text-[#6B7280] bg-[#F3F4F6] px-1.5 py-0.5 rounded">Total Pool</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">20,000</span>
            <span className="text-[11px] text-[#6B7280]">Registered capacity</span>
          </div>
        </div>

        {/* Card 2: Ready Now */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#10B981] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D1FAE5] text-[#10B981] flex items-center justify-center shrink-0">
                <UserCheck size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Ready Now</span>
            </div>
            <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">
              ↑ 143 verified
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{metrics.ready_donors.toLocaleString()}</span>
            <span className="text-[11px] text-[#059669] font-semibold">21.1% immediate</span>
          </div>
        </div>

        {/* Card 3: May Be Available */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#F59E0B] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">May Be Available</span>
            </div>
            <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">Standby</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{metrics.maybe_available.toLocaleString()}</span>
            <span className="text-[11px] text-[#D97706] font-semibold">9.2% flexible cohort</span>
          </div>
        </div>

        {/* Card 4: Temporarily Unavailable */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#E11D48] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
                <UserX size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Unavailable</span>
            </div>
            <span className="text-[10px] font-bold text-[#E11D48] bg-[#FFE4E6] px-1.5 py-0.5 rounded">Cooldown</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{metrics.temporarily_unavailable.toLocaleString()}</span>
            <span className="text-[11px] text-[#E11D48] font-semibold">10.5% guarded</span>
          </div>
        </div>

        {/* Card 5: Network Coverage */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#2563EB] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                <Network size={16} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Coverage</span>
            </div>
            <span className="text-[10px] font-bold text-[#2563EB] bg-[#DBEAFE] px-1.5 py-0.5 rounded">Pune</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">{metrics.network_coverage_percent}%</span>
            <span className="text-[11px] text-[#2563EB] font-semibold">Operational grid</span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Usable Capacity Breakdown Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-3">
          <div>
            <div className="flex items-center gap-2 text-[#E11D48] font-bold text-xs mb-1">
              <Info size={15} />
              <span className="tracking-wide">RAKTSETU CAPACITY PRINCIPLE</span>
            </div>
            <h3 className="text-base font-bold text-[#111827] font-display">Usable Donor Capacity Breakdown</h3>
          </div>
          <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-lg px-3 py-1.5 text-xs text-[#E11D48] font-medium flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>"Only donors with current readiness can be treated as immediately usable response capacity."</span>
          </div>
        </div>

        {/* Pipeline Diagram Visual */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#4B5563] px-1">
            <span>Registered Pool (20,000 Donors)</span>
            <span className="text-[#10B981]">Usable Now: 4,218 Donors (21.1%)</span>
          </div>

          {/* Segmented Capacity Bar */}
          <div className="h-5 w-full rounded-lg overflow-hidden flex bg-[#F3F4F6] p-0.5 border border-[#E5E7EB]">
            <div className="h-full bg-[#10B981] rounded-l transition-all" style={{ width: '21.1%' }} title="Ready Now: 4,218" />
            <div className="h-full bg-[#F59E0B] transition-all" style={{ width: '9.2%' }} title="May Be Available: 1,842" />
            <div className="h-full bg-[#E11D48] transition-all" style={{ width: '10.5%' }} title="Temporarily Unavailable: 2,104" />
            <div className="h-full bg-[#9CA3AF] transition-all" style={{ width: '5.4%' }} title="Status Unknown: 1,086" />
            <div className="h-full bg-[#E5E7EB] rounded-r transition-all" style={{ width: '53.8%' }} title="Dormant Pool: 10,750" />
          </div>

          {/* Detailed Breakdown Legend Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
              <span className="w-3 h-3 rounded-full bg-[#10B981] shrink-0" />
              <div>
                <span className="font-bold text-xs text-[#111827] block">4,218 Ready Now</span>
                <span className="text-[10px] text-[#059669] font-medium">21.1% immediately usable</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B] shrink-0" />
              <div>
                <span className="font-bold text-xs text-[#111827] block">1,842 Standby</span>
                <span className="text-[10px] text-[#D97706] font-medium">9.2% flexible cohort</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
              <span className="w-3 h-3 rounded-full bg-[#E11D48] shrink-0" />
              <div>
                <span className="font-bold text-xs text-[#111827] block">2,104 Unavailable</span>
                <span className="text-[10px] text-[#E11D48] font-medium">10.5% active cooldown</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
              <span className="w-3 h-3 rounded-full bg-[#9CA3AF] shrink-0" />
              <div>
                <span className="font-bold text-xs text-[#111827] block">1,086 Unknown</span>
                <span className="text-[10px] text-[#6B7280] font-medium">5.4% status pending</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
              <span className="w-3 h-3 rounded-full bg-[#CBD5E1] shrink-0" />
              <div>
                <span className="font-bold text-xs text-[#111827] block">10,750 Dormant</span>
                <span className="text-[10px] text-[#6B7280] font-medium">53.8% registered pool</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 — Main Workspace (Filters, Table & Lateral Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Donor Roster & Filters (Col 7 / ~60%) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search donors by ID, zone, blood group..."
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

              {/* Secondary Filter Dropdowns */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Blood Group */}
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-2 outline-none cursor-pointer hover:border-[#CBD5E1]"
                >
                  <option value="All">All Blood Groups</option>
                  <option value="O-">O- (Critical)</option>
                  <option value="A-">A- (High Risk)</option>
                  <option value="B-">B- (High Risk)</option>
                  <option value="AB-">AB- (Critical)</option>
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                </select>

                {/* Zone */}
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-2 outline-none cursor-pointer hover:border-[#CBD5E1]"
                >
                  <option value="All">All Zones</option>
                  <option value="Wagholi">Wagholi</option>
                  <option value="Hadapsar">Hadapsar</option>
                  <option value="Kothrud">Kothrud</option>
                  <option value="Baner">Baner</option>
                  <option value="Aundh">Aundh</option>
                  <option value="Pimpri">Pimpri</option>
                  <option value="Shivajinagar">Shivajinagar</option>
                </select>

                {/* Load */}
                <select
                  value={selectedLoad}
                  onChange={(e) => setSelectedLoad(e.target.value)}
                  className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-2 outline-none cursor-pointer hover:border-[#CBD5E1]"
                >
                  <option value="All">All Load Levels</option>
                  <option value="Low">Low Load</option>
                  <option value="Medium">Medium Load</option>
                  <option value="High">High Load</option>
                </select>
              </div>
            </div>

            {/* Readiness Filter Segmented Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#F3F4F6] scrollbar-none">
              <span className="text-xs text-[#6B7280] font-semibold shrink-0 flex items-center gap-1">
                <Filter size={12} />
                <span>Readiness:</span>
              </span>
              {(['All', 'Ready Now', 'May Be Available', 'Temporarily Unavailable', 'Status Unknown'] as const).map((r) => {
                const isActive = readinessFilter === r
                return (
                  <button
                    key={r}
                    onClick={() => setReadinessFilter(r)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0',
                      isActive
                        ? 'bg-[#E11D48] text-white shadow-2xs'
                        : 'bg-[#F9FAFB] text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
                    )}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Operational Donor Roster (Table/Card Hybrid) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#111827] font-display">Operational Donor Roster</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold">
                  {filteredDonors.length} Donors
                </span>
              </div>
              <span className="text-xs text-[#6B7280]">Ranked by response likelihood & readiness</span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Donor ID</th>
                    <th className="px-3 py-3">Blood Group</th>
                    <th className="px-3 py-3">Readiness</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Distance</th>
                    <th className="px-3 py-3">Likelihood</th>
                    <th className="px-3 py-3">Last Active</th>
                    <th className="px-3 py-3">Load</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredDonors.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDonor(d)}
                      className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-bold font-mono text-[#111827] group-hover:text-[#E11D48]">
                        {d.id}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold font-mono text-[11px]">
                          {d.group}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border', d.readinessColor)}>
                          {d.readiness}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-[#4B5563] font-medium">{d.zone}</td>
                      <td className="px-3 py-3.5 text-[#6B7280]">{d.distance}</td>
                      <td className="px-3 py-3.5 font-bold text-[#10B981]">{d.likelihood}</td>
                      <td className="px-3 py-3.5 text-[#6B7280]">{d.lastActive}</td>
                      <td className="px-3 py-3.5">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', d.loadColor)}>
                          {d.load}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDonor(d)
                          }}
                          className="px-2.5 py-1 rounded bg-[#F3F4F6] group-hover:bg-[#E11D48] group-hover:text-white text-[#4B5563] text-[11px] font-semibold transition-all"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden divide-y divide-[#E5E7EB]">
              {filteredDonors.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDonor(d)}
                  className="p-4 space-y-2 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#111827]">{d.id}</span>
                      <span className="px-2 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold text-xs font-mono">
                        {d.group}
                      </span>
                    </div>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border', d.readinessColor)}>
                      {d.readiness}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[#6B7280] pt-1">
                    <div>Location: <strong className="text-[#111827]">{d.zone}</strong></div>
                    <div>Distance: <strong className="text-[#111827]">{d.distance}</strong></div>
                    <div>Likelihood: <strong className="text-[#10B981]">{d.likelihood}</strong></div>
                    <div>Donor Load: <strong className="text-[#111827]">{d.load}</strong></div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDonors.length === 0 && (
              <div className="p-12 text-center text-xs text-[#6B7280] space-y-2">
                <Search size={24} className="mx-auto text-gray-300" />
                <p className="font-semibold text-gray-700">No donors match your search criteria</p>
                <p>Try clearing filters or broadening your search terms.</p>
              </div>
            )}

            {/* Privacy Protection Banner Notice */}
            <div className="p-4 bg-[#FFF1F2] border-t border-[#FECDD3] flex items-center gap-3">
              <ShieldCheck size={20} className="text-[#E11D48] shrink-0" />
              <div className="text-xs text-[#4B5563]">
                <strong className="text-[#E11D48] font-bold block">
                  Donor contact information is revealed only through an authorised response workflow.
                </strong>
                All access is strictly audit-logged to maintain donor privacy, safety and consent.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Geographic Map, Blood Group Capacity & Attention (Col 5 / ~40%) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Donor Coverage Map */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#E11D48]" />
                <h4 className="text-sm font-bold text-[#111827] font-display">Donor Coverage — Pune</h4>
              </div>
              <span className="text-[11px] font-bold text-[#10B981] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                87% District Grid
              </span>
            </div>

            <div className="h-[240px] rounded-xl overflow-hidden border border-[#E5E7EB]">
              <PuneNetworkMap />
            </div>

            {/* Map Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-[#4B5563]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>Strong (&gt;250 ready)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span>Moderate (100-250)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                <span>Critical Gap (&lt;50 ready)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span>Hospital Nodes</span>
              </div>
            </div>
          </div>

          {/* Card 2: Blood Group Capacity Grid */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#2563EB]" />
                <h4 className="text-sm font-bold text-[#111827] font-display">Blood Group Capacity</h4>
              </div>
              <span className="text-xs text-[#6B7280]">8 Groups Tracked</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 text-center">
              {metrics.blood_group_resilience.map((r) => (
                <div
                  key={r.blood_group}
                  className={cn(
                    'p-2.5 rounded-xl border space-y-1 transition-all',
                    r.status === 'Critical'
                      ? 'bg-[#FFF1F2] border-[#FECDD3]'
                      : r.status === 'High Risk'
                      ? 'bg-[#FFFBEB] border-[#FDE68A]'
                      : r.status === 'Stable'
                      ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                      : 'bg-[#F9FAFB] border-[#E5E7EB]'
                  )}
                >
                  <div className="font-bold font-mono text-sm text-[#111827]">{r.blood_group}</div>
                  <div className="text-xs font-bold text-[#4B5563]">{r.ready_count} ready</div>
                  <div className="text-[10px] text-[#6B7280]">{r.coverage_percent}% coverage</div>
                  <span
                    className={cn(
                      'inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase mt-0.5',
                      r.status === 'Critical'
                        ? 'bg-[#FFE4E6] text-[#E11D48]'
                        : r.status === 'High Risk'
                        ? 'bg-[#FEF3C7] text-[#D97706]'
                        : r.status === 'Stable'
                        ? 'bg-[#DBEAFE] text-[#2563EB]'
                        : 'bg-[#D1FAE5] text-[#059669]'
                    )}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Network Attention & Gaps */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#E11D48]" />
                <h4 className="text-sm font-bold text-[#111827] font-display">Network Attention</h4>
              </div>
              <span className="text-[10px] font-bold text-[#E11D48] bg-[#FFE4E6] px-2 py-0.5 rounded-full">
                3 Critical Gaps
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {metrics.gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-3 rounded-xl border flex items-center justify-between gap-3',
                    gap.severity === 'Critical' ? 'bg-[#FFF1F2] border-[#FECDD3]' : 'bg-[#FFFBEB] border-[#FDE68A]'
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111827] font-mono">{gap.blood_group}</span>
                      <span className="text-[#4B5563] font-semibold">· {gap.zone}</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">
                      {gap.severity === 'Critical' ? 'Critical capacity gap' : 'Low active coverage'} · {gap.ready_now} ready now
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/incidents/create')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-white text-[11px] font-bold shrink-0 shadow-2xs transition-transform active:scale-95',
                      gap.severity === 'Critical' ? 'bg-[#E11D48] hover:bg-[#BE123C]' : 'bg-[#F59E0B] hover:bg-[#D97706]'
                    )}
                  >
                    {gap.severity === 'Critical' ? 'Re-engage' : 'View Gap'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Donor Engagement & Load Protections */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[#10B981]" />
                <h4 className="text-sm font-bold text-[#111827] font-display">Donor Engagement & Load</h4>
              </div>
              <span className="text-[11px] font-semibold text-[#10B981]">Fatigue Guarded</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <span className="text-[10px] text-[#6B7280] block font-medium">Response Rate</span>
                <span className="text-base font-bold text-[#111827]">78.4%</span>
                <span className="text-[10px] text-[#10B981] block font-semibold">Median 8.7 min time</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <span className="text-[10px] text-[#6B7280] block font-medium">Active This Week</span>
                <span className="text-base font-bold text-[#111827]">1,420</span>
                <span className="text-[10px] text-[#2563EB] block font-semibold">Across Pune network</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <span className="text-[10px] text-[#6B7280] block font-medium">Re-engageable</span>
                <span className="text-base font-bold text-[#111827]">650</span>
                <span className="text-[10px] text-[#D97706] block font-semibold">Post-cooldown ready</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-0.5">
                <span className="text-[10px] text-[#6B7280] block font-medium">Outreach Avoided</span>
                <span className="text-base font-bold text-[#10B981]">6</span>
                <span className="text-[10px] text-[#059669] block font-semibold">Duplicates blocked</span>
              </div>
            </div>

            <p className="text-[11px] text-[#6B7280] bg-[#F9FAFB] p-2.5 rounded-lg border border-[#E5E7EB]">
              <strong>Donor Fatigue Protection:</strong> RAKTSETU automatically paces activation waves to prevent repeated outreach to the same donors.
            </p>
          </div>
        </div>
      </div>

      {/* DONOR DETAIL MODAL / DRAWER */}
      {selectedDonor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E5E7EB] shadow-2xl overflow-hidden space-y-4 animate-scale-up">
            {/* Header */}
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono text-[#111827]">{selectedDonor.id}</span>
                <span className="px-2.5 py-0.5 rounded bg-[#FFE4E6] text-[#E11D48] font-bold text-xs font-mono">
                  {selectedDonor.group}
                </span>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border', selectedDonor.readinessColor)}>
                  {selectedDonor.readiness}
                </span>
              </div>

              <button
                onClick={() => setSelectedDonor(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Approximate Location</span>
                  <span className="font-bold text-[#111827] flex items-center gap-1 mt-0.5">
                    <MapPin size={13} className="text-[#E11D48]" />
                    {selectedDonor.zone} ({selectedDonor.distance})
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Response Likelihood</span>
                  <span className="font-bold text-[#10B981] flex items-center gap-1 mt-0.5">
                    <Activity size={13} />
                    {selectedDonor.likelihood} Match Confidence
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Recent Response Load</span>
                  <span className={cn('font-bold px-2 py-0.5 rounded text-[10px] inline-block mt-0.5', selectedDonor.loadColor)}>
                    {selectedDonor.load} Load Level
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Reliability Score</span>
                  <span className="font-bold text-[#2563EB] mt-0.5 block">{selectedDonor.reliability} Verified</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#111827] block text-xs">Availability & Cooldown Status</span>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cooldown State:</span>
                    <span className="font-bold text-gray-800">{selectedDonor.cooldownEnd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Typical Availability:</span>
                    <span className="font-bold text-gray-800">{selectedDonor.availableDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Historical Donations:</span>
                    <span className="font-bold text-gray-800">{selectedDonor.donationsCount} verified units</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-xs text-[#4B5563] space-y-1">
                <div className="flex items-center gap-2 text-[#E11D48] font-bold">
                  <ShieldCheck size={16} />
                  <span>Privacy Protection</span>
                </div>
                <p>
                  Contact information for {selectedDonor.id} is encrypted and protected. Contact dispatch is only permitted after triggering an active response cascade wave.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedDonor(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close Profile
              </button>
              <button
                onClick={() => {
                  setSelectedDonor(null)
                  navigate('/incidents/INC-PN-48291')
                }}
                className="px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Select for Active Incident</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / IMPORT DONOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl overflow-hidden space-y-4 animate-scale-up">
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#E11D48]" />
                <h3 className="font-bold font-display text-sm text-[#111827]">Add / Import Donors</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-gray-600">
                Import verified donor datasets or integrate partner NGO records into RAKTSETU's Pune node.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSimulateImport}
                  className="w-full p-3 rounded-xl border border-gray-200 hover:border-[#E11D48] hover:bg-[#FFF1F2] text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-gray-900 group-hover:text-[#E11D48] block">
                      Batch Import CSV Registry
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Upload verified donor list from e-RaktKosh or partner blood bank
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-[#E11D48]" />
                </button>

                <button
                  onClick={handleSimulateImport}
                  className="w-full p-3 rounded-xl border border-gray-200 hover:border-[#E11D48] hover:bg-[#FFF1F2] text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-gray-900 group-hover:text-[#E11D48] block">
                      Sync Partner Organisation Pool
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Connect UPAY Pune, Rotary or College network API
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-[#E11D48]" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
