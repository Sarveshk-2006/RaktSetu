// RAKTSETU — Complete Emergency Incidents Page Redesign (Reference-Driven)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Plus, Filter, ChevronRight, Clock, MapPin,
  Building2, Users, CheckCircle2, ShieldAlert, Activity
} from 'lucide-react'

import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts'
import { PuneNetworkMap } from '@/components/overview/PuneNetworkMap'
import { cn } from '@/lib/utils'

// Filter Types
type FilterKey = 'All' | 'Critical' | 'High' | 'Active' | 'Fulfilled'

// Incidents dataset matching reference image
const INCIDENTS_DATA = [
  {
    id: 'INC-PN-48291',
    group: 'O-',
    groupBg: 'bg-[#E11D48] text-white',
    leftBorder: 'border-l-[#E11D48]',
    urgency: 'Critical',
    urgencyBadge: 'bg-[#FFE4E6] text-[#E11D48]',
    status: 'Mobilising',
    statusBadge: 'bg-[#FEF3C7] text-[#D97706]',
    title: '2 UNITS PACKED RBC',
    subtitle: 'Whole Blood / Washed',
    hospital: 'Sahyadri Hospital, Hadapsar',
    location: 'Wagholi, Pune',
    timeAgo: '08m 42s ago',
    securedCount: 1,
    requiredCount: 2,
    securedPercent: 50,
    securedBarColor: 'bg-[#E11D48]',
    securedBg: 'bg-[#FFF1F2]',
    waves: [
      { name: 'Wave 1', detail: '5 donors contacted', status: 'done', dotColor: 'bg-[#E11D48]' },
      { name: 'Wave 2', detail: '2 responses', status: 'active', dotColor: 'bg-[#F59E0B]' },
      { name: 'Wave 3', detail: 'Pending', status: 'pending', dotColor: 'bg-[#E11D48]' },
    ],
  },
  {
    id: 'INC-PN-48287',
    group: 'B+',
    groupBg: 'bg-[#F59E0B] text-white',
    leftBorder: 'border-l-[#F59E0B]',
    urgency: 'High',
    urgencyBadge: 'bg-[#FEF3C7] text-[#D97706]',
    status: 'Mobilising',
    statusBadge: 'bg-[#FEF3C7] text-[#D97706]',
    title: '3 UNITS WHOLE BLOOD',
    subtitle: '',
    hospital: 'Ruby Hall Clinic, Kothrud',
    location: 'Kothrud, Pune',
    timeAgo: '45m 00s ago',
    securedCount: 1,
    requiredCount: 3,
    securedPercent: 33,
    securedBarColor: 'bg-[#F59E0B]',
    securedBg: 'bg-[#FFFBEB]',
    waves: [
      { name: 'Wave 1', detail: '8 donors contacted', status: 'done', dotColor: 'bg-[#F59E0B]' },
      { name: 'Wave 2', detail: '4 responses', status: 'active', dotColor: 'bg-[#F59E0B]' },
      { name: 'Wave 3', detail: 'Pending', status: 'pending', dotColor: 'bg-[#E11D48]' },
    ],
  },
  {
    id: 'INC-PN-48279',
    group: 'A+',
    groupBg: 'bg-[#2563EB] text-white',
    leftBorder: 'border-l-[#2563EB]',
    urgency: 'Moderate',
    urgencyBadge: 'bg-[#EFF6FF] text-[#2563EB]',
    status: 'Matching',
    statusBadge: 'bg-[#FEF3C7] text-[#D97706]',
    title: '1 UNIT SINGLE DONOR PLATELETS',
    subtitle: '',
    hospital: 'Deenanath Mangeshkar Hospital',
    location: 'Baner, Pune',
    timeAgo: '20m 00s ago',
    securedCount: 0,
    requiredCount: 1,
    securedPercent: 0,
    securedBarColor: 'bg-[#2563EB]',
    securedBg: 'bg-[#EFF6FF]',
    waves: [
      { name: 'Wave 1', detail: '6 donors contacted', status: 'done', dotColor: 'bg-[#2563EB]' },
      { name: 'Wave 2', detail: '1 response', status: 'active', dotColor: 'bg-[#2563EB]' },
      { name: 'Wave 3', detail: 'Pending', status: 'pending', dotColor: 'bg-[#10B981]' },
    ],
  },
  {
    id: 'INC-PN-48265',
    group: 'AB+',
    groupBg: 'bg-[#10B981] text-white',
    leftBorder: 'border-l-[#10B981]',
    urgency: 'High',
    urgencyBadge: 'bg-[#FEF3C7] text-[#D97706]',
    status: 'Fulfilled',
    statusBadge: 'bg-[#D1FAE5] text-[#059669]',
    title: '2 UNITS PLASMA (FFP)',
    subtitle: '',
    hospital: 'Sahyadri Hospital',
    location: 'Hadapsar, Pune',
    timeAgo: '2h 12m ago',
    securedCount: 2,
    requiredCount: 2,
    securedPercent: 100,
    securedBarColor: 'bg-[#10B981]',
    securedBg: 'bg-[#ECFDF5]',
    waves: [
      { name: 'Wave 1', detail: '10 donors contacted', status: 'done', dotColor: 'bg-[#10B981]' },
      { name: 'Wave 2', detail: '6 responses', status: 'done', dotColor: 'bg-[#10B981]' },
      { name: 'Wave 3', detail: 'Completed', status: 'done', dotColor: 'bg-[#10B981]' },
    ],
  },
]

