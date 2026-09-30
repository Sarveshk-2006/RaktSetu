// RAKTSETU — Incidents List Page
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Filter, AlertTriangle } from 'lucide-react'
import { IncidentCard } from '@/components/incidents/IncidentCard'
import { cn } from '@/lib/utils'
import { ALL_INCIDENTS } from '@/data/demoData'

type FilterKey = 'All' | 'Critical' | 'High' | 'Active' | 'Fulfilled'
const FILTERS: FilterKey[] = ['All', 'Critical', 'High', 'Active', 'Fulfilled']

export function IncidentsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All')

  const filtered = ALL_INCIDENTS.filter(inc => {
    switch (activeFilter) {
      case 'All':       return true
      case 'Critical':  return inc.requirement.urgency === 'Critical'
      case 'High':      return inc.requirement.urgency === 'High'
      case 'Active':    return !['Fulfilled', 'Closed'].includes(inc.status)
      case 'Fulfilled': return inc.status === 'Fulfilled'
    }
  })

  return (
    <div className="max-w-[1000px] animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="text-rose-500" size={24} />
            Emergency Incidents
          </h1>
          <p className="text-slate-400 text-xs font-mono mt-1">
            {ALL_INCIDENTS.length} total requisitions · {ALL_INCIDENTS.filter(i => !['Fulfilled','Closed'].includes(i.status)).length} active responses
          </p>
        </div>
        <button
          onClick={() => navigate('/incidents/create')}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#E11D48] hover:bg-rose-700 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
        >
          <Plus size={14} /> Create Blood Incident
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between bg-[#111827] border border-[#1F2937] p-3 rounded-lg font-mono">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400 mr-1" />
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium transition-colors',
                activeFilter === f
                  ? 'bg-rose-950/80 border border-rose-800/60 text-rose-300 font-bold'
                  : 'bg-[#161E2E] border border-[#1F2937] text-slate-400 hover:text-white',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">
          Showing {filtered.length} incidents
        </span>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filtered.map(inc => (
          <IncidentCard key={inc.incident_id} incident={inc} className="animate-fade-in" />
        ))}
      </div>
    </div>
  )
}
