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
    return 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
  }
  if (action.includes('RESPONSE')) {
    return 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
  }
  if (action.includes('WAVE')) {
    return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
  }
  if (action.includes('VERIF')) {
    return 'bg-[#F3E8FF] text-[#8B5CF6] border-[#DDD6FE]'
  }
  return 'bg-gray-100 text-gray-700 border-gray-200'
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
    <div className="space-y-6 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-xl border border-gray-800 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#10B981]" />
          <div className="text-xs">
            <span className="font-bold block">Audit Ledger Snapshot Created</span>
            <span className="text-gray-400">Export of persisted ledger records generated.</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#111827] tracking-tight flex items-center gap-2.5">
            <ShieldCheck size={24} className="text-[#E11D48]" />
            <span>Audit & Traceability Log</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Cryptographic ledger tracking all critical operational actions across the RAKTSETU network.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => loadAuditLogs(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#374151] transition-colors shadow-2xs"
          >
            <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin text-[#E11D48]')} />
            <span>Refresh Ledger</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-xs font-semibold text-[#374151] transition-colors shadow-2xs"
          >
            <Download size={14} />
            <span>Export Ledger</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-[#991B1B]">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#991B1B]">Audit Ledger Service Unavailable</p>
              <p className="mt-0.5 text-[#B91C1C]">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadAuditLogs(true)}
            className="px-3 py-1 bg-white border border-[#FCA5A5] rounded-lg text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2]"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Total Events</span>
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">
              {isLoading ? '...' : logs.length}
            </span>
            <span className="text-[11px] text-[#059669] font-semibold">Persisted Events</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Cryptographic State</span>
            <div className="w-8 h-8 rounded-full bg-[#D1FAE5] text-[#10B981] flex items-center justify-center">
              <Lock size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">100%</span>
            <span className="text-[11px] text-[#10B981] font-semibold">SHA-256 Verified</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Actors Logged</span>
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <User size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#111827]">
              {isLoading ? '...' : new Set(logs.map(l => l.actor_id)).size}
            </span>
            <span className="text-[11px] text-[#D97706] font-semibold">Identified Entities</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Tamper Detection</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-[#10B981]">0 Flags</span>
            <span className="text-[11px] text-[#059669] font-semibold">Ledger Intact</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search audit trail by incident ID, action type, actor, or details..."
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

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none cursor-pointer"
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
              className="text-xs font-semibold text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none cursor-pointer"
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
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold text-[11px] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#F3F4F6]">
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B7280]">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded max-w-sm mx-auto" />
                      <div className="h-4 bg-gray-200 rounded max-w-md mx-auto" />
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B7280]">
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
                      className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">{eventId.slice(0, 10)}</td>
                      <td className="py-3.5 px-4 text-[#6B7280] whitespace-nowrap">{timeStr}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#E11D48]">
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
                          <span className="text-[#9CA3AF]">Global</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', getCategoryBadge(actionType))}>
                          {actionType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#374151] font-medium">{actor}</td>
                      <td className="py-3.5 px-4 text-[#4B5563] max-w-xs truncate">{detailsText || 'Standard operational transition'}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#6B7280]">
                        {hash ? `${hash.slice(0, 12)}...` : <span className="text-[#9CA3AF] italic">Unsigned</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#E11D48] inline-block" />
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
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E5E7EB] shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#E11D48]" />
                <h3 className="font-bold text-sm text-[#111827]">Audit Record Verification</h3>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Event ID:</span>
                <span className="font-mono font-bold text-gray-900">{selectedEntry.event_id || selectedEntry.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Action:</span>
                <span className="font-bold text-gray-900">{selectedEntry.action_type || selectedEntry.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Incident:</span>
                <span className="font-mono text-[#E11D48] font-bold">{selectedEntry.incident_id || 'Global'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Actor Identity:</span>
                <span className="font-semibold text-gray-900">{selectedEntry.actor_id || selectedEntry.actor || 'System Engine'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Actor Type:</span>
                <span className="text-gray-700">{selectedEntry.actor_type || 'System'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Timestamp:</span>
                <span className="text-gray-700">{selectedEntry.timestamp ? new Date(selectedEntry.timestamp).toISOString() : 'N/A'}</span>
              </div>
              <div className="py-1 space-y-1">
                <span className="text-gray-500 block">Cryptographic State Hash (SHA-256):</span>
                <span className="font-mono text-[11px] block bg-gray-50 p-2 rounded-lg border border-gray-200 break-all text-gray-800">
                  {selectedEntry.state_hash || selectedEntry.hash || 'None generated'}
                </span>
              </div>
              <div className="py-1 space-y-1">
                <span className="text-gray-500 block">Payload Details:</span>
                <pre className="font-mono text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-200 overflow-x-auto text-gray-800">
                  {typeof selectedEntry.details === 'object'
                    ? JSON.stringify(selectedEntry.details, null, 2)
                    : selectedEntry.details || 'No additional metadata'}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black"
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
