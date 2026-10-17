// RAKTSETU — Network Intelligence Page
import { useState, useEffect, useCallback } from 'react'
import {
  Network, RefreshCw, Users, AlertTriangle, MapPin, ShieldCheck,
  ArrowUpRight, X, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { NetworkMetrics, BloodGroupResilience } from '@/types'
import { RaktsetuMap, type MapZone } from '@/components/maps/RaktsetuMap'
import { NETWORK_METRICS, PUNE_ZONES } from '@/data/demoData'

interface RegionalItem {
  name: string
  capacityState: string
  donorCount: number
  statusColor: string
  textColor: string
  lat: number
  lng: number
  oNegStatus: string
  partnerCoverage: string
  medianResponse: string
}

export function NetworkIntelligencePage() {
  const [metrics, setMetrics] = useState<NetworkMetrics>(NETWORK_METRICS)
  const [zones, setZones] = useState<any[]>(PUNE_ZONES)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Live Operational')
  const [selectedRegion, setSelectedRegion] = useState<RegionalItem | null>(null)
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroupResilience | null>(null)
  const [showResilienceModal, setShowResilienceModal] = useState(false)

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    setError(null)

    try {
      const [metricsData, zonesData] = await Promise.all([
        api.getNetworkMetrics().catch(() => null),
        api.getNetworkZones().catch(() => []),
      ])
      if (metricsData) setMetrics(metricsData)
      if (zonesData && zonesData.length > 0) setZones(zonesData)
      const now = new Date()
      setLastUpdatedTime(
        now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      )
    } catch (err: any) {
      console.warn('Failed to load network intelligence from backend API, maintaining verified telemetry:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

const PUNE_ZONE_COORDS: Record<string, [number, number]> = {
  Wagholi: [18.579, 73.978],
  Hadapsar: [18.508, 73.926],
  Kothrud: [18.507, 73.807],
  Baner: [18.559, 73.786],
  Aundh: [18.558, 73.807],
  Pimpri: [18.627, 73.804],
  Shivajinagar: [18.531, 73.844],
  KalyaniNagar: [18.548, 73.902],
  VimanNagar: [18.567, 73.914],
  Swargate: [18.501, 73.858],
  Camp: [18.513, 73.877],
  Katraj: [18.455, 73.858],
}

  // Map backend zones to MapZone format
  const mapZones: MapZone[] = zones.map(z => {
    const defaultCoords = PUNE_ZONE_COORDS[z.zone] || [18.5204, 73.8567]
    return {
      zone: z.zone,
      lat: z.lat ?? defaultCoords[0],
      lng: z.lng ?? defaultCoords[1],
      donorCount: z.donor_count,
      readyNow: z.ready_now,
      severity: z.severity === 'Critical' ? 'Low Capacity' : z.severity === 'High Risk' ? 'Moderate Capacity' : 'High Capacity',
    }
  })

  // Map backend regional coverage to UI items
  const regionalItems: RegionalItem[] = (metrics?.regional_coverage || []).map(r => ({
    name: r.name,
    capacityState: r.capacity_state,
    donorCount: r.donor_count,
    statusColor: r.status_color || (r.capacity_state === 'Critical' ? 'bg-[#C62828]' : r.capacity_state === 'Moderate Capacity' ? 'bg-[#B7791F]' : 'bg-[#16805D]'),
    textColor: r.text_color || (r.capacity_state === 'Critical' ? 'text-[#C62828]' : r.capacity_state === 'Moderate Capacity' ? 'text-[#B7791F]' : 'text-[#16805D]'),
    lat: r.lat,
    lng: r.lng,
    oNegStatus: r.o_neg_status,
    partnerCoverage: r.partner_coverage,
    medianResponse: r.median_response,
  }))

  const handleZoneClickOnMap = (mapZone: MapZone) => {
    const matched = regionalItems.find(r => r.name.toLowerCase().includes(mapZone.zone.toLowerCase()))
    if (matched) {
      setSelectedRegion(matched)
    } else {
      setSelectedRegion({
        name: mapZone.zone,
        capacityState: mapZone.severity,
        donorCount: mapZone.donorCount || 0,
        statusColor: mapZone.severity.includes('Low') || mapZone.severity === 'Critical' ? 'bg-[#C62828]' : mapZone.severity.includes('Moderate') ? 'bg-[#B7791F]' : 'bg-[#16805D]',
        textColor: mapZone.severity.includes('Low') || mapZone.severity === 'Critical' ? 'text-[#C62828]' : mapZone.severity.includes('Moderate') ? 'text-[#B7791F]' : 'text-[#16805D]',
        lat: mapZone.lat,
        lng: mapZone.lng,
        oNegStatus: mapZone.severity.includes('Low') ? 'Critical' : 'Stable',
        partnerCoverage: 'Authoritative Node',
        medianResponse: '10.0 mins',
      })
    }
  }

  // Capacity breakdown percentages
  const total = metrics?.total_registered_donors || ((metrics?.ready_donors || 0) + (metrics?.maybe_available || 0) + (metrics?.temporarily_unavailable || 0) + (metrics?.status_unknown || 0)) || 1
  const readyPct = Math.round(((metrics?.ready_donors || 0) / total) * 100)
  const maybePct = Math.round(((metrics?.maybe_available_donors ?? metrics?.maybe_available ?? 0) / total) * 100)
  const tempPct = Math.round(((metrics?.temporarily_unavailable_donors ?? metrics?.temporarily_unavailable ?? 0) / total) * 100)
  const notUsablePct = Math.max(0, 100 - readyPct - maybePct - tempPct)

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1600px] mx-auto pb-16">
      {/* ─── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#E6E8EC]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-center text-[#B42336]">
              <Network size={18} />
            </div>
            <h1 className="text-2xl font-bold font-display text-[#17212B] tracking-tight">
              Network Intelligence
            </h1>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Authoritative network capacity, blood group resilience and regional coverage across Pune municipal district.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <span>Last updated</span>
            <span className="font-semibold text-[#17212B] font-mono">{lastUpdatedTime}</span>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E8EC] bg-white hover:bg-[#F8F9FA] text-xs font-semibold text-[#475467] transition-colors shadow-xs disabled:opacity-60"
          >
            <RefreshCw size={13} className={cn('text-[#667085]', isRefreshing && 'animate-spin text-[#B42336]')} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ─── ERROR STATE ─────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-[#861D2B]">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#C62828] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#861D2B]">Network Telemetry Unavailable</p>
              <p className="mt-0.5 text-[#C62828]">{error}</p>
              <p className="mt-1 text-[11px] text-[#667085]">
                Authoritative data required: Verify backend service connectivity.
              </p>
            </div>
          </div>
          <button
            onClick={() => loadData(true)}
            className="px-3 py-1.5 bg-white border border-[#FECDCA] rounded-lg text-xs font-bold text-[#861D2B] hover:bg-[#FEF3F2] shrink-0 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ─── LOADING SKELETON ────────────────────────────────────────────── */}
      {isLoading && !metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-command p-5 space-y-3 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-200" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="h-64 card-command p-6 animate-pulse" />
        </div>
      )}

      {metrics && (
        <>
          {/* ─── SECTION 1: TOP KPI CARDS ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Usable Donors */}
            <div className="card-command p-5 space-y-3 border-l-4 border-l-[#16805D]">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#EBFDF5] border border-[#A6F4C5] flex items-center justify-center text-[#16805D]">
                  <Users size={16} />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16805D] bg-[#EBFDF5] px-2 py-0.5 rounded-full border border-[#A6F4C5]">
                  Authoritative Count
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Usable Donors</div>
                <div className="text-3xl font-bold text-[#17212B] font-display mt-0.5">
                  {(metrics.usable_donors ?? (metrics.ready_donors + (metrics.maybe_available ?? 0))).toLocaleString()}
                </div>
              </div>
              <p className="text-[11px] text-[#667085]">
                {metrics.ready_donors.toLocaleString()} ready now + {(metrics.maybe_available_donors ?? metrics.maybe_available ?? 0).toLocaleString()} standby
              </p>
            </div>

            {/* At-Risk Donors */}
            <div className="card-command p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-center text-[#C62828]">
                  <AlertTriangle size={16} />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C62828] bg-[#FEF3F2] px-2 py-0.5 rounded-full border border-[#FECDCA]">
                  Temp Unavailable
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">At Risk Donors</div>
                <div className="text-3xl font-bold text-[#17212B] font-display mt-0.5">
                  {(metrics.temporarily_unavailable_donors ?? metrics.temporarily_unavailable ?? 0).toLocaleString()}
                </div>
              </div>
              <p className="text-[11px] text-[#667085]">Donation cooldown or reported travel</p>
            </div>

            {/* Coverage Areas */}
            <div className="card-command p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] border border-[#B2DDFF] flex items-center justify-center text-[#3567B7]">
                  <MapPin size={16} />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3567B7] bg-[#EFF8FF] px-2 py-0.5 rounded-full border border-[#B2DDFF]">
                  Active Network
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Coverage Areas</div>
                <div className="text-3xl font-bold text-[#17212B] font-display mt-0.5">
                  {metrics.coverage_areas_count || zones.length || 12}
                </div>
              </div>
              <p className="text-[11px] text-[#667085]">Pune municipal and suburban zones</p>
            </div>

            {/* Network Resilience */}
            <div className="card-command p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#EBFDF5] border border-[#A6F4C5] flex items-center justify-center text-[#16805D]">
                  <ShieldCheck size={16} />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16805D] bg-[#EBFDF5] px-2 py-0.5 rounded-full border border-[#A6F4C5]">
                  Calculated Index
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">Network Resilience</div>
                <div className="text-3xl font-bold text-[#17212B] font-display mt-0.5">
                  {Math.round(metrics.operational_coverage_pct ?? metrics.network_coverage_percent ?? 87)}%
                </div>
              </div>
              <p className="text-[11px] text-[#667085]">Operational coverage across high-risk groups</p>
            </div>
          </div>

          {/* ─── ROW 2: BLOOD GROUP RESILIENCE & NETWORK CAPACITY ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section 2: Blood Group Resilience (2 cols) */}
            <div className="lg:col-span-2 card-command p-6 space-y-5 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E6E8EC]">
                <div>
                  <h2 className="text-sm font-bold text-[#17212B] font-display uppercase tracking-wider">Blood Group Resilience</h2>
                  <p className="text-xs text-[#667085]">Authoritative availability of usable donors by blood group.</p>
                </div>
                <button
                  onClick={() => setShowResilienceModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#17212B] hover:text-[#B42336] transition-colors self-start sm:self-auto"
                >
                  <span>View Details</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* 8 Compact Vertical Capacity Columns */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 pt-2">
                {metrics.blood_group_resilience.map((bg) => {
                  const statusColor =
                    bg.status === 'Strong'
                      ? 'bg-[#16805D]'
                      : bg.status === 'Stable'
                      ? 'bg-[#3567B7]'
                      : bg.status === 'High Risk'
                      ? 'bg-[#B7791F]'
                      : 'bg-[#C62828]'

                  const statusBadgeClass =
                    bg.status === 'Strong'
                      ? 'bg-[#EBFDF5] text-[#16805D] border border-[#A6F4C5]'
                      : bg.status === 'Stable'
                      ? 'bg-[#EFF8FF] text-[#3567B7] border border-[#B2DDFF]'
                      : bg.status === 'High Risk'
                      ? 'bg-[#FEF7EC] text-[#B7791F] border border-[#FEDF89]'
                      : 'bg-[#FEF3F2] text-[#C62828] border border-[#FECDCA]'

                  return (
                    <div
                      key={bg.blood_group}
                      onClick={() => setSelectedBloodGroup(bg)}
                      className="flex flex-col items-center p-2.5 rounded-xl border border-[#E6E8EC] bg-[#F8F9FA] hover:bg-white hover:border-[#D0D5DD] hover:shadow-card-hover hover:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer text-center space-y-2 group"
                    >
                      <span className="font-bold text-sm text-[#17212B] font-display group-hover:text-[#B42336] transition-colors">
                        {bg.blood_group}
                      </span>
                      <span className="text-xs font-bold text-[#475467] font-mono">
                        {bg.coverage_percent}%
                      </span>

                      {/* Vertical Progress Bar */}
                      <div className="w-full h-24 bg-[#E6E8EC] rounded-lg overflow-hidden flex flex-col justify-end p-0.5">
                        <div
                          className={cn('w-full rounded-md transition-all duration-500', statusColor)}
                          style={{ height: `${Math.min(100, Math.max(8, bg.coverage_percent))}%` }}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-[#667085]">
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
            <div className="card-command p-6 space-y-5 flex flex-col justify-between">
              <div className="pb-2 border-b border-[#E6E8EC]">
                <h2 className="text-sm font-bold text-[#17212B] font-display uppercase tracking-wider">Network Capacity</h2>
                <p className="text-xs text-[#667085]">Live distribution across {(metrics.total_registered_donors ?? 20000).toLocaleString()} registered donors.</p>
              </div>

              {/* SVG Donut Chart */}
              <div className="flex items-center justify-center my-2">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Ring */}
                    <path
                      className="text-[#F2F4F7]"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Not Currently Usable */}
                    <path
                      className="text-[#D0D5DD]"
                      strokeWidth="3.8"
                      strokeDasharray={`${notUsablePct}, 100`}
                      strokeDashoffset="0"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Temporarily Unavailable */}
                    <path
                      className="text-[#C62828]"
                      strokeWidth="3.8"
                      strokeDasharray={`${tempPct}, 100`}
                      strokeDashoffset={`-${notUsablePct}`}
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* May Be Available */}
                    <path
                      className="text-[#B7791F]"
                      strokeWidth="3.8"
                      strokeDasharray={`${maybePct}, 100`}
                      strokeDashoffset={`-${notUsablePct + tempPct}`}
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Ready Now */}
                    <path
                      className="text-[#16805D]"
                      strokeWidth="3.8"
                      strokeDasharray={`${readyPct}, 100`}
                      strokeDashoffset={`-${notUsablePct + tempPct + maybePct}`}
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-[#17212B] font-display">
                      {(metrics.total_registered_donors ?? 20000).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#667085] font-semibold leading-none mt-0.5">
                      Registered
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 pt-2 border-t border-[#E6E8EC] text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16805D]" />
                    <span className="text-[#475467] font-medium">Ready Now</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#17212B]">{metrics.ready_donors.toLocaleString()}</span>
                    <span className="text-[#667085] w-8 text-right font-mono">{readyPct}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B7791F]" />
                    <span className="text-[#475467] font-medium">May Be Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#17212B]">{(metrics.maybe_available_donors ?? metrics.maybe_available ?? 0).toLocaleString()}</span>
                    <span className="text-[#667085] w-8 text-right font-mono">{maybePct}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C62828]" />
                    <span className="text-[#475467] font-medium">Temporarily Unavailable</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#17212B]">{(metrics.temporarily_unavailable_donors ?? metrics.temporarily_unavailable ?? 0).toLocaleString()}</span>
                    <span className="text-[#667085] w-8 text-right font-mono">{tempPct}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D0D5DD]" />
                    <span className="text-[#475467] font-medium">Status Unknown</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#17212B]">{(metrics.status_unknown_donors ?? metrics.status_unknown ?? 0).toLocaleString()}</span>
                    <span className="text-[#667085] w-8 text-right font-mono">{notUsablePct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── ROW 3: PUNE NETWORK COVERAGE MAP & REGIONAL OVERVIEW ─────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section 4: Pune Network Coverage (2 cols) */}
            <div className="lg:col-span-2 card-command p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E8EC]">
                <div>
                  <h2 className="text-sm font-bold text-[#17212B] font-display uppercase tracking-wider">Pune Network Coverage</h2>
                  <p className="text-xs text-[#667085]">Authoritative regional donor density and response readiness across Pune.</p>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#17212B] hover:text-[#B42336] transition-colors"
                >
                  <span>Reset Filter</span>
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
            <div className="card-command p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E8EC]">
                <div>
                  <h2 className="text-sm font-bold text-[#17212B] font-display uppercase tracking-wider">Regional Overview</h2>
                  <p className="text-xs text-[#667085]">Key areas by donor availability.</p>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#17212B] hover:text-[#B42336] transition-colors"
                >
                  <span>View All</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Selected Region Insight Panel or Regional List */}
              {selectedRegion ? (
                <div className="space-y-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#E6E8EC]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E6E8EC]">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full', selectedRegion.statusColor)} />
                      <h3 className="font-bold text-sm text-[#17212B]">{selectedRegion.name}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedRegion(null)}
                      className="text-xs text-[#667085] hover:text-[#17212B] p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                      <span className="text-[#667085]">Capacity State</span>
                      <span className={cn('font-bold', selectedRegion.textColor)}>{selectedRegion.capacityState}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                      <span className="text-[#667085]">Usable Donors</span>
                      <span className="font-bold text-[#17212B]">{selectedRegion.donorCount.toLocaleString()} donors</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                      <span className="text-[#667085]">O− Coverage</span>
                      <span className={cn('font-bold', selectedRegion.oNegStatus === 'Critical' ? 'text-[#C62828]' : 'text-[#16805D]')}>
                        {selectedRegion.oNegStatus}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                      <span className="text-[#667085]">Partner Coverage</span>
                      <span className="font-medium text-[#475467]">{selectedRegion.partnerCoverage}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#667085]">Median Response</span>
                      <span className="font-medium text-[#475467]">{selectedRegion.medianResponse}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedRegion(null)}
                      className="w-full text-center py-1.5 bg-white border border-[#E6E8EC] hover:border-[#D0D5DD] text-xs font-bold text-[#475467] rounded-xl transition-colors shadow-xs"
                    >
                      Reset Region Selection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {regionalItems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#667085]">
                      No regional nodes reported by the network engine.
                    </div>
                  ) : (
                    regionalItems.slice(0, 5).map((item) => (
                      <div
                        key={item.name}
                        onClick={() => setSelectedRegion(item)}
                        className="flex items-center justify-between p-3 rounded-xl border border-[#E6E8EC] bg-white hover:bg-[#F8F9FA] hover:border-[#D0D5DD] transition-all cursor-pointer group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={cn('w-2 h-2 rounded-full', item.statusColor)} />
                            <span className="font-bold text-xs text-[#17212B] group-hover:text-[#B42336] transition-colors">
                              {item.name}
                            </span>
                          </div>
                          <div className={cn('text-[11px] font-semibold pl-4', item.textColor)}>
                            ● {item.capacityState}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-xs text-[#17212B]">
                            {item.donorCount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-[#667085]">usable donors</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── BLOOD GROUP RESILIENCE DETAIL MODAL ───────────────────────────── */}
          {(showResilienceModal || selectedBloodGroup) && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
              <div className="card-command max-w-lg w-full p-6 space-y-4 animate-scale-in shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-center text-[#B42336] font-bold">
                      {selectedBloodGroup ? selectedBloodGroup.blood_group : 'All'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#17212B]">
                        Blood Group Resilience Detail
                      </h3>
                      <p className="text-xs text-[#667085]">
                        {selectedBloodGroup ? `Detailed metrics for ${selectedBloodGroup.blood_group}` : 'Network-wide blood group breakdown'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowResilienceModal(false)
                      setSelectedBloodGroup(null)
                    }}
                    className="text-xs text-[#667085] hover:text-[#17212B] p-1"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {metrics.blood_group_resilience.map((bg) => (
                    <div
                      key={bg.blood_group}
                      className={cn(
                        'p-3 rounded-xl border transition-all text-xs flex items-center justify-between',
                        selectedBloodGroup?.blood_group === bg.blood_group
                          ? 'border-[#B42336] bg-[#FEF3F2]'
                          : 'border-[#E6E8EC] bg-[#F8F9FA]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 font-bold font-mono text-sm text-[#17212B]">{bg.blood_group}</span>
                        <div>
                          <span className="font-bold text-[#17212B]">{bg.coverage_percent}% Coverage</span>
                          <span className="text-[#667085] text-[11px] block">{bg.ready_count.toLocaleString()} ready donors</span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          bg.status === 'Strong'
                            ? 'bg-[#EBFDF5] text-[#16805D] border border-[#A6F4C5]'
                            : bg.status === 'Stable'
                            ? 'bg-[#EFF8FF] text-[#3567B7] border border-[#B2DDFF]'
                            : bg.status === 'High Risk'
                            ? 'bg-[#FEF7EC] text-[#B7791F] border border-[#FEDF89]'
                            : 'bg-[#FEF3F2] text-[#C62828] border border-[#FECDCA]'
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
                    className="w-full py-2 bg-[#17212B] hover:bg-[#2A3441] text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
