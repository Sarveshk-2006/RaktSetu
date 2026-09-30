// RAKTSETU — Audit & Traceability Log Workspace Page
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Search, Filter, Download, ChevronRight,
  ChevronLeft, CheckCircle2, Lock, X, ArrowUpRight, User, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditEntry {
  id: string
  timestamp: string
  incident_id: string
  category: 'Verification' | 'Dispatch' | 'Donor Response' | 'Fulfilment' | 'System'
  action: string
  actor: string
  actorType: 'System' | 'Operator' | 'Donor' | 'Hospital'
  details: string
  integrity: 'Verified' | 'Pending' | 'Flagged'
  hash: string
  units_secured?: string
  response_time?: string
}

const AUDIT_DATA: AuditEntry[] = [
  {
    id: 'LOG-9941',
    timestamp: '2026-09-30 22:18:42',
    incident_id: 'INC-PN-48291',
    category: 'Fulfilment',
    action: 'INCIDENT_FULFILLED',
    actor: 'System / Network Engine',
    actorType: 'System',
    details: '2/2 O− units secured. Response time: 11m 24s. 6 duplicate outreaches avoided.',
    integrity: 'Verified',
    hash: '8f4a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
    units_secured: '2/2 O-',
    response_time: '11m 24s'
  },
  {
    id: 'LOG-9940',
    timestamp: '2026-09-30 22:17:10',
    incident_id: 'INC-PN-48291',
    category: 'Donor Response',
    action: 'DONOR_RESPONSE_ACCEPTED',
    actor: 'Donor D8821',
    actorType: 'Donor',
    details: 'Donor D8821 confirmed availability. ETA to Sahyadri Hospital: 14 mins.',
    integrity: 'Verified',
    hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
  },
  {
    id: 'LOG-9938',
    timestamp: '2026-09-30 22:15:30',
    incident_id: 'INC-PN-48291',
    category: 'Dispatch',
    action: 'WAVE_2_ACTIVATION',
    actor: 'System Dispatch Engine',
    actorType: 'System',
    details: 'Wave 1 insufficient (1 unit secured). Wave 2 launched contacting 4 additional O− donors.',
    integrity: 'Verified',
    hash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d'
  },
  {
    id: 'LOG-9935',
    timestamp: '2026-09-30 22:11:02',
    incident_id: 'INC-PN-48291',
    category: 'Donor Response',
    action: 'DONOR_RESPONSE_ACCEPTED',
    actor: 'Donor D1042',
    actorType: 'Donor',
    details: 'Donor D1042 accepted dispatch request (O− · 3.2 km distance).',
    integrity: 'Verified',
    hash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f'
  },
  {
    id: 'LOG-9930',
    timestamp: '2026-09-30 22:10:00',
    incident_id: 'INC-PN-48291',
    category: 'Dispatch',
    action: 'WAVE_1_ACTIVATION',
    actor: 'System Dispatch Engine',
    actorType: 'System',
    details: 'Contacted 5 high-confidence O− donors in Wagholi / Hadapsar cohort.',
    integrity: 'Verified',
    hash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'
  },
  {
    id: 'LOG-9924',
    timestamp: '2026-09-30 22:08:15',
    incident_id: 'INC-PN-48291',
    category: 'Verification',
    action: 'REQUIREMENT_VERIFIED',
    actor: 'Dr. A. Sharma (Sahyadri Hospital)',
    actorType: 'Hospital',
    details: 'Verified request for 2 units O− PRBC. Patient ID #SH-8841. Urgency: CRITICAL.',
    integrity: 'Verified',
    hash: '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d'
  },
  {
    id: 'LOG-9918',
    timestamp: '2026-09-30 21:40:00',
    incident_id: 'INC-PN-48287',
    category: 'Fulfilment',
    action: 'INCIDENT_FULFILLED',
    actor: 'Operator Console (PN-411)',
    actorType: 'Operator',
    details: '3/3 B+ units secured for Ruby Hall Clinic. Emergency resolved.',
    integrity: 'Verified',
    hash: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2'
  },
  {
    id: 'LOG-9912',
    timestamp: '2026-09-30 21:18:00',
    incident_id: 'INC-PN-48279',
    category: 'Verification',
    action: 'REQUIREMENT_VERIFIED',
    actor: 'Deenanath Mangeshkar Hospital',
    actorType: 'Hospital',
    details: 'Requirement registered: 1 unit A+ blood for scheduled procedure.',
    integrity: 'Verified',
    hash: 'd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4'
  },
  {
    id: 'LOG-9905',
    timestamp: '2026-09-30 20:00:00',
    incident_id: 'INC-PN-48265',
    category: 'Fulfilment',
    action: 'INCIDENT_FULFILLED',
    actor: 'System / Network Engine',
    actorType: 'System',
    details: '2/2 AB+ units secured for Sahyadri Hospital Hadapsar. Response time: 11m 24s.',
    integrity: 'Verified',
    hash: 'f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6'
  },
  {
    id: 'LOG-9892',
    timestamp: '2026-09-30 19:30:10',
    incident_id: 'INC-PN-48210',
    category: 'System',
    action: 'PARTNER_SYNC_COMPLETED',
    actor: 'UPAY Pune API Sync',
    actorType: 'System',
    details: 'Synced 150 donor availability updates across Baner and Aundh zones.',
    integrity: 'Verified',
    hash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d'
  }
]

