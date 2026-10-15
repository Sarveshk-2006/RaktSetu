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
    <div className="space-y-5 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-8">
      {/* Overview Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 text-[#D97706] font-semibold text-xs mb-1">
            <Sun size={18} className="text-amber-500 fill-amber-100" />
            <span>Good Evening, Operator</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight">
            RAKTSETU Overview
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Here's the current status of the RAKTSETU network in Pune.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="hidden md:flex flex-col text-right text-xs">
            <span className="font-semibold text-[#111827]">Tue, 30 Sep 2026</span>
            <span className="text-[#6B7280]">11:08 PM IST</span>
          </div>
          <button
            onClick={() => navigate('/incidents/create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>Create Blood Requirement</span>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>Failed to load live overview metrics: {error}</span>
          <button
            onClick={loadData}
            className="flex items-center gap-1 font-semibold text-rose-800 hover:underline ml-4"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* SECTION 1 — 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Incidents */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FFE4E6] flex items-center justify-center text-[#E11D48]">
                <AlertTriangle size={18} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Active Incidents</span>
            </div>
            <div className="w-7 h-7 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E11D48]">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#111827] font-display">
                {loading && !metrics ? '...' : activeIncidents.length}
              </span>
              <span className="text-xs font-semibold text-[#E11D48] bg-[#FFE4E6] px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            {/* Sparkline SVG */}
            <svg className="w-16 h-6 stroke-[#E11D48] fill-none stroke-[2]" viewBox="0 0 60 20">
              <path d="M0 15 Q 15 5, 30 14 T 60 4" />
            </svg>
          </div>
          <p className="text-[11px] text-[#6B7280]">
            {criticalCount} critical require action
          </p>
        </div>

        {/* Card 2: Ready Donors */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#10B981]">
                <Users size={18} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Ready Donors</span>
            </div>
            <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#10B981]">
              <Users size={14} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#111827] font-display">
                {loading && !metrics
                  ? '...'
                  : (metrics?.ready_donors ?? metrics?.usable_donors ?? 4218).toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">
                Ready
              </span>
            </div>
            {/* Sparkline SVG */}
            <svg className="w-16 h-6 stroke-[#10B981] fill-none stroke-[2]" viewBox="0 0 60 20">
              <path d="M0 18 Q 15 12, 30 10 T 60 3" />
            </svg>
          </div>
          <p className="text-[11px] text-[#6B7280]">Verified & available capacity</p>
        </div>

        {/* Card 3: Network Coverage */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                <Network size={18} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Network Coverage</span>
            </div>
            <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
              <Network size={14} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#111827] font-display">
                {loading && !metrics
                  ? '...'
                  : `${Math.round(metrics?.operational_coverage_pct ?? metrics?.network_coverage_percent ?? 87)}%`}
              </span>
              <span className="text-xs font-semibold text-[#2563EB] bg-[#DBEAFE] px-1.5 py-0.5 rounded">
                Grid
              </span>
            </div>
            {/* Sparkline SVG */}
            <svg className="w-16 h-6 stroke-[#2563EB] fill-none stroke-[2]" viewBox="0 0 60 20">
              <path d="M0 16 Q 15 8, 30 12 T 60 5" />
            </svg>
          </div>
          <p className="text-[11px] text-[#6B7280]">Operational district coverage</p>
        </div>

        {/* Card 4: Median Response */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
                <Clock size={18} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Median Response</span>
            </div>
            <div className="w-7 h-7 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-[#D97706]">
              <Clock size={14} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#111827] font-display">
                {metrics?.median_response_minutes ? `${metrics.median_response_minutes.toFixed(1)}m` : '8m 42s'}
              </span>
              <span className="text-xs font-semibold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">
                Avg
              </span>
            </div>
            {/* Sparkline SVG */}
            <svg className="w-16 h-6 stroke-[#D97706] fill-none stroke-[2]" viewBox="0 0 60 20">
              <path d="M0 6 Q 15 14, 30 8 T 60 16" />
            </svg>
          </div>
          <p className="text-[11px] text-[#6B7280]">From request to first response</p>
        </div>
      </div>

      {/* SECTION 2, 3, 4 — Middle 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Network Health Index (Col 4) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-[#111827] font-display">Network Health Index</h3>
              <Info size={14} className="text-[#9CA3AF]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">
                Live
              </span>
              <select
                value={healthRange}
                onChange={(e) => setHealthRange(e.target.value)}
                className="text-[11px] font-medium text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md px-2 py-0.5 outline-none"
              >
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-[#6B7280]">
            Real-time operational health of Pune blood supply network
          </p>

          {/* Semi-circular Radial Donut Gauge */}
          <div className="relative flex flex-col items-center justify-center my-2">
            <svg className="w-48 h-28" viewBox="0 0 100 55">
              {/* Background arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Foreground green arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#10B981"
                strokeWidth="10"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 * (1 - (Math.round(metrics?.operational_coverage_pct ?? metrics?.network_coverage_percent ?? 87) / 100))}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute bottom-2 text-center">
              <span className="text-3xl font-bold font-display text-[#111827] leading-none block">
                {Math.round(metrics?.operational_coverage_pct ?? metrics?.network_coverage_percent ?? 87)}
              </span>
              <span className="text-xs font-semibold text-[#10B981] mt-0.5 block">
                {(metrics?.operational_coverage_pct ?? metrics?.network_coverage_percent ?? 87) >= 75 ? 'Healthy' : 'Needs Attention'}
              </span>
            </div>
          </div>

          {/* 3 Progress Indicators */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#4B5563] font-medium">Supply Stability</span>
                <span className="font-bold text-[#111827]">92%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div className="h-full bg-[#10B981] rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#4B5563] font-medium">Response Efficiency</span>
                <span className="font-bold text-[#111827]">84%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div className="h-full bg-[#2563EB] rounded-full" style={{ width: '84%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#4B5563] font-medium">Transit Fluidity</span>
                <span className="font-bold text-[#111827]">78%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Supply vs Demand Trend (Col 4) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827] font-display">Supply vs Demand Trend</h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-[11px] font-medium text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md px-2 py-0.5 outline-none"
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
              <span className="text-[#4B5563] font-medium">Units Supplied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FDA4AF]" />
              <span className="text-[#4B5563] font-medium">Units Requested</span>
            </div>
          </div>

          <div className="h-[210px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SUPPLY_DEMAND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} domain={[0, 80]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', color: '#FFF', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="supplied" fill="#E11D48" radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="requested" fill="#FDA4AF" radius={[3, 3, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Blood Group Resilience (Col 4) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827] font-display">Blood Group Resilience</h3>
            <button
              onClick={() => navigate('/intelligence')}
              className="text-xs font-semibold text-[#E11D48] hover:underline flex items-center gap-0.5"
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
                    ? 'bg-[#FFF1F2] border-[#FECDD3]'
                    : bg.color === 'orange'
                    ? 'bg-[#FFFBEB] border-[#FDE68A]'
                    : 'bg-[#F9FAFB] border-[#E5E7EB]'
                )}
              >
                <div className="font-bold text-sm text-[#111827]">{bg.group}</div>
                <div className="text-[11px] font-semibold text-[#6B7280]">{bg.percent}%</div>
                <div className="h-1 rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      bg.color === 'red' ? 'bg-[#E11D48]' : bg.color === 'orange' ? 'bg-[#D97706]' : 'bg-[#10B981]'
                    )}
                    style={{ width: `${bg.percent}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'inline-block px-1 py-0.2 text-[9px] font-bold rounded uppercase',
                    bg.color === 'red'
                      ? 'bg-[#FFE4E6] text-[#E11D48]'
                      : bg.color === 'orange'
                      ? 'bg-[#FEF3C7] text-[#D97706]'
                      : 'bg-[#D1FAE5] text-[#059669]'
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
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827] font-display">Active Blood Requirements</h3>
              <p className="text-xs text-[#6B7280]">Live and recent incident requests across Pune network</p>
            </div>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs font-semibold text-[#E11D48] hover:underline flex items-center gap-0.5"
            >
              <span>View all ({activeIncidents.length})</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {activeIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B7280] space-y-2 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                <p className="font-semibold text-gray-700">No active incidents</p>
                <p>All blood requirements have been fulfilled or resolved.</p>
              </div>
            ) : (
              activeIncidents.slice(0, 3).map((req, idx) => (
                <div
                  key={req.incident_id}
                  onClick={() => navigate(`/incidents/${req.incident_id}`)}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 hover:shadow-xs',
                    idx === 0
                      ? 'bg-[#FFF1F2]/60 border-[#FECDD3] border-l-4 border-l-[#E11D48]'
                      : 'bg-[#F9FAFB] border-[#E5E7EB] hover:bg-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center border shadow-2xs shrink-0',
                        req.urgency?.toLowerCase() === 'critical'
                          ? 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]'
                          : req.urgency?.toLowerCase() === 'high'
                          ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                          : 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                      )}
                    >
                      {req.blood_group}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#111827] font-mono">{req.incident_id}</span>
                        <span className="text-xs font-semibold text-[#374151]">
                          {req.units_requested} {req.units_requested === 1 ? 'unit' : 'units'} required
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold',
                            req.urgency?.toLowerCase() === 'critical'
                              ? 'bg-[#FFE4E6] text-[#E11D48]'
                              : req.urgency?.toLowerCase() === 'high'
                              ? 'bg-[#FEF3C7] text-[#D97706]'
                              : 'bg-[#EFF6FF] text-[#2563EB]'
                          )}
                        >
                          {req.urgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#9CA3AF]" />
                        {req.zone || 'Pune'} · {req.requesting_facility}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-[#6B7280]">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <ChevronRight size={16} className="text-[#9CA3AF]" />
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
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827] font-display">Recent Activity</h3>
              <p className="text-xs text-[#6B7280]">Live operational updates from audit trail</p>
            </div>
            <button
              onClick={() => navigate('/audit')}
              className="text-xs font-semibold text-[#E11D48] hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {auditEvents.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6B7280]">
                No recent activity logged.
              </div>
            ) : (
              auditEvents.slice(0, 5).map((act, i) => {
                const isPositive = act.action?.includes('verify') || act.action?.includes('fulfill') || act.action?.includes('accept')
                const isWave = act.action?.includes('wave')
                const IconComponent = isPositive ? CheckCircle2 : isWave ? Zap : UserCheck

                return (
                  <div key={act.event_id || i} className="flex items-center justify-between text-xs py-1.5 border-b border-[#F3F4F6] last:border-none">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#9CA3AF] text-[11px] w-12">
                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                        isPositive ? 'text-[#10B981] bg-[#ECFDF5]' : isWave ? 'text-[#E11D48] bg-[#FFE4E6]' : 'text-[#2563EB] bg-[#EFF6FF]'
                      )}>
                        <IconComponent size={13} />
                      </div>
                      <span className="font-medium text-[#111827]">
                        {act.action?.replace(/_/g, ' ').toUpperCase()}: {act.entity_id || act.entity_type}
                      </span>
                    </div>
                    <span className="text-[#6B7280] text-[11px] text-right font-medium">
                      {act.actor_id ? `By ${act.actor_id}` : act.details?.notes || 'Operational Event'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Card 2: System Alerts & Insights (Col 6) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827] font-display">System Alerts & Insights</h3>
              <p className="text-xs text-[#6B7280]">Key network observability and recommendations</p>
            </div>
            <button
              onClick={() => navigate('/intelligence')}
              className="text-xs font-semibold text-[#E11D48] hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Critical Capacity Gap */}
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] space-y-2">
              <div className="flex items-center gap-2 text-[#E11D48]">
                <AlertTriangle size={15} />
                <span className="font-bold text-xs">Critical Capacity Gap</span>
              </div>
              <p className="text-[11px] text-[#4B5563] leading-snug">
                O- supply low in Wagholi region. 11 ready donors within 5km.
              </p>
            </div>

            {/* Card 2: Rising Demand Trend */}
            <div className="p-3.5 rounded-xl bg-[#FEF3C7]/60 border border-[#FDE68A] space-y-2">
              <div className="flex items-center gap-2 text-[#D97706]">
                <AlertTriangle size={15} />
                <span className="font-bold text-xs">Rising Demand Trend</span>
              </div>
              <p className="text-[11px] text-[#4B5563] leading-snug">
                2x increase in requests in last 24 hours.
              </p>
            </div>

            {/* Card 3: Re-engagement Opportunity */}
            <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
              <div className="flex items-center gap-2 text-[#2563EB]">
                <Info size={15} />
                <span className="font-bold text-xs">Re-engagement Opportunity</span>
              </div>
              <p className="text-[11px] text-[#4B5563] leading-snug">
                15 inactive donors in Baner can be re-engaged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

