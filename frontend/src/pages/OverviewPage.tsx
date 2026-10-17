import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Users, Network, Clock,
  ChevronRight, MapPin, Sun,
  Info, CheckCircle2, UserCheck, Zap,
  Plus, RefreshCw
} from 'lucide-react'

import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from 'recharts'
import { PuneNetworkMap } from '@/components/overview/PuneNetworkMap'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { NetworkMetrics, Incident } from '@/types'

// Baseline supply vs demand trend data for Pune Network
const SUPPLY_DEMAND_DATA = [
  { day: '24 Sep', supplied: 42, requested: 58 },
  { day: '25 Sep', supplied: 35, requested: 62 },
  { day: '26 Sep', supplied: 65, requested: 70 },
  { day: '27 Sep', supplied: 48, requested: 52 },
  { day: '28 Sep', supplied: 55, requested: 45 },
  { day: '29 Sep', supplied: 72, requested: 60 },
  { day: '30 Sep', supplied: 58, requested: 68 },
]

export function OverviewPage() {
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState('Last 7 days')
  const [healthRange, setHealthRange] = useState('Last 24 hours')
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [auditEvents, setAuditEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, inc, aud] = await Promise.all([
        api.getNetworkMetrics().catch((err) => {
          console.warn('Network metrics load error:', err)
          return null
        }),
        api.getIncidents().catch((err) => {
          console.warn('Incidents load error:', err)
          return []
        }),
        api.getAuditEvents({ limit: 6 }).catch((err) => {
          console.warn('Audit events load error:', err)
          return []
        }),
      ])
      if (m) setMetrics(m)
      setIncidents(inc || [])
      setAuditEvents(aud || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load live overview metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Derived metrics
  const activeIncidents = incidents.filter(
    (i) => !['fulfilled', 'closed', 'cancelled'].includes(i.status?.toLowerCase())
  )
  const criticalCount = activeIncidents.filter(
    (i) => i.urgency?.toLowerCase() === 'critical'
  ).length

  // Blood group resilience from backend metrics
  const bloodGroups = metrics?.blood_group_resilience?.length
    ? metrics.blood_group_resilience.map((b) => {
        const pct = Math.round(b.coverage_percent ?? 50)
        let status = b.status?.toUpperCase() || 'STABLE'
        let color = 'green'
        if (pct < 45 || status === 'CRITICAL') {
          color = 'red'
          status = 'CRITICAL'
        } else if (pct < 65 || status === 'HIGH RISK') {
          color = 'orange'
          status = 'HIGH RISK'
        } else if (pct < 85 || status === 'STABLE') {
          color = 'yellow'
          status = 'STABLE'
        } else {
          color = 'green'
          status = 'STRONG'
        }
        return {
          group: b.blood_group,
          percent: pct,
          status,
          color,
        }
      })
    : [
        { group: 'O+', percent: 94, status: 'STRONG', color: 'green' },
        { group: 'A+', percent: 91, status: 'STRONG', color: 'green' },
        { group: 'B+', percent: 89, status: 'STRONG', color: 'green' },
        { group: 'AB+', percent: 78, status: 'STABLE', color: 'yellow' },
        { group: 'O-', percent: 41, status: 'CRITICAL', color: 'red' },
        { group: 'A-', percent: 54, status: 'HIGH RISK', color: 'orange' },
        { group: 'B-', percent: 48, status: 'HIGH RISK', color: 'orange' },
        { group: 'AB-', percent: 29, status: 'CRITICAL', color: 'red' },
      ]

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1600px] mx-auto pb-10">
      {/* Overview Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E6E8EC]">
        <div>
          <div className="flex items-center gap-2 text-[#B7791F] font-semibold text-xs mb-1">
            <Sun size={16} className="text-[#B7791F] fill-[#FEF7EC]" />
            <span>Operational Console · Live Dispatch Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#17212B] tracking-tight">
            Network Command Centre
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Real-time blood requirement coordination, supply resilience & response telemetry for Pune District.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="hidden md:flex flex-col text-right text-xs">
            <span className="font-semibold text-[#17212B]">District Coordination Cell</span>
            <span className="text-[#667085] font-mono text-[11px]">Authorised Active</span>
          </div>
          <button
            onClick={() => navigate('/incidents/create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white text-xs font-semibold shadow-xs transition-all duration-150 active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Create Blood Requirement</span>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="p-3.5 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl text-xs text-[#912020] flex items-center justify-between">
          <span>Failed to load live overview metrics: {error}</span>
          <button
            onClick={loadData}
            className="flex items-center gap-1 font-semibold text-[#861D2B] hover:underline ml-4"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* SECTION 1 — 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Incidents */}
        <div className="card-command p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] flex items-center justify-center text-[#B42336]">
                <AlertTriangle size={17} />
              </div>
              <span className="text-xs font-semibold text-[#667085]">Active Incidents</span>
            </div>
            <span className="text-[11px] font-bold text-[#912020] bg-[#FEF3F2] border border-[#FECDCA] px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#17212B] font-display">
                {loading && !metrics ? '...' : activeIncidents.length}
              </span>
              <span className="text-xs text-[#667085]">requiring action</span>
            </div>
            {/* Sparkline SVG */}
            <svg className="w-16 h-6 stroke-[#B42336] fill-none stroke-[2]" viewBox="0 0 60 20">
              <path d="M0 15 Q 15 5, 30 14 T 60 4" />
            </svg>
          </div>
          <p className="text-[11px] text-[#912020] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B42336]" />
            {criticalCount} critical requisitions active
          </p>
        </div>

        {/* Card 2: Ready Donors */}
        <div className="card-command p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EBFDF5] flex items-center justify-center text-[#16805D]">
                <Users size={17} />
              </div>
              <span className="text-xs font-semibold text-[#667085]">Verified Ready Donors</span>
            </div>
            <span className="text-[11px] font-bold text-[#085D40] bg-[#EBFDF5] border border-[#A6F4C5] px-2 py-0.5 rounded-full">
              Ready
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#17212B] font-display">
                {loading && !metrics
                  ? '...'
                  : (metrics?.ready_donors ?? metrics?.usable_donors ?? 4218).toLocaleString()}
              </span>
              <span className="text-xs text-[#667085]">in Pune</span>
            </div>
            {/* Sparkline SVG */}
            <svg className="w-16 h-6 stroke-[#16805D] fill-none stroke-[2]" viewBox="0 0 60 20">
              <path d="M0 18 Q 15 12, 30 10 T 60 3" />
            </svg>
          </div>
          <p className="text-[11px] text-[#085D40] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16805D]" />
            Available for immediate dispatch
          </p>
        </div>

        {/* Card 3: Network Coverage */}
        <div className="card-command p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EFF4FB] flex items-center justify-center text-[#3567B7]">
                <Network size={17} />
              </div>
              <span className="text-xs font-semibold text-[#667085]">Operational Coverage</span>
            </div>
            <span className="text-[11px] font-bold text-[#234B8E] bg-[#EFF4FB] border border-[#B9D3F8] px-2 py-0.5 rounded-full">
              Grid
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#17212B] font-display">
                {loading && !metrics
                  ? '...'
                  : `${Math.round(metrics?.operational_coverage_pct ?? metrics?.network_coverage_percent ?? 87)}%`}
              </span>
              <span className="text-xs text-[#667085]">district capacity</span>
            </div>
            {/* Sparkline SVG */}
            <svg className="w-16 h-6 stroke-[#3567B7] fill-none stroke-[2]" viewBox="0 0 60 20">
              <path d="M0 16 Q 15 8, 30 12 T 60 5" />
            </svg>
          </div>
          <p className="text-[11px] text-[#667085]">12 active urban & sub-urban clusters</p>
        </div>

        {/* Card 4: Median Response */}
        <div className="card-command p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FEF7EC] flex items-center justify-center text-[#B7791F]">
                <Clock size={17} />
              </div>
              <span className="text-xs font-semibold text-[#667085]">Median Response Time</span>
            </div>
            <span className="text-[11px] font-bold text-[#8D5A0F] bg-[#FEF7EC] border border-[#FDE2B5] px-2 py-0.5 rounded-full">
              Avg
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#17212B] font-display">
                {metrics?.median_response_minutes ? `${metrics.median_response_minutes.toFixed(1)}m` : '8m 42s'}
              </span>
              <span className="text-xs text-[#667085]">first response</span>
            </div>
            {/* Sparkline SVG */}
            <svg className="w-16 h-6 stroke-[#B7791F] fill-none stroke-[2]" viewBox="0 0 60 20">
              <path d="M0 6 Q 15 14, 30 8 T 60 16" />
            </svg>
          </div>
          <p className="text-[11px] text-[#667085]">From wave trigger to donor match</p>
        </div>
      </div>

      {/* SECTION 2, 3, 4 — Middle 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Network Health Index (Col 4) */}
        <div className="lg:col-span-4 card-command p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-[#17212B] font-display">Network Health Index</h3>
              <Info size={14} className="text-[#98A2B3]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#085D40] bg-[#EBFDF5] border border-[#A6F4C5] px-2 py-0.5 rounded-full">
                Active
              </span>
              <select
                value={healthRange}
                onChange={(e) => setHealthRange(e.target.value)}
                className="text-[11px] font-medium text-[#475467] bg-[#F8F9FA] border border-[#E6E8EC] rounded-lg px-2 py-0.5 outline-none focus:border-[#B42336]"
              >
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-[#667085]">
            Composite resilience score across supply, response, and transit telemetry.
          </p>

          {/* Semi-circular Radial Donut Gauge */}
          <div className="relative flex flex-col items-center justify-center my-2">
            <svg className="w-48 h-28" viewBox="0 0 100 55">
              {/* Background arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#F2F4F7"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Foreground arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#16805D"
                strokeWidth="10"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 * (1 - (Math.round(metrics?.operational_coverage_pct ?? metrics?.network_coverage_percent ?? 87) / 100))}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute bottom-2 text-center">
              <span className="text-3xl font-bold font-display text-[#17212B] leading-none block">
                {Math.round(metrics?.operational_coverage_pct ?? metrics?.network_coverage_percent ?? 87)}
              </span>
              <span className="text-xs font-semibold text-[#16805D] mt-0.5 block">
                {(metrics?.operational_coverage_pct ?? metrics?.network_coverage_percent ?? 87) >= 75 ? 'Resilient & Ready' : 'Capacity Deficit'}
              </span>
            </div>
          </div>

          {/* 3 Progress Indicators */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#475467] font-medium">Supply Stability</span>
                <span className="font-bold text-[#17212B]">92%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F2F4F7] overflow-hidden">
                <div className="h-full bg-[#16805D] rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#475467] font-medium">Response Efficiency</span>
                <span className="font-bold text-[#17212B]">84%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F2F4F7] overflow-hidden">
                <div className="h-full bg-[#3567B7] rounded-full" style={{ width: '84%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#475467] font-medium">Transit Fluidity</span>
                <span className="font-bold text-[#17212B]">78%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F2F4F7] overflow-hidden">
                <div className="h-full bg-[#B7791F] rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Supply vs Demand Trend (Col 4) */}
        <div className="lg:col-span-4 card-command p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#17212B] font-display">Supply vs Demand Trend</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-[11px] font-medium text-[#475467] bg-[#F8F9FA] border border-[#E6E8EC] rounded-lg px-2 py-0.5 outline-none focus:border-[#B42336]"
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B42336]" />
              <span className="text-[#475467] font-medium">Supplied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D0D5DD]" />
              <span className="text-[#475467] font-medium">Requested</span>
            </div>
          </div>

          <div className="h-[210px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SUPPLY_DEMAND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#667085', fontSize: 10 }} domain={[0, 80]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#17212B', border: 'none', color: '#FFFFFF', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="supplied" fill="#B42336" radius={[3, 3, 0, 0]} barSize={9} />
                <Bar dataKey="requested" fill="#D0D5DD" radius={[3, 3, 0, 0]} barSize={9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Blood Group Resilience (Col 4) */}
        <div className="lg:col-span-4 card-command p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#17212B] font-display">Blood Group Resilience</h3>
            <button
              onClick={() => navigate('/intelligence')}
              className="text-xs font-semibold text-[#B42336] hover:text-[#861D2B] flex items-center gap-0.5"
            >
              <span>View Details</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {bloodGroups.map((bg) => (
              <div
                key={bg.group}
                className={cn(
                  'p-2 rounded-lg border text-center space-y-1 transition-all',
                  bg.color === 'red'
                    ? 'bg-[#FEF3F2] border-[#FECDCA]'
                    : bg.color === 'orange'
                    ? 'bg-[#FEF7EC] border-[#FDE2B5]'
                    : 'bg-[#F8F9FA] border-[#E6E8EC]'
                )}
              >
                <div className="font-bold text-sm text-[#17212B] font-mono">{bg.group}</div>
                <div className="text-[11px] font-semibold text-[#667085]">{bg.percent}%</div>
                <div className="h-1 rounded-full bg-[#E6E8EC] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      bg.color === 'red' ? 'bg-[#C62828]' : bg.color === 'orange' ? 'bg-[#B7791F]' : 'bg-[#16805D]'
                    )}
                    style={{ width: `${bg.percent}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'inline-block px-1 py-0.2 text-[9px] font-bold rounded uppercase',
                    bg.color === 'red'
                      ? 'bg-[#FEF3F2] text-[#912020]'
                      : bg.color === 'orange'
                      ? 'bg-[#FEF7EC] text-[#8D5A0F]'
                      : 'bg-[#EBFDF5] text-[#085D40]'
                  )}
                >
                  {bg.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5 & 6 — Lower 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Active Blood Requirements (Col 6) */}
        <div className="lg:col-span-6 card-command p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#17212B] font-display">Active Requisitions Queue</h3>
              <p className="text-xs text-[#667085]">Live hospital demand needing coordinator verification or wave dispatch</p>
            </div>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs font-semibold text-[#B42336] hover:text-[#861D2B] flex items-center gap-0.5"
            >
              <span>View all ({activeIncidents.length})</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {activeIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#667085] space-y-2 bg-[#F8F9FA] rounded-xl border border-[#E6E8EC]">
                <CheckCircle2 size={24} className="mx-auto text-[#16805D]" />
                <p className="font-semibold text-[#17212B]">No active requisitions</p>
                <p>All blood requirements have been fulfilled or resolved.</p>
              </div>
            ) : (
              activeIncidents.slice(0, 3).map((req, idx) => (
                <div
                  key={req.incident_id}
                  onClick={() => navigate(`/incidents/${req.incident_id}`)}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 hover:shadow-xs group',
                    idx === 0
                      ? 'bg-[#FDF2F4]/70 border-[#F8D7DC] border-l-4 border-l-[#B42336]'
                      : 'bg-[#F8F9FA] border-[#E6E8EC] hover:bg-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg font-mono font-bold text-sm flex items-center justify-center border shrink-0',
                        req.urgency?.toLowerCase() === 'critical'
                          ? 'bg-[#FEF3F2] text-[#912020] border-[#FECDCA]'
                          : req.urgency?.toLowerCase() === 'high'
                          ? 'bg-[#FEF7EC] text-[#8D5A0F] border-[#FDE2B5]'
                          : 'bg-[#EFF4FB] text-[#234B8E] border-[#B9D3F8]'
                      )}
                    >
                      {req.blood_group}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#17212B] font-mono">{req.incident_id}</span>
                        <span className="text-xs font-semibold text-[#475467]">
                          {req.units_requested} {req.units_requested === 1 ? 'unit' : 'units'} needed
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            req.urgency?.toLowerCase() === 'critical'
                              ? 'bg-[#FEF3F2] text-[#912020] border-[#FECDCA]'
                              : req.urgency?.toLowerCase() === 'high'
                              ? 'bg-[#FEF7EC] text-[#8D5A0F] border-[#FDE2B5]'
                              : 'bg-[#EFF4FB] text-[#234B8E] border-[#B9D3F8]'
                          )}
                        >
                          {req.urgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#667085] flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#98A2B3]" />
                        {req.zone || 'Pune'} · {req.requesting_facility}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-[#667085]">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <ChevronRight size={16} className="text-[#98A2B3] group-hover:text-[#17212B] transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Pune Network Overview Map (Col 6) */}
        <div className="lg:col-span-6">
          <PuneNetworkMap />
        </div>
      </div>

      {/* SECTION 7 & 8 — Bottom 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Recent Activity (Col 6) */}
        <div className="lg:col-span-6 card-command p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#17212B] font-display">Operational Audit Stream</h3>
              <p className="text-xs text-[#667085]">Verified dispatch, verification, and fulfilment lifecycle events</p>
            </div>
            <button
              onClick={() => navigate('/audit')}
              className="text-xs font-semibold text-[#B42336] hover:text-[#861D2B] flex items-center gap-0.5"
            >
              <span>View Audit Log</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            {auditEvents.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085] bg-[#F8F9FA] rounded-xl border border-[#E6E8EC]">
                No recent activity logged in current session.
              </div>
            ) : (
              auditEvents.slice(0, 5).map((act, i) => {
                const isPositive = act.action?.includes('verify') || act.action?.includes('fulfill') || act.action?.includes('accept')
                const isWave = act.action?.includes('wave')
                const IconComponent = isPositive ? CheckCircle2 : isWave ? Zap : UserCheck

                return (
                  <div key={act.event_id || i} className="flex items-center justify-between text-xs py-2 border-b border-[#F2F4F7] last:border-none">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#98A2B3] text-[11px] w-12">
                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center shrink-0 border',
                        isPositive ? 'text-[#085D40] bg-[#EBFDF5] border-[#A6F4C5]' : isWave ? 'text-[#912020] bg-[#FEF3F2] border-[#FECDCA]' : 'text-[#234B8E] bg-[#EFF4FB] border-[#B9D3F8]'
                      )}>
                        <IconComponent size={13} />
                      </div>
                      <span className="font-medium text-[#17212B]">
                        {act.action?.replace(/_/g, ' ').toUpperCase()}: {act.entity_id || act.entity_type}
                      </span>
                    </div>
                    <span className="text-[#667085] text-[11px] text-right font-medium">
                      {act.actor_id ? `By ${act.actor_id}` : act.details?.notes || 'Operational Event'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Card 2: System Alerts & Insights (Col 6) */}
        <div className="lg:col-span-6 card-command p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#17212B] font-display">System Resilience Signals</h3>
              <p className="text-xs text-[#667085]">Network capacity alerts, demand velocity & re-engagement signals</p>
            </div>
            <button
              onClick={() => navigate('/intelligence')}
              className="text-xs font-semibold text-[#B42336] hover:text-[#861D2B] flex items-center gap-0.5"
            >
              <span>Explore Analytics</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Critical Capacity Gap */}
            <div className="p-3.5 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] space-y-2">
              <div className="flex items-center gap-2 text-[#912020]">
                <AlertTriangle size={15} />
                <span className="font-bold text-xs">Capacity Watch</span>
              </div>
              <p className="text-[11px] text-[#475467] leading-snug">
                O- supply low in Wagholi cluster. 11 eligible verified donors within 5km.
              </p>
            </div>

            {/* Card 2: Rising Demand Trend */}
            <div className="p-3.5 rounded-xl bg-[#FEF7EC] border border-[#FDE2B5] space-y-2">
              <div className="flex items-center gap-2 text-[#8D5A0F]">
                <AlertTriangle size={15} />
                <span className="font-bold text-xs">Demand Spike</span>
              </div>
              <p className="text-[11px] text-[#475467] leading-snug">
                B+ requisitions elevated in Pune Central zone over last 24 hours.
              </p>
            </div>

            {/* Card 3: Re-engagement Opportunity */}
            <div className="p-3.5 rounded-xl bg-[#EFF4FB] border border-[#B9D3F8] space-y-2">
              <div className="flex items-center gap-2 text-[#234B8E]">
                <Info size={15} />
                <span className="font-bold text-xs">Donor Availability</span>
              </div>
              <p className="text-[11px] text-[#475467] leading-snug">
                15 inactive donors in Baner cluster ready for re-activation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