function getCategoryBadge(category: AuditEntry['category']) {
  switch (category) {
    case 'Fulfilment':
      return 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
    case 'Donor Response':
      return 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
    case 'Dispatch':
      return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
    case 'Verification':
      return 'bg-[#F3E8FF] text-[#8B5CF6] border-[#DDD6FE]'
    case 'System':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function AuditLogPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [actorFilter, setActorFilter] = useState('ALL')
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [showToast, setShowToast] = useState(false)

  // Filtered entries
  const filteredLogs = AUDIT_DATA.filter((log) => {
    const matchesSearch =
      log.incident_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter
    const matchesActor = actorFilter === 'ALL' || log.actorType === actorFilter

    return matchesSearch && matchesCategory && matchesActor
  })

  const handleExport = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl border border-gray-800 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#10B981]" />
          <div className="text-xs">
            <span className="font-bold block">Audit Log Exported</span>
            <span className="text-gray-400">CSV ledger copy generated with SHA-256 signatures.</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight flex items-center gap-2.5">
            <ShieldCheck size={24} className="text-[#E11D48]" />
            <span>Audit & Traceability Log</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Track critical actions across the RAKTSETU network with transparent, verifiable records.
          </p>
        </div>

        {/* Verification Card Header Badge */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 shadow-2xs flex items-center gap-3 self-start sm:self-auto">
          <div className="w-8 h-8 rounded-full bg-[#D1FAE5] text-[#10B981] flex items-center justify-center shrink-0">
            <Shield size={16} />
          </div>
          <div>
            <span className="font-bold text-xs text-[#111827] block">Ledger Verified</span>
            <span className="text-[10px] text-[#6B7280]">SHA-256 integrity check passed</span>
          </div>
        </div>
      </div>

      {/* SECTION 1 — Audit Summary KPI Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4B5563]">Total Actions</span>
            <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded">This Month</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">1,842</span>
            <span className="text-[11px] text-[#6B7280]">Log records</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#10B981] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4B5563]">Verified Actions</span>
            <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">23% Total</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">426</span>
            <span className="text-[11px] text-[#059669] font-semibold">100% hash matched</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#8B5CF6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4B5563]">Operator Actions</span>
            <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#F3E8FF] px-1.5 py-0.5 rounded">17% Total</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">312</span>
            <span className="text-[11px] text-[#6B7280]">Human dispatch</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#E11D48] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4B5563]">Critical Actions</span>
            <span className="text-[10px] font-bold text-[#E11D48] bg-[#FFE4E6] px-1.5 py-0.5 rounded">0.4% Total</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">8</span>
            <span className="text-[11px] text-[#E11D48] font-semibold">Emergency escalations</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2 hover:border-[#10B981] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4B5563]">Ledger Integrity</span>
            <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-1.5 py-0.5 rounded">SHA-256</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">100%</span>
            <span className="text-[11px] text-[#059669] font-semibold">Verified chain</span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Search + Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by incident ID, action, actor, or details..."
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

          {/* Filter Dropdowns & Export */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-2 outline-none cursor-pointer hover:border-[#CBD5E1]"
            >
              <option value="ALL">All Categories</option>
              <option value="Verification">Verification</option>
              <option value="Dispatch">Dispatch</option>
              <option value="Donor Response">Donor Response</option>
              <option value="Fulfilment">Fulfilment</option>
              <option value="System">System</option>
            </select>

            {/* Actor Dropdown */}
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-2 outline-none cursor-pointer hover:border-[#CBD5E1]"
            >
              <option value="ALL">All Actors</option>
              <option value="System">System / Engine</option>
              <option value="Operator">Operator Console</option>
              <option value="Hospital">Hospital Medical Lead</option>
              <option value="Donor">Donor Candidate</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E7EB] hover:bg-gray-50 text-xs font-semibold text-[#4B5563] transition-colors"
            >
              <Download size={14} />
              <span>Export Log</span>
            </button>
          </div>
        </div>

        {/* Category Pill Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#F3F4F6] scrollbar-none">
          <span className="text-xs text-[#6B7280] font-semibold shrink-0 flex items-center gap-1">
            <Filter size={12} />
            <span>Category:</span>
          </span>
          {(['ALL', 'Verification', 'Dispatch', 'Donor Response', 'Fulfilment', 'System'] as const).map((cat) => {
            const isActive = categoryFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0',
                  isActive
                    ? 'bg-[#E11D48] text-white shadow-2xs'
                    : 'bg-[#F9FAFB] text-[#4B5563] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* SECTION 3 — Primary Audit Table (Desktop & Mobile Responsive) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#111827] font-display">Verifiable Action Trail</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold">
              {filteredLogs.length} Records Shown
            </span>
          </div>
          <span className="text-xs text-[#6B7280]">Chronological log order</span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-3 py-3">Incident / Ref</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Action Code</th>
                <th className="px-3 py-3">Actor / Node</th>
                <th className="px-4 py-3">Operational Details</th>
                <th className="px-4 py-3 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedEntry(log)}
                  className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3.5 text-[#6B7280] font-mono text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/incidents/${log.incident_id}`)
                      }}
                      className="font-bold font-mono text-[#E11D48] hover:underline flex items-center gap-1"
                    >
                      <span>{log.incident_id}</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </td>
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border', getCategoryBadge(log.category))}>
                      {log.category}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-bold font-mono text-[#111827] text-[11px] whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-3 py-3.5 text-[#4B5563] font-medium whitespace-nowrap flex items-center gap-1.5">
                    <User size={13} className="text-gray-400 shrink-0" />
                    <span>{log.actor}</span>
                  </td>
                  <td className="px-4 py-3.5 text-[#374151] max-w-md">
                    {log.details}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-[#E5E7EB]">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedEntry(log)}
              className="p-4 space-y-2.5 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#6B7280]">{log.timestamp}</span>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border', getCategoryBadge(log.category))}>
                  {log.category}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold font-mono text-sm text-[#E11D48]">{log.incident_id}</span>
                <span className="font-bold font-mono text-xs text-[#111827]">{log.action}</span>
              </div>

              <p className="text-xs text-[#4B5563]">{log.details}</p>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#6B7280] font-medium">Actor: {log.actor}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669]">
                  <CheckCircle2 size={12} /> Verified
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-xs text-[#6B7280] space-y-2">
            <Search size={24} className="mx-auto text-gray-300" />
            <p className="font-semibold text-gray-700">No audit records match your search criteria</p>
            <p>Try clearing filters or broadening search parameters.</p>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div>
            Showing <strong className="text-[#111827]">1–{filteredLogs.length}</strong> of <strong className="text-[#111827]">1,842</strong> actions
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1 rounded-lg bg-[#E11D48] text-white font-bold">1</button>
            <button className="px-3 py-1 rounded-lg border border-[#E5E7EB] hover:bg-white text-[#4B5563] font-semibold">2</button>
            <button className="px-3 py-1 rounded-lg border border-[#E5E7EB] hover:bg-white text-[#4B5563] font-semibold">3</button>
            <span className="px-1 text-gray-400">...</span>
            <button className="px-3 py-1 rounded-lg border border-[#E5E7EB] hover:bg-white text-[#4B5563] font-semibold">185</button>
            <button className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-white text-[#4B5563] hover:text-gray-700">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* AUDIT EVENT DETAIL MODAL */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E5E7EB] shadow-2xl overflow-hidden space-y-4 animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#E11D48]" />
                <h3 className="font-bold font-display text-sm text-[#111827]">Audit Event Record — {selectedEntry.id}</h3>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold font-mono text-sm text-[#111827]">{selectedEntry.action}</span>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border', getCategoryBadge(selectedEntry.category))}>
                    {selectedEntry.category}
                  </span>
                </div>
                <p className="text-[#4B5563]">{selectedEntry.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Timestamp</span>
                  <span className="font-mono font-bold text-[#111827]">{selectedEntry.timestamp}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Incident ID</span>
                  <span className="font-mono font-bold text-[#E11D48]">{selectedEntry.incident_id}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Actor / Node</span>
                  <span className="font-bold text-[#111827]">{selectedEntry.actor}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Verification Integrity</span>
                  <span className="font-bold text-[#10B981] flex items-center gap-1">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E11D48] flex items-center gap-1">
                    <Lock size={13} /> Cryptographic SHA-256 Signature
                  </span>
                  <span className="text-[10px] text-[#059669] font-bold bg-[#D1FAE5] px-1.5 py-0.2 rounded">
                    Chain Intact
                  </span>
                </div>
                <div className="font-mono text-[10px] text-gray-700 bg-white p-2 rounded border border-[#FECDD3] break-all">
                  {selectedEntry.hash}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close Record
              </button>
              <button
                onClick={() => {
                  setSelectedEntry(null)
                  navigate(`/incidents/${selectedEntry.incident_id}`)
                }}
                className="px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>View Incident Context</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
