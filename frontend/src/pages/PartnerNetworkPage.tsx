// RAKTSETU — Partner Network & Coordination Page
import { Building2, CheckCircle2, Handshake } from 'lucide-react'
import { ORGANISATIONS } from '@/data/demoData'
import type { Organisation } from '@/types'

function PartnerCard({ org }: { org: Organisation }) {
  return (
    <div className="rounded bg-[#111827] border border-[#1F2937] hover:border-[#374151] p-4 font-mono space-y-3 transition-colors cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 rounded bg-[#161E2E] border border-[#1F2937] flex items-center justify-center">
          <Building2 size={16} className="text-slate-300" />
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded border font-semibold uppercase bg-sky-950/60 text-sky-400 border-sky-800">
          {org.type}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white font-display">{org.name}</h3>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
          <CheckCircle2 size={12} />
          <span>Active Coordination Node</span>
        </div>
      </div>

      <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-[#1F2937]/50">
        <div className="flex justify-between">
          <span>Active Donors:</span>
          <span className="text-white font-bold">{org.active_donors.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Coverage Zones:</span>
          <span className="text-slate-300">{org.zones.join(' · ')}</span>
        </div>
      </div>
    </div>
  )
}

function NetworkDiagram() {
  return (
    <div className="rounded bg-[#111827] border border-[#1F2937] p-5 text-center font-mono space-y-4">
      <h2 className="text-xs font-bold tracking-wider uppercase text-slate-300 border-b border-[#1F2937] pb-2">
        RAKTSETU COORDINATION ARCHITECTURE
      </h2>

      <div className="flex justify-center gap-2 flex-wrap">
        {['HOSPITAL', 'NGO FLEET', 'BLOOD BANK', 'COMMUNITY GROUP'].map(label => (
          <div key={label} className="rounded bg-[#0B0F14] border border-[#1F2937] px-2.5 py-1.5 text-[10px] text-slate-300 font-bold">
            {label}
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-500 font-bold">↓ LAYERED INTEGRATION ↓</div>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold uppercase tracking-wider">
        RAKTSETU COORDINATION & INTELLIGENCE
      </div>

      <div className="text-xs text-slate-500 font-bold">↓ DISPATCH CASCADE ↓</div>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wider">
        OPTIMIZED EMERGENCY FULFILMENT
      </div>

      <p className="text-[11px] text-slate-400 font-sans leading-relaxed pt-2">
        RAKTSETU coordinates existing organisations without replacing their internal workflows or ERP software.
      </p>
    </div>
  )
}

export function PartnerNetworkPage() {
  const totalDonors = ORGANISATIONS.reduce((sum, o) => sum + o.active_donors, 0)

  return (
    <div className="max-w-[1200px] animate-fade-in space-y-6">
      <div className="border-b border-[#1F2937] pb-4">
        <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
          <Handshake className="text-emerald-400" size={24} />
          PARTNER NETWORK COORDINATION
        </h1>
        <p className="text-slate-400 text-xs font-mono mt-1">
          Coordinating {ORGANISATIONS.length} partner organisations representing {totalDonors.toLocaleString()} active donors across Pune.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {ORGANISATIONS.map(org => (
              <PartnerCard key={org.org_id} org={org} />
            ))}
          </div>
        </div>

        <div>
          <NetworkDiagram />
        </div>
      </div>
    </div>
  )
}
