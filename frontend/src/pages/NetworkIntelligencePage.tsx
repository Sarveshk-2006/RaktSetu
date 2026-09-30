// RAKTSETU — Network Intelligence Page Redesign
import { useState } from 'react'
import {
  Network, RefreshCw, Users, AlertTriangle, MapPin, ShieldCheck,
  ArrowUpRight, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NETWORK_METRICS, PUNE_ZONES } from '@/data/demoData'
import { RaktsetuMap, type MapZone } from '@/components/maps/RaktsetuMap'

// Consolidated Regional Overview Items
const REGIONAL_OVERVIEW = [
  {
    name: 'Pimpri Chinchwad',
    capacityState: 'High Capacity',
    donorCount: 1240,
    statusColor: 'bg-[#10B981]',
    textColor: 'text-[#047857]',
    lat: 18.6280,
    lng: 73.7995,
    oNegStatus: 'Strong',
    partnerCoverage: 'Available (4 Partners)',
    medianResponse: '7.5 mins',
  },
  {
    name: 'Kothrud',
    capacityState: 'High Capacity',
    donorCount: 980,
    statusColor: 'bg-[#10B981]',
    textColor: 'text-[#047857]',
    lat: 18.5074,
    lng: 73.8077,
    oNegStatus: 'Strong',
    partnerCoverage: 'Available (3 Partners)',
    medianResponse: '8.2 mins',
  },
  {
    name: 'Hinjawadi',
    capacityState: 'Moderate Capacity',
    donorCount: 620,
    statusColor: 'bg-[#F59E0B]',
    textColor: 'text-[#D97706]',
    lat: 18.5995,
    lng: 73.7636,
    oNegStatus: 'Stable',
    partnerCoverage: 'Available (2 Partners)',
    medianResponse: '11.4 mins',
  },
  {
    name: 'Hadapsar',
    capacityState: 'High Capacity',
    donorCount: 860,
    statusColor: 'bg-[#10B981]',
    textColor: 'text-[#047857]',
    lat: 18.5018,
    lng: 73.9260,
    oNegStatus: 'Moderate',
    partnerCoverage: 'Available (3 Partners)',
    medianResponse: '9.0 mins',
  },
  {
    name: 'Wagholi',
    capacityState: 'Low Capacity',
    donorCount: 320,
    statusColor: 'bg-[#E11D48]',
    textColor: 'text-[#DC2626]',
    lat: 18.5593,
    lng: 73.9826,
    oNegStatus: 'Critical',
    partnerCoverage: 'Limited (1 Partner)',
    medianResponse: '17.0 mins',
  },
]

