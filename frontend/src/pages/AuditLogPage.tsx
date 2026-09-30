// RAKTSETU — Audit & Traceability Log Page
// Operational immutable audit trail of verification, donor matching, wave dispatches, and handoffs.

import { useState } from 'react'
import { ShieldCheck, Filter, Search, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditEntry {
  id: string
  timestamp: string
  incident_id: string
  actor: string
  action: string
  details: string
  category: 'Verification' | 'Dispatch' | 'Donor Response' | 'Fulfilment' | 'System'
  status: 'SUCCESS' | 'WARNING' | 'INFO'
}

const AUDIT_LOGS: AuditEntry[] = [
  {
    id: 'LOG-9941',
    timestamp: '2026-09-30 22:18:42',
    incident_id: 'INC-PN-48291',
    actor: 'System / Network Engine',
    action: 'INCIDENT_FULFILLED',
    details: '2/2 O- units secured. Response time: 11m 24s. 6 duplicate outreaches avoided.',
    category: 'Fulfilment',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-9940',
    timestamp: '2026-09-30 22:17:10',
    incident_id: 'INC-PN-48291',
    actor: 'Donor D8821',
    action: 'DONOR_RESPONSE_ACCEPTED',
    details: 'Donor D8821 confirmed availability. ETA to Sahyadri Hospital: 14 mins.',
    category: 'Donor Response',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-9938',
    timestamp: '2026-09-30 22:15:30',
    incident_id: 'INC-PN-48291',
    actor: 'System Dispatch Engine',
    action: 'WAVE_2_ACTIVATION',
    details: 'Wave 1 insufficient (1 unit secured). Wave 2 launched contacting 4 additional O- donors.',
    category: 'Dispatch',
    status: 'WARNING',
  },
  {
    id: 'LOG-9935',
    timestamp: '2026-09-30 22:11:02',
    incident_id: 'INC-PN-48291',
    actor: 'Donor D1042',
    action: 'DONOR_RESPONSE_ACCEPTED',
    details: 'Donor D1042 accepted dispatch request (O- · 3.2 km distance).',
    category: 'Donor Response',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-9930',
    timestamp: '2026-09-30 22:10:00',
    incident_id: 'INC-PN-48291',
    actor: 'System Dispatch Engine',
    action: 'WAVE_1_ACTIVATION',
    details: 'Contacted 5 high-confidence O- donors in Wagholi / Hadapsar cohort.',
    category: 'Dispatch',
    status: 'INFO',
  },
  {
    id: 'LOG-9924',
    timestamp: '2026-09-30 22:08:15',
    incident_id: 'INC-PN-48291',
    actor: 'Dr. A. Sharma (Sahyadri Hospital)',
    action: 'REQUIREMENT_VERIFIED',
    details: 'Verified request for 2 units O- PRBC. Patient ID #SH-8841. Urgency: CRITICAL.',
    category: 'Verification',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-9912',
    timestamp: '2026-09-30 21:45:00',
    incident_id: 'INC-PN-48288',
    actor: 'System / Network Engine',
    action: 'INCIDENT_FULFILLED',
    details: '1/1 B- unit delivered to Ruby Hall Clinic. Response time: 07m 12s.',
    category: 'Fulfilment',
    status: 'SUCCESS',
  },
]

export function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const filteredLogs = AUDIT_LOGS.filter(log => {
    const matchesSearch = log.incident_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.actor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-[1200px] animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
        <div>
          <h1 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-[#E11D48]" />
            Audit & Traceability Log
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-0.5">
            Immutable operational ledger tracking verification, donor outreach, progressive waves, and fulfilment.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] px-3 py-1.5 rounded text-xs font-mono text-slate-300">
          <Clock size={13} className="text-emerald-400" />
          <span>LEDGER VERIFIED · SHA-256</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#111827] border border-[#1F2937] p-3 rounded-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-[#0B0F14] border border-[#1F2937] px-3 py-1.5 rounded">
          <Search size={14} className="text-slate-500" />
          <input
            type="text"
            placeholder="Filter by Incident ID, action, or actor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-slate-400 mr-1" />
          {['ALL', 'Verification', 'Dispatch', 'Donor Response', 'Fulfilment', 'System'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors',
                categoryFilter === cat
                  ? 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                  : 'bg-[#161E2E] border border-[#1F2937] text-slate-400 hover:text-white',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B0F14] border-b border-[#1F2937] text-[11px] font-mono uppercase text-slate-400">
            <tr>
              <th className="py-3 px-4 font-semibold">Timestamp</th>
              <th className="py-3 px-4 font-semibold">Incident</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Action</th>
              <th className="py-3 px-4 font-semibold">Actor / Node</th>
              <th className="py-3 px-4 font-semibold">Operational Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937]/50 font-mono">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-[#161E2E]/60 transition-colors">
                <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                <td className="py-3 px-4 text-white font-bold whitespace-nowrap">{log.incident_id}</td>
                <td className="py-3 px-4">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
                    log.category === 'Fulfilment' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                    log.category === 'Dispatch' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' :
                    log.category === 'Verification' ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40' :
                    'bg-slate-800 text-slate-300 border border-slate-700',
                  )}>
                    {log.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-200 font-semibold">{log.action}</td>
                <td className="py-3 px-4 text-slate-400">{log.actor}</td>
                <td className="py-3 px-4 text-slate-300 font-sans text-xs">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
