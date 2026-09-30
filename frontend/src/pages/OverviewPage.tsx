// RAKTSETU — Premium Light Overview Page
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Users, Network, Clock,
  ChevronRight, ArrowRight, MapPin
} from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import { BloodGroupBadge } from '@/components/ui/BloodGroupBadge'
import { IncidentCard } from '@/components/incidents/IncidentCard'
import { cn } from '@/lib/utils'
import { ALL_INCIDENTS, NETWORK_METRICS } from '@/data/demoData'

export function OverviewPage() {
  const navigate = useNavigate()
  const metrics = NETWORK_METRICS
  const activeIncidents = ALL_INCIDENTS.filter(i => !['Fulfilled', 'Closed'].includes(i.status))

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#17202A]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E7EC]">
        <div>
          <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider block mb-0.5">
            Good evening
          </span>
          <h1 className="text-2xl font-bold font-display text-[#17202A] tracking-tight">
            RAKTSETU Overview
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Monitor active requirements, donor availability and network readiness.
          </p>
        </div>
        <button
          onClick={() => navigate('/incidents/create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          + Create Blood Requirement
        </button>
      </div>

      {/* Balanced Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Incidents"
          value="4"
          icon={AlertTriangle}
          accent="red"
          trend="2 critical requires action"
        />
        <KpiCard
          label="Ready Donors"
          value="4,218"
          icon={Users}
          accent="green"
          trend="↑ 143 verified donors"
          trendUp
        />
        <KpiCard
          label="Network Coverage"
          value="87%"
          icon={Network}
          accent="blue"
          trend="3 critical geographic gaps"
        />
        <KpiCard
          label="Median Response"
          value="8m 42s"
          icon={Clock}
          accent="amber"
          trend="↓ 1m 18s response time"
          trendUp
        />
      </div>

      {/* Main 2-Column Overview Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN — Active Response (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#17202A] font-display">
              Active blood requirements
            </h2>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs font-medium text-[#DC2626] hover:text-[#B91C1C] flex items-center gap-1"
            >
              View all ({activeIncidents.length}) <ChevronRight size={13} />
            </button>
          </div>

          {/* PRIMARY FEATURED INCIDENT */}
          <div className="rounded-xl bg-white border border-red-200 p-5 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#DC2626]" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-3">
                <BloodGroupBadge group="O-" size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#17202A] font-display">
                      O− · 2 units required
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#DC2626] border border-red-200 text-xs font-semibold">
                      Critical
                    </span>
                  </div>
                  <span className="text-xs text-[#667085] flex items-center gap-1 mt-0.5">
                    <MapPin size={12} /> Wagholi, Pune · Sahyadri Hospital
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-medium text-[#667085] bg-slate-50 px-2.5 py-1 rounded border border-[#E4E7EC]">
                INC-PN-48291
              </span>
            </div>

            {/* Units secured & Response wave */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F7F8FA] p-3.5 rounded-lg border border-[#E4E7EC]">
              <div>
                <span className="text-xs text-[#667085] block">Secured Status</span>
                <span className="text-sm font-bold text-[#10B981]">1 / 2 units secured</span>
                <div className="h-2 rounded-full bg-[#E4E7EC] overflow-hidden mt-1.5">
                  <div className="h-full bg-[#10B981] rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
              <div>
                <span className="text-xs text-[#667085] block">Current Stage</span>
                <span className="text-sm font-bold text-amber-700">Wave 2 Active</span>
                <p className="text-[11px] text-[#667085] mt-1">Contacted 9 donors · 2 responses</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#667085] font-mono">Elapsed time: 12m 40s</span>
              <button
                onClick={() => navigate('/incidents/INC-PN-48291')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold transition-colors"
              >
                Open Incident <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Secondary Active Incidents */}
          <div className="space-y-3">
            {ALL_INCIDENTS.slice(1, 4).map(inc => (
              <IncidentCard key={inc.incident_id} incident={inc} compact />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN — Network Health & Readiness (Col 5) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Donor Readiness Card */}
          <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#17202A] font-display">
                  Donor readiness
                </h3>
                <span className="text-xs text-[#667085]">20,000 registered capacity</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                87% Coverage
              </span>
            </div>

            {/* Horizontal Bar Breakdown */}
            <div className="space-y-3">
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100">
                <div className="h-full bg-[#10B981]" style={{ width: '45.6%' }} title="Ready now" />
                <div className="h-full bg-amber-400" style={{ width: '19.9%' }} title="May be available" />
                <div className="h-full bg-red-400" style={{ width: '22.7%' }} title="Temporarily unavailable" />
                <div className="h-full bg-slate-300" style={{ width: '11.8%' }} title="Status unknown" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-[#E4E7EC]">
                  <span className="text-[#667085] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Ready now
                  </span>
                  <span className="font-bold text-[#17202A]">4,218</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-[#E4E7EC]">
                  <span className="text-[#667085] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> May be available
                  </span>
                  <span className="font-bold text-[#17202A]">1,842</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-[#E4E7EC]">
                  <span className="text-[#667085] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Temp. unavailable
                  </span>
                  <span className="font-bold text-[#17202A]">2,104</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-[#E4E7EC]">
                  <span className="text-[#667085] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Status unknown
                  </span>
                  <span className="font-bold text-[#17202A]">1,086</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network Attention Item Cards */}
          <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-2">
              <h3 className="text-sm font-bold text-[#17202A] font-display">
                Network attention
              </h3>
              <button
                onClick={() => navigate('/intelligence')}
                className="text-xs text-[#DC2626] hover:underline font-medium"
              >
                View gap analysis
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#DC2626]">O− · Wagholi</div>
                  <div className="text-[#667085] text-[11px]">Critical capacity gap · 11 ready now</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-100 text-[#DC2626] font-bold text-[10px] uppercase">
                  Critical
                </span>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-800">AB− · Hadapsar</div>
                  <div className="text-[#667085] text-[11px]">Low active coverage · 4 ready now</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
                  Attention
                </span>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-800">A− · Baner</div>
                  <div className="text-[#667085] text-[11px]">Re-engagement opportunity · 15 donors</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
                  Re-engage
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blood Group Network Resilience Grid */}
      <div className="rounded-xl bg-white border border-[#E4E7EC] p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-2">
          <h3 className="text-sm font-bold text-[#17202A] font-display">
            Blood group network resilience
          </h3>
          <button
            onClick={() => navigate('/intelligence')}
            className="text-xs text-[#DC2626] hover:underline font-medium"
          >
            Full resilience report
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
          {metrics.blood_group_resilience.map(r => (
            <div
              key={r.blood_group}
              className="p-3 rounded-lg border border-[#E4E7EC] bg-slate-50 text-center space-y-1"
            >
              <div className="font-mono font-bold text-sm text-[#17202A]">{r.blood_group}</div>
              <div className={cn(
                'text-[10px] font-semibold uppercase',
                r.status === 'Critical' ? 'text-[#DC2626]' :
                r.status === 'High Risk' ? 'text-amber-700' : 'text-emerald-700'
              )}>
                {r.status}
              </div>
              <div className="h-1.5 rounded-full bg-[#E4E7EC] overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    r.coverage_percent < 50 ? 'bg-[#DC2626]' :
                    r.coverage_percent < 75 ? 'bg-amber-500' : 'bg-[#10B981]'
                  )}
                  style={{ width: `${r.coverage_percent}%` }}
                />
              </div>
              <div className="text-[11px] text-[#667085]">{r.coverage_percent}% coverage</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
