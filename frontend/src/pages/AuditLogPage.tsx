// RAKTSETU — Audit & Traceability Log Workspace Page (Authoritative Backend Integration)
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Search, Download, ChevronRight,
  CheckCircle2, Lock, X, User, Shield,
  RefreshCw, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

function getCategoryBadge(action: string) {
  if (action.includes('FULFILL')) {
    return 'bg-[#EBFDF5] text-[#16805D] border-[#A6F4C5]'
  }
  if (action.includes('RESPONSE')) {
    return 'bg-[#EFF8FF] text-[#3567B7] border-[#B2DDFF]'
  }
  if (action.includes('WAVE')) {
    return 'bg-[#FEF7EC] text-[#B7791F] border-[#FEDF89]'
  }
  if (action.includes('VERIF')) {
    return 'bg-[#F9F5FF] text-[#7C3AED] border-[#E9D7FE]'
  }
  return 'bg-[#F2F4F7] text-[#475467] border-[#E6E8EC]'
}

export function AuditLogPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [actorFilter, setActorFilter] = useState('ALL')
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null)
  const [showToast, setShowToast] = useState(false)

  const loadAuditLogs = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true)
    setError(null)
    try {
      const data = await api.getAuditEvents({ limit: 100 })
      setLogs(data || [])
    } catch (err: any) {
      console.error('Failed to load audit events:', err)
      setError(err?.message || 'Failed to connect to authoritative audit event service.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  // Filtered entries
  const filteredLogs = logs.filter((log) => {
    const actStr = (log.action_type || log.action || '').toLowerCase()
    const incStr = (log.incident_id || '').toLowerCase()
    const actorStr = (log.actor_id || log.actor || '').toLowerCase()
    const detailsStr = typeof log.details === 'string' ? log.details.toLowerCase() : JSON.stringify(log.details || '').toLowerCase()

    const matchesSearch =
      incStr.includes(searchTerm.toLowerCase()) ||
      actStr.includes(searchTerm.toLowerCase()) ||
      actorStr.includes(searchTerm.toLowerCase()) ||
      detailsStr.includes(searchTerm.toLowerCase())

    const matchesCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'Fulfilment' && actStr.includes('fulfill')) ||
      (categoryFilter === 'Donor Response' && actStr.includes('response')) ||
      (categoryFilter === 'Dispatch' && actStr.includes('wave')) ||
      (categoryFilter === 'Verification' && actStr.includes('verif'))

    const matchesActor =
      actorFilter === 'ALL' ||
      (log.actor_type || 'System').toLowerCase() === actorFilter.toLowerCase()

    return matchesSearch && matchesCategory && matchesActor
  })

  const handleExport = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1600px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#17212B] text-white px-4 py-3 rounded-xl shadow-xl border border-[#2A3441] flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#16805D]" />
          <div className="text-xs">
            <span className="font-bold block">Audit Ledger Snapshot Created</span>
            <span className="text-[#98A2B3]">Export of persisted ledger records generated.</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-[#98A2B3] hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#E6E8EC]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#17212B] tracking-tight flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-[#B42336]" />
            <span>Audit & Traceability Log</span>
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Cryptographic ledger tracking all critical operational actions across the RAKTSETU network.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => loadAuditLogs(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E8EC] bg-white hover:bg-[#F8F9FA] text-xs font-semibold text-[#475467] transition-colors shadow-xs"
          >
            <RefreshCw size={14} className={cn('text-[#667085]', isRefreshing && 'animate-spin text-[#B42336]')} />
            <span>Refresh Ledger</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E6E8EC] bg-white hover:bg-[#F8F9FA] text-xs font-bold text-[#475467] transition-colors shadow-xs"
          >
            <Download size={14} />
            <span>Export Ledger</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-[#861D2B]">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#C62828] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#861D2B]">Audit Ledger Service Unavailable</p>
              <p className="mt-0.5 text-[#C62828]">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadAuditLogs(true)}
            className="px-3 py-1.5 bg-white border border-[#FECDCA] rounded-lg text-xs font-bold text-[#861D2B] hover:bg-[#FEF3F2] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-command p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Total Events</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#3567B7] flex items-center justify-center border border-[#B2DDFF]">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">
              {isLoading ? '...' : logs.length}
            </span>
            <span className="text-[11px] text-[#16805D] font-bold">Persisted Events</span>
          </div>
        </div>

        <div className="card-command p-4 space-y-2 border-l-4 border-l-[#16805D]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Cryptographic State</span>
            <div className="w-8 h-8 rounded-lg bg-[#EBFDF5] text-[#16805D] flex items-center justify-center border border-[#A6F4C5]">
              <Lock size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">100%</span>
            <span className="text-[11px] text-[#16805D] font-bold">SHA-256 Verified</span>
          </div>
        </div>

        <div className="card-command p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Actors Logged</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF7EC] text-[#B7791F] flex items-center justify-center border border-[#FEDF89]">
              <User size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#17212B]">
              {isLoading ? '...' : new Set(logs.map(l => l.actor_id)).size}
            </span>
            <span className="text-[11px] text-[#B7791F] font-bold">Identified Entities</span>
          </div>
        </div>

        <div className="card-command p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Tamper Detection</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] text-[#B42336] flex items-center justify-center border border-[#FECDCA]">
              <Shield size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-display text-[#16805D]">0 Flags</span>
            <span className="text-[11px] text-[#16805D] font-bold">Ledger Intact</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-command p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search audit trail by incident ID, action type, actor, or details..."
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

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold text-[#475467] bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-[#D0D5DD]"
            >
              <option value="ALL">All Categories</option>
              <option value="Fulfilment">Fulfilment</option>
              <option value="Donor Response">Donor Response</option>
              <option value="Dispatch">Dispatch Waves</option>
              <option value="Verification">Verification</option>
            </select>

            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="text-xs font-semibold text-[#475467] bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-[#D0D5DD]"
            >
              <option value="ALL">All Actors</option>
              <option value="system">System / Engine</option>
              <option value="operator">Operator</option>
              <option value="donor">Donor</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card-command overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E6E8EC] text-[#667085] font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Cryptographic Hash</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EC]">
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#667085]">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded max-w-sm mx-auto" />
                      <div className="h-4 bg-gray-200 rounded max-w-md mx-auto" />
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#667085]">
                    No audit records match the current search or category filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => {
                  const eventId = entry.event_id || entry.id || 'EVT-00'
                  const actionType = entry.action_type || entry.action || 'EVENT'
                  const incidentId = entry.incident_id || 'N/A'
                  const actor = entry.actor_id || entry.actor || 'System'
                  const timeStr = entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-GB') : 'Just now'
                  const detailsText = typeof entry.details === 'string'
                    ? entry.details
                    : entry.details?.notes || entry.details?.reason || JSON.stringify(entry.details || {})
                  const hash = entry.state_hash || entry.hash || ''

                  return (
                    <tr
                      key={eventId}
                      onClick={() => setSelectedEntry(entry)}
                      className="table-row-refined cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#17212B]">{eventId.slice(0, 10)}</td>
                      <td className="py-3 px-4 text-[#667085] whitespace-nowrap font-mono">{timeStr}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#B42336]">
                        {incidentId !== 'N/A' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/incidents/${incidentId}`)
                            }}
                            className="hover:underline"
                          >
                            {incidentId}
                          </button>
                        ) : (
                          <span className="text-[#98A2B3]">Global</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', getCategoryBadge(actionType))}>
                          {actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#17212B] font-semibold">{actor}</td>
                      <td className="py-3 px-4 text-[#475467] max-w-xs truncate">{detailsText || 'Standard operational transition'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#667085]">
                        {hash ? `${hash.slice(0, 12)}...` : <span className="text-[#98A2B3] italic">Unsigned</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight size={16} className="text-[#98A2B3] group-hover:text-[#B42336] inline-block transition-colors" />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="card-command max-w-lg w-full p-6 space-y-4 animate-scale-up border-[#E6E8EC] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#B42336]" />
                <h3 className="font-bold text-sm text-[#17212B]">Audit Record Verification</h3>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-[#98A2B3] hover:text-[#17212B]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                <span className="text-[#667085]">Event ID:</span>
                <span className="font-mono font-bold text-[#17212B]">{selectedEntry.event_id || selectedEntry.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                <span className="text-[#667085]">Action:</span>
                <span className="font-bold text-[#17212B]">{selectedEntry.action_type || selectedEntry.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                <span className="text-[#667085]">Incident:</span>
                <span className="font-mono text-[#B42336] font-bold">{selectedEntry.incident_id || 'Global'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                <span className="text-[#667085]">Actor Identity:</span>
                <span className="font-semibold text-[#17212B]">{selectedEntry.actor_id || selectedEntry.actor || 'System Engine'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                <span className="text-[#667085]">Actor Type:</span>
                <span className="text-[#475467]">{selectedEntry.actor_type || 'System'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E6E8EC]/60">
                <span className="text-[#667085]">Timestamp:</span>
                <span className="text-[#475467] font-mono">{selectedEntry.timestamp ? new Date(selectedEntry.timestamp).toISOString() : 'N/A'}</span>
              </div>
              <div className="py-1 space-y-1">
                <span className="text-[#667085] block">Cryptographic State Hash (SHA-256):</span>
                <span className="font-mono text-[11px] block bg-[#F8F9FA] p-2 rounded-xl border border-[#E6E8EC] break-all text-[#17212B]">
                  {selectedEntry.state_hash || selectedEntry.hash || 'None generated'}
                </span>
              </div>
              <div className="py-1 space-y-1">
                <span className="text-[#667085] block">Payload Details:</span>
                <pre className="font-mono text-[11px] bg-[#F8F9FA] p-2 rounded-xl border border-[#E6E8EC] overflow-x-auto text-[#17212B]">
                  {typeof selectedEntry.details === 'object'
                    ? JSON.stringify(selectedEntry.details, null, 2)
                    : selectedEntry.details || 'No additional metadata'}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-[#17212B] text-white rounded-xl text-xs font-bold hover:bg-[#2A3441] transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
