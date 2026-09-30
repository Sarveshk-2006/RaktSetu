// RAKTSETU — Donor Network Page
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { NETWORK_METRICS } from '@/data/demoData'
import { cn, severityColor, coverageBarColor } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

const radarData = [
  { group: 'O+', coverage: 94 },
  { group: 'A+', coverage: 91 },
  { group: 'B+', coverage: 89 },
  { group: 'AB+', coverage: 78 },
  { group: 'O-', coverage: 41 },
  { group: 'A-', coverage: 54 },
  { group: 'B-', coverage: 48 },
  { group: 'AB-', coverage: 29 },
]

export function DonorNetworkPage() {
  const navigate = useNavigate()
  const metrics = NETWORK_METRICS

  return (
    <div className="max-w-[1100px] animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">Donor Network</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Aggregate network capacity view. Individual donor PII is never exposed.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Ready Now', value: metrics.ready_donors.toLocaleString(), color: 'text-green-400' },
          { label: 'Maybe Available', value: metrics.maybe_available.toLocaleString(), color: 'text-amber-400' },
          { label: 'Unavailable', value: metrics.temporarily_unavailable.toLocaleString(), color: 'text-red-400' },
          { label: 'Unknown', value: metrics.status_unknown.toLocaleString(), color: 'text-slate-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-white/8 bg-[#12121e] p-4">
            <div className="text-[11px] uppercase tracking-[0.1em] text-slate-500 mb-2">{label}</div>
            <div className={cn('text-2xl font-bold font-mono', color)}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Radar chart */}
        <div className="rounded-lg border border-white/8 bg-[#12121e] p-4">
          <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-400 mb-3">
            Coverage by Blood Group
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="group" tick={{ fill: '#9090a8', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="coverage" stroke="#dc2626" fill="#dc2626" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Resilience table */}
        <div className="rounded-lg border border-white/8 bg-[#12121e] p-4">
          <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-400 mb-3">
            Resilience Status
          </h2>
          <div className="space-y-2.5">
            {metrics.blood_group_resilience.map(r => (
              <div key={r.blood_group} className="flex items-center gap-3">
                <span className="font-mono text-[12px] font-bold text-white w-8">{r.blood_group}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden">
                  <div className={cn('h-full rounded-full', coverageBarColor(r.coverage_percent))}
                    style={{ width: `${r.coverage_percent}%` }} />
                </div>
                <span className={cn('text-[10px] font-semibold w-16 text-right', severityColor(r.status))}>
                  {r.status}
                </span>
                <span className="font-mono text-[11px] text-slate-500 w-8 text-right">{r.coverage_percent}%</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/intelligence')}
            className="mt-5 w-full py-2 rounded-md border border-white/8 text-slate-400 hover:text-white hover:border-white/15 text-[12px] transition-colors"
          >
            Full Network Analysis →
          </button>
        </div>
      </div>
    </div>
  )
}