export function NetworkIntelligencePage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdatedTime, setLastUpdatedTime] = useState('30 Sep 2026, 10:45 PM')
  const [selectedRegion, setSelectedRegion] = useState<typeof REGIONAL_OVERVIEW[0] | null>(null)
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<typeof NETWORK_METRICS.blood_group_resilience[0] | null>(null)
  const [showResilienceModal, setShowResilienceModal] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      const now = new Date()
      const formatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      setLastUpdatedTime(formatted)
    }, 600)
  }

  // Convert PUNE_ZONES to MapZone format
  const mapZones: MapZone[] = PUNE_ZONES.map(z => ({
    zone: z.zone,
    lat: z.lat,
    lng: z.lng,
    donorCount: z.donorCount,
    readyNow: z.readyNow,
    severity: z.severity === 'Critical' ? 'Low Capacity' : z.severity === 'High Risk' ? 'Moderate Capacity' : 'High Capacity',
  }))

  const handleZoneClickOnMap = (mapZone: MapZone) => {
    const matched = REGIONAL_OVERVIEW.find(r => r.name.toLowerCase().includes(mapZone.zone.toLowerCase()))
    if (matched) {
      setSelectedRegion(matched)
    } else {
      setSelectedRegion({
        name: mapZone.zone,
        capacityState: mapZone.severity,
        donorCount: mapZone.donorCount || 400,
        statusColor: mapZone.severity.includes('Low') || mapZone.severity === 'Critical' ? 'bg-[#E11D48]' : mapZone.severity.includes('Moderate') ? 'bg-[#F59E0B]' : 'bg-[#10B981]',
        textColor: mapZone.severity.includes('Low') || mapZone.severity === 'Critical' ? 'text-[#DC2626]' : mapZone.severity.includes('Moderate') ? 'text-[#D97706]' : 'text-[#047857]',
        lat: mapZone.lat,
        lng: mapZone.lng,
        oNegStatus: mapZone.severity.includes('Low') ? 'Critical' : 'Stable',
        partnerCoverage: 'Available',
        medianResponse: '10.0 mins',
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* ─── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#E11D48]">
              <Network size={20} />
            </div>
            <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight">
              Network Intelligence
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Understand network capacity, blood group resilience and regional coverage across Pune.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span>Last updated</span>
            <span className="font-semibold text-[#111827]">{lastUpdatedTime}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#374151] transition-colors shadow-2xs disabled:opacity-60"
          >
            <RefreshCw size={14} className={cn('text-[#6B7280]', isRefreshing && 'animate-spin text-[#E11D48]')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 1: TOP KPI CARDS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usable Donors */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#10B981]">
              <Users size={18} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
              ↗ +12% vs last week
            </span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Usable Donors</div>
            <div className="text-3xl font-extrabold text-[#111827] font-display mt-0.5">5,060</div>
          </div>
          <p className="text-[11px] text-[#6B7280]">Ready now + currently usable capacity</p>
        </div>

        {/* At-Risk Donors */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#E11D48]">
              <AlertTriangle size={18} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B91C1C] bg-[#FEF2F2] px-2 py-0.5 rounded-full border border-[#FCA5A5]">
              ↗ +8% temp. unavailable
            </span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">At Risk Donors</div>
            <div className="text-3xl font-extrabold text-[#111827] font-display mt-0.5">2,104</div>
          </div>
          <p className="text-[11px] text-[#6B7280]">Temporarily unavailable</p>
        </div>

        {/* Coverage Areas */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
              <MapPin size={18} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
              Active Network
            </span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Coverage Areas</div>
            <div className="text-3xl font-extrabold text-[#111827] font-display mt-0.5">12</div>
          </div>
          <p className="text-[11px] text-[#6B7280]">Across Pune</p>
        </div>

        {/* Network Resilience */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#F3E8FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED]">
              <ShieldCheck size={18} />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
              ↗ +5% operational
            </span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Network Resilience</div>
            <div className="text-3xl font-extrabold text-[#111827] font-display mt-0.5">87%</div>
          </div>
          <p className="text-[11px] text-[#6B7280]">Operational coverage</p>
        </div>
      </div>

      {/* ─── ROW 2: BLOOD GROUP RESILIENCE & NETWORK CAPACITY ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 2: Blood Group Resilience (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-[#111827] font-display">Blood Group Resilience</h2>
              <p className="text-xs text-[#6B7280]">Availability of usable donors by blood group.</p>
            </div>
            <button
              onClick={() => setShowResilienceModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#111827] hover:text-[#E11D48] transition-colors self-start sm:self-auto"
            >
              <span>View Details</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* 8 Compact Vertical Capacity Columns */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-2">
            {NETWORK_METRICS.blood_group_resilience.map((bg) => {
              const statusColor =
                bg.status === 'Strong'
                  ? 'bg-[#10B981]'
                  : bg.status === 'Stable'
                  ? 'bg-[#2563EB]'
                  : bg.status === 'High Risk'
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#E11D48]'

              const statusBadgeClass =
                bg.status === 'Strong'
                  ? 'bg-[#ECFDF5] text-[#047857]'
                  : bg.status === 'Stable'
                  ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                  : bg.status === 'High Risk'
                  ? 'bg-[#FFFBEB] text-[#D97706]'
                  : 'bg-[#FEF2F2] text-[#B91C1C]'

              return (
                <div
                  key={bg.blood_group}
                  onClick={() => setSelectedBloodGroup(bg)}
                  className="flex flex-col items-center p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white hover:border-[#CBD5E1] hover:shadow-xs transition-all cursor-pointer text-center space-y-2 group"
                >
                  <span className="font-bold text-sm text-[#111827] font-display group-hover:text-[#E11D48] transition-colors">
                    {bg.blood_group}
                  </span>
                  <span className="text-xs font-extrabold text-[#374151]">
                    {bg.coverage_percent}%
                  </span>

                  {/* Vertical Progress Bar */}
                  <div className="w-full h-24 bg-[#E2E8F0] rounded-lg overflow-hidden flex flex-col justify-end p-0.5">
                    <div
                      className={cn('w-full rounded-md transition-all duration-500', statusColor)}
                      style={{ height: `${bg.coverage_percent}%` }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-[#4B5563]">
                      {bg.ready_count.toLocaleString()} ready
                    </div>
                    <span className={cn('inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider', statusBadgeClass)}>
                      {bg.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 3: Network Capacity Donut Chart (1 col) */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="pb-2 border-b border-[#E5E7EB]">
            <h2 className="text-base font-bold text-[#111827] font-display">Network Capacity</h2>
            <p className="text-xs text-[#6B7280]">Current donor availability across the Pune network.</p>
          </div>

          {/* SVG Donut Chart */}
          <div className="flex items-center justify-center my-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Not Currently Usable: 54% (dash: 54, offset: 0) -> slate */}
                <path
                  className="text-slate-300"
                  strokeWidth="3.8"
                  strokeDasharray="54, 100"
                  strokeDashoffset="0"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Temporarily Unavailable: 11% (dash: 11, offset: -54) -> red */}
                <path
                  className="text-[#E11D48]"
                  strokeWidth="3.8"
                  strokeDasharray="11, 100"
                  strokeDashoffset="-54"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* May Be Available: 9% (dash: 9, offset: -65) -> amber */}
                <path
                  className="text-[#F59E0B]"
                  strokeWidth="3.8"
                  strokeDasharray="9, 100"
                  strokeDashoffset="-65"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Ready Now: 25% (dash: 25, offset: -74) -> green */}
                <path
                  className="text-[#10B981]"
                  strokeWidth="3.8"
                  strokeDasharray="25, 100"
                  strokeDashoffset="-74"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-[#111827] font-display">20,000</span>
                <span className="text-[10px] text-[#6B7280] font-medium leading-none mt-0.5">
                  Registered Donors
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-[#E5E7EB] text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-[#374151] font-medium">Ready Now</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#111827]">5,060</span>
                <span className="text-[#6B7280] w-8 text-right font-mono">25%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="text-[#374151] font-medium">May Be Available</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#111827]">1,842</span>
                <span className="text-[#6B7280] w-8 text-right font-mono">9%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                <span className="text-[#374151] font-medium">Temporarily Unavailable</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#111827]">2,104</span>
                <span className="text-[#6B7280] w-8 text-right font-mono">11%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-[#374151] font-medium">Not Currently Usable</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#111827]">10,750</span>
                <span className="text-[#6B7280] w-8 text-right font-mono">54%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 3: PUNE NETWORK COVERAGE MAP & REGIONAL OVERVIEW ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 4: Pune Network Coverage (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-[#111827] font-display">Pune Network Coverage</h2>
              <p className="text-xs text-[#6B7280]">Regional donor density and response readiness across Pune.</p>
            </div>
            <button
              onClick={() => setSelectedRegion(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#111827] hover:text-[#E11D48] transition-colors"
            >
              <span>View Full Map</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Map */}
          <RaktsetuMap
            height="380px"
            center={[18.545, 73.875]}
            zoom={11}
            zones={mapZones}
            showLegend={true}
            showControls={true}
            onZoneClick={handleZoneClickOnMap}
          />
        </div>

        {/* Section 5: Regional Overview (1 col) */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-[#111827] font-display">Regional Overview</h2>
              <p className="text-xs text-[#6B7280]">Key areas by donor availability.</p>
            </div>
            <button
              onClick={() => setSelectedRegion(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#111827] hover:text-[#E11D48] transition-colors"
            >
              <span>View All Areas</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Selected Region Insight Panel or Regional List */}
          {selectedRegion ? (
            <div className="space-y-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full', selectedRegion.statusColor)} />
                  <h3 className="font-bold text-sm text-[#111827]">{selectedRegion.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-xs text-[#6B7280] hover:text-[#111827] p-1"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                  <span className="text-[#6B7280]">Capacity State</span>
                  <span className={cn('font-bold', selectedRegion.textColor)}>{selectedRegion.capacityState}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                  <span className="text-[#6B7280]">Usable Donors</span>
                  <span className="font-bold text-[#111827]">{selectedRegion.donorCount.toLocaleString()} donors</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                  <span className="text-[#6B7280]">O− Coverage</span>
                  <span className={cn('font-bold', selectedRegion.oNegStatus === 'Critical' ? 'text-[#DC2626]' : 'text-[#047857]')}>
                    {selectedRegion.oNegStatus}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                  <span className="text-[#6B7280]">Partner Coverage</span>
                  <span className="font-medium text-[#374151]">{selectedRegion.partnerCoverage}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6B7280]">Median Response</span>
                  <span className="font-medium text-[#374151]">{selectedRegion.medianResponse}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="w-full text-center py-1.5 bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] text-xs font-semibold text-[#374151] rounded-lg transition-colors shadow-2xs"
                >
                  Reset Region Selection
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {REGIONAL_OVERVIEW.map((item) => (
                <div
                  key={item.name}
                  onClick={() => setSelectedRegion(item)}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] hover:border-[#CBD5E1] transition-all cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', item.statusColor)} />
                      <span className="font-bold text-xs text-[#111827] group-hover:text-[#E11D48] transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <div className={cn('text-[11px] font-medium pl-4', item.textColor)}>
                      ● {item.capacityState}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xs text-[#111827]">
                      {item.donorCount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#6B7280]">usable donors</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── BLOOD GROUP RESILIENCE DETAIL MODAL ───────────────────────────── */}
      {(showResilienceModal || selectedBloodGroup) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-lg w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#E11D48] font-bold">
                  {selectedBloodGroup ? selectedBloodGroup.blood_group : 'B+'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#111827]">
                    Blood Group Resilience Detail
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    {selectedBloodGroup ? `Detailed metrics for ${selectedBloodGroup.blood_group}` : 'Network-wide blood group breakdown'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowResilienceModal(false)
                  setSelectedBloodGroup(null)
                }}
                className="text-xs text-[#6B7280] hover:text-[#111827] p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {NETWORK_METRICS.blood_group_resilience.map((bg) => (
                <div
                  key={bg.blood_group}
                  className={cn(
                    'p-3 rounded-xl border transition-all text-xs flex items-center justify-between',
                    selectedBloodGroup?.blood_group === bg.blood_group
                      ? 'border-[#E11D48] bg-[#FFF1F2]'
                      : 'border-[#E5E7EB] bg-[#F9FAFB]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 font-bold text-sm text-[#111827]">{bg.blood_group}</span>
                    <div>
                      <span className="font-bold text-[#111827]">{bg.coverage_percent}% Coverage</span>
                      <span className="text-[#6B7280] text-[11px] block">{bg.ready_count.toLocaleString()} ready donors</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      bg.status === 'Strong'
                        ? 'bg-[#ECFDF5] text-[#047857]'
                        : bg.status === 'Stable'
                        ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                        : bg.status === 'High Risk'
                        ? 'bg-[#FFFBEB] text-[#D97706]'
                        : 'bg-[#FEF2F2] text-[#B91C1C]'
                    )}
                  >
                    {bg.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowResilienceModal(false)
                  setSelectedBloodGroup(null)
                }}
                className="w-full py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
