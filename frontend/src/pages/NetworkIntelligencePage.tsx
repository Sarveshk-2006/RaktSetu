// RAKTSETU — Network Intelligence Page
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { MapPin, Network } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NETWORK_METRICS, PUNE_ZONES } from '@/data/demoData'
import type { NetworkGap } from '@/types'

function ZoneDetailPanel({ zone, onClose }: {
  zone: typeof PUNE_ZONES[0] & { gap?: NetworkGap }
  onClose: () => void
}) {
  return (
    <div className="rounded bg-[#111827] border border-[#1F2937] p-4 font-mono space-y-3 shadow-md">
      <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-rose-400" />
          <h3 className="text-sm font-bold text-white">{zone.zone}</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">SEVERITY STATE:</span>
        <span className={cn(
          'font-bold uppercase tracking-wider',
          zone.severity === 'Critical' ? 'text-rose-400' :
          zone.severity === 'High Risk' ? 'text-amber-400' : 'text-emerald-400'
        )}>
          {zone.severity}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
          <span className="text-slate-400">Active Donors:</span>
          <span className="text-white font-bold">{zone.donorCount}</span>
        </div>
        <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
          <span className="text-slate-400">Ready Now:</span>
          <span className="text-emerald-400 font-bold">{zone.readyNow}</span>
        </div>
        {zone.gap && (
          <>
            <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
              <span className="text-slate-400">Median Response:</span>
              <span className="text-white font-bold">{zone.gap.median_response_minutes}m</span>
            </div>
            <div className="flex justify-between border-b border-[#1F2937]/50 pb-1">
              <span className="text-slate-400">Re-engageable:</span>
              <span className="text-amber-400 font-bold">{zone.gap.re_engageable}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function NetworkIntelligencePage() {
  const metrics = NETWORK_METRICS
  const total = metrics.ready_donors + metrics.maybe_available + metrics.temporarily_unavailable + metrics.status_unknown
  const [selectedZone, setSelectedZone] = useState<typeof PUNE_ZONES[0] | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    setMapReady(true)
  }, [])

  const severityMarkerColor: Record<string, string> = {
    Critical: '#E11D48',
    'High Risk': '#F59E0B',
    Stable: '#38BDF8',
    Strong: '#10B981',
  }

  return (
    <div className="max-w-[1300px] animate-fade-in space-y-6">
      <div className="border-b border-[#1F2937] pb-4">
        <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
          <Network className="text-sky-400" size={24} />
          NETWORK INTELLIGENCE
        </h1>
        <p className="text-slate-400 text-xs font-mono mt-1">
          "Registered capacity ≠ usable capacity." Real-time capacity breakdown, regional gaps, and resilience mapping.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5 font-mono">
        <div className="rounded bg-[#111827] border border-[#1F2937] p-4 space-y-3">
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-300 border-b border-[#1F2937] pb-2">
            USABLE CAPACITY BREAKDOWN
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Ready Now', value: metrics.ready_donors, color: 'text-emerald-400', bar: 'bg-emerald-500' },
              { label: 'Maybe Available', value: metrics.maybe_available, color: 'text-amber-400', bar: 'bg-amber-500' },
              { label: 'Temporarily Unavail.', value: metrics.temporarily_unavailable, color: 'text-rose-400', bar: 'bg-rose-500' },
              { label: 'Status Unknown', value: metrics.status_unknown, color: 'text-slate-400', bar: 'bg-slate-600' },
            ].map(({ label, value, color, bar }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className={cn('font-bold', color)}>{value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded bg-[#0B0F14] border border-[#1F2937] overflow-hidden">
                  <div className={cn('h-full', bar)} style={{ width: `${(value / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-[#1F2937] text-center">
            <div className="text-2xl font-bold text-white">{metrics.network_coverage_percent}%</div>
            <div className="text-[10px] text-slate-400 uppercase">Operational Coverage</div>
          </div>
        </div>

        <div className="col-span-2 rounded bg-[#111827] border border-[#1F2937] p-4 space-y-3">
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-300 border-b border-[#1F2937] pb-2">
            BLOOD GROUP RESILIENCE MATRIX
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {metrics.blood_group_resilience.map(r => (
              <div key={r.blood_group} className="rounded bg-[#0B0F14] border border-[#1F2937] p-3 space-y-1.5 text-center">
                <div className="font-bold text-sm text-white">{r.blood_group}</div>
                <div className={cn(
                  'text-[10px] font-bold uppercase tracking-wider',
                  r.status === 'Critical' ? 'text-rose-400' :
                  r.status === 'High Risk' ? 'text-amber-400' : 'text-emerald-400'
                )}>
                  {r.status}
                </div>
                <div className="h-1 rounded bg-[#161E2E] overflow-hidden">
                  <div
                    className={cn(
                      'h-full',
                      r.coverage_percent < 50 ? 'bg-rose-500' :
                      r.coverage_percent < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${r.coverage_percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span>{r.coverage_percent}%</span>
                  <span>{r.ready_count} ready</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded bg-[#111827] border border-[#1F2937] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 font-mono">
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-300">
              PUNE COMMUNITY NETWORK DECISION MAP
            </h2>
            <span className="text-xs text-sky-400 font-semibold">Interactive Regional Telemetry</span>
          </div>

          <div className="h-[380px] rounded overflow-hidden border border-[#1F2937]">
            {mapReady && (
              <MapContainer
                center={[18.5204, 73.8567]}
                zoom={11}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {PUNE_ZONES.map(z => (
                  <CircleMarker
                    key={z.zone}
                    center={[z.lat, z.lng]}
                    radius={14}
                    pathOptions={{
                      color: severityMarkerColor[z.severity],
                      fillColor: severityMarkerColor[z.severity],
                      fillOpacity: 0.7,
                    }}
                    eventHandlers={{
                      click: () => setSelectedZone(z),
                    }}
                  >
                    <Popup className="font-mono text-xs">
                      <strong>{z.zone}</strong><br />
                      Status: {z.severity}<br />
                      Ready: {z.readyNow} donors
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        <div>
          {selectedZone ? (
            <ZoneDetailPanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
          ) : (
            <div className="rounded bg-[#111827] border border-[#1F2937] p-6 text-center space-y-2 font-mono">
              <MapPin size={24} className="text-slate-500 mx-auto" />
              <h3 className="text-white text-xs font-bold uppercase">SELECT ZONE ON MAP</h3>
              <p className="text-slate-400 text-xs font-sans">
                Click any zone marker on the Pune map to inspect regional donor density and response latency metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