// Status Donut Chart Data
const STATUS_CHART_DATA = [
  { name: 'Critical', value: 2, color: '#E11D48', percent: '50%' },
  { name: 'High', value: 1, color: '#F59E0B', percent: '25%' },
  { name: 'Moderate', value: 1, color: '#2563EB', percent: '25%' },
  { name: 'Fulfilled', value: 0, color: '#10B981', percent: '0%' },
]

// Timeline Bar Chart Data
const TIMELINE_DATA = [
  { time: '2h', count: 12 },
  { time: '4h', count: 6 },
  { time: '6h', count: 15 },
  { time: '8h', count: 8 },
  { time: '10h', count: 10 },
  { time: '12h', count: 4 },
  { time: '14h', count: 2 },
  { time: '16h', count: 11 },
  { time: '18h', count: 5 },
  { time: '20h', count: 8 },
  { time: '22h', count: 3 },
  { time: '24h', count: 7 },
]

export function IncidentsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All')
  const [sortBy, setSortBy] = useState('Urgency')

  // Filter Logic
  const filteredIncidents = INCIDENTS_DATA.filter((inc) => {
    switch (activeFilter) {
      case 'All': return true
      case 'Critical': return inc.urgency === 'Critical'
      case 'High': return inc.urgency === 'High'
      case 'Active': return inc.status !== 'Fulfilled'
      case 'Fulfilled': return inc.status === 'Fulfilled'
      default: return true
    }
  })

  return (
    <div className="space-y-5 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 text-[#E11D48] font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-[#FFE4E6] flex items-center justify-center text-[#E11D48]">
              <AlertTriangle size={18} />
            </div>
            <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight">
              Emergency Incidents
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1 pl-10">
            Real-time blood requirements, verification status and response coordination.
          </p>
        </div>

        <button
          onClick={() => navigate('/incidents/create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create Blood Incident</span>
        </button>
      </div>

      {/* SECTION 1 — 5 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Incidents */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#FFE4E6] flex items-center justify-center text-[#E11D48]">
                <AlertTriangle size={15} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Total Incidents</span>
            </div>
            <Activity size={15} className="text-[#E11D48]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-[#111827]">4</span>
            <span className="text-[11px] font-semibold text-[#059669] flex items-center gap-0.5">
              ↑ 2 new today
            </span>
          </div>
        </div>

        {/* Card 2: Critical */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#FFE4E6] flex items-center justify-center text-[#E11D48]">
                <ShieldAlert size={15} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Critical</span>
            </div>
            <ChevronRight size={15} className="text-[#9CA3AF]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-[#111827]">2</span>
          </div>
          <p className="text-[11px] text-[#6B7280]">Requires immediate action</p>
        </div>

        {/* Card 3: High Priority */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
                <Users size={15} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">High Priority</span>
            </div>
            <ChevronRight size={15} className="text-[#9CA3AF]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-[#111827]">1</span>
          </div>
          <p className="text-[11px] text-[#6B7280]">Under mobilisation</p>
        </div>

        {/* Card 4: Active Responses */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                <Users size={15} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Active Responses</span>
            </div>
            <ChevronRight size={15} className="text-[#9CA3AF]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-[#111827]">3</span>
          </div>
          <p className="text-[11px] text-[#6B7280]">Donor cohorts active</p>
        </div>

        {/* Card 5: Fulfilled Today */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#10B981]">
                <CheckCircle2 size={15} />
              </div>
              <span className="text-xs font-semibold text-[#4B5563]">Fulfilled Today</span>
            </div>
            <ChevronRight size={15} className="text-[#9CA3AF]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-[#111827]">12</span>
          </div>
          <p className="text-[11px] text-[#6B7280]">Units delivered</p>
        </div>
      </div>

      {/* SECTION 2 — Filter & Sort Control Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="p-1.5 text-[#6B7280] shrink-0">
            <Filter size={15} />
          </div>
          {(['All', 'Critical', 'High', 'Active', 'Fulfilled'] as FilterKey[]).map((f) => {
            const count = f === 'All' ? 4 : f === 'Critical' ? 2 : f === 'High' ? 1 : f === 'Active' ? 3 : 0
            const isActive = activeFilter === f
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5',
                  isActive
                    ? 'bg-[#E11D48] text-white shadow-2xs'
                    : 'bg-[#F9FAFB] text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
                )}
              >
                <span>{f}</span>
                <span className={cn('px-1.5 py-0.2 rounded-full text-[10px]', isActive ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#6B7280]')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5E7EB]">
          <span className="text-xs text-[#6B7280] font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold text-[#111827] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            <option>Urgency</option>
            <option>Time Created</option>
            <option>Units Secured</option>
          </select>
        </div>
      </div>

      {/* SECTION 3 — 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Rich Operational Incident Cards (Col 7 / ~65%) */}
        <div className="lg:col-span-7 space-y-4">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className={cn(
                'bg-white rounded-xl border border-[#E5E7EB] border-l-4 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3.5 relative overflow-hidden',
                inc.leftBorder
              )}
            >
              {/* Top Row: Group Badge + Incident Meta + Secured Pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Large Blood Group Badge */}
                  <div className={cn('w-11 h-11 rounded-full flex items-center justify-center text-base font-bold font-display shadow-xs shrink-0', inc.groupBg)}>
                    {inc.group}
                  </div>

                  {/* Main Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold font-mono text-[#111827]">{inc.id}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', inc.urgencyBadge)}>
                        {inc.urgency}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', inc.statusBadge)}>
                        {inc.status}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h3 className="text-sm font-bold text-[#111827] uppercase font-display tracking-tight">
                        {inc.title}
                      </h3>
                      {inc.subtitle && (
                        <span className="text-xs text-[#6B7280] font-normal">{inc.subtitle}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#6B7280] flex-wrap pt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Building2 size={13} className="text-[#9CA3AF]" />
                        {inc.hospital}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin size={13} className="text-[#9CA3AF]" />
                        {inc.location}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-[#9CA3AF]">
                        <Clock size={12} />
                        {inc.timeAgo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Units Secured Pill */}
                <div className={cn('p-3 rounded-xl border border-[#E5E7EB] shrink-0 text-right min-w-[130px] flex items-center justify-between gap-3', inc.securedBg)}>
                  <div>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-base font-bold text-[#111827] font-display">
                        {inc.securedCount} / {inc.requiredCount}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#6B7280] block">Units secured</span>
                    <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden mt-1.5">
                      <div className={cn('h-full rounded-full', inc.securedBarColor)} style={{ width: `${inc.securedPercent}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#9CA3AF]" />
                </div>
              </div>

              {/* Bottom Row: Response Progression Cascade */}
              <div className="pt-3 border-t border-[#F3F4F6] flex items-center gap-4 sm:gap-6 text-xs overflow-x-auto">
                {inc.waves.map((w, idx) => (
                  <div key={idx} className="flex items-center gap-2 shrink-0">
                    <span className={cn('w-2 h-2 rounded-full', w.dotColor)} />
                    <span className="font-bold text-[#111827]">{w.name}</span>
                    <span className="text-[11px] text-[#6B7280] font-medium">{w.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Geographic & Analytical Intelligence (Col 5 / ~35%) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Pune Network Overview Map */}
          <PuneNetworkMap />

          {/* Card 2: Analytics Row (2 Mini Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Donut Chart: Incidents by Status */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-[#111827] font-display">Incidents by Status</h4>

              <div className="flex items-center gap-3">
                <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={STATUS_CHART_DATA}
                        innerRadius={28}
                        outerRadius={40}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {STATUS_CHART_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-base font-bold font-display text-[#111827] leading-none">4</span>
                    <span className="text-[9px] font-semibold text-[#6B7280]">Total</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-full bg-[#E11D48]" /> 2 Critical <span className="text-[#9CA3AF]">50%</span></div>
                  <div className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> 1 High <span className="text-[#9CA3AF]">25%</span></div>
                  <div className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-full bg-[#2563EB]" /> 1 Moderate <span className="text-[#9CA3AF]">25%</span></div>
                  <div className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> 0 Fulfilled <span className="text-[#9CA3AF]">0%</span></div>
                </div>
              </div>
            </div>

            {/* Bar Chart: Response Timeline */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-[#111827] font-display">Response Timeline</h4>

              <div className="h-[90px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TIMELINE_DATA} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="time" tick={{ fill: '#9CA3AF', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', color: '#FFF', borderRadius: '6px', fontSize: '10px' }} />
                    <Bar dataKey="count" fill="#E11D48" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card 3: Critical Alerts */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-[#E11D48]" />
                <h4 className="text-xs font-bold text-[#111827] font-display">Critical Alerts</h4>
              </div>
              <button
                onClick={() => navigate('/intelligence')}
                className="text-[11px] font-semibold text-[#E11D48] hover:underline flex items-center gap-0.5"
              >
                <span>View All Alerts</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#E11D48] flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    <span>O− capacity gap in Wagholi</span>
                  </div>
                  <p className="text-[11px] text-[#4B5563]">Only 11 verified donors within 5km radius</p>
                </div>
                <span className="text-[10px] font-mono text-[#9CA3AF] shrink-0">8m ago</span>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#E11D48] flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    <span>AB− low availability in Hadapsar</span>
                  </div>
                  <p className="text-[11px] text-[#4B5563]">Less than 5 units in network</p>
                </div>
                <span className="text-[10px] font-mono text-[#9CA3AF] shrink-0">32m ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
