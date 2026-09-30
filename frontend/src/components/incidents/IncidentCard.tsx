// RAKTSETU — Premium Light Incident Card Component
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Building2, ChevronRight } from 'lucide-react'
import { BloodGroupBadge } from '@/components/ui/BloodGroupBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn, formatElapsed } from '@/lib/utils'
import type { Incident } from '@/types'

interface IncidentCardProps {
  incident: Incident
  className?: string
  compact?: boolean
}

export function IncidentCard({ incident, className, compact = false }: IncidentCardProps) {
  const navigate = useNavigate()
  const { requirement: req } = incident

  const unitsBar = (incident.units_secured / req.units_required) * 100

  return (
    <div
      onClick={() => navigate(`/incidents/${incident.incident_id}`)}
      className={cn(
        'group rounded-xl border p-4 cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md font-body',
        req.urgency === 'Critical' ? 'bg-red-50/40 border-red-200 hover:border-red-300' : 'bg-white border-[#E4E7EC] hover:border-[#D0D5DD]',
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-[#17202A] tracking-wider">
            {incident.incident_id}
          </span>
          <BloodGroupBadge group={req.blood_group} size="sm" />
          <StatusBadge type="urgency" value={req.urgency} />
          <StatusBadge type="status" value={incident.status} />
        </div>
        {!compact && (
          <span className="text-xs text-[#667085] font-mono whitespace-nowrap">
            {formatElapsed(incident.elapsed_seconds)}
          </span>
        )}
      </div>

      {/* Info row */}
      <div className="mt-2.5 flex items-center gap-4 text-xs text-[#667085]">
        <span className="flex items-center gap-1 font-medium text-[#17202A]">
          <MapPin size={13} className="text-[#667085]" />
          {req.location.zone} · {req.location.district}
        </span>
        <span className="flex items-center gap-1">
          <Building2 size={13} className="text-[#667085]" />
          {req.requesting_facility}
        </span>
      </div>

      {/* Units progress */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#667085]">Units secured</span>
          <span className={cn(
            'font-semibold font-mono',
            incident.status === 'Fulfilled' ? 'text-emerald-700' : 'text-[#17202A]',
          )}>
            {incident.units_secured} / {req.units_required}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[#F1F3F9] overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              incident.status === 'Fulfilled' ? 'bg-emerald-500' :
              unitsBar >= 50 ? 'bg-amber-500' : 'bg-[#DC2626]',
            )}
            style={{ width: `${unitsBar}%` }}
          />
        </div>
      </div>

      {/* Wave info */}
      {!compact && incident.waves.length > 0 && (
        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#E4E7EC]/60">
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <Clock size={12} />
            {incident.waves.map((w, i) => (
              <span key={i} className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium border',
                w.status === 'Active' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                w.status === 'Complete' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                w.status === 'Insufficient' ? 'bg-red-50 text-red-800 border-red-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              )}>
                Wave {w.wave_number}
              </span>
            ))}
          </div>
          <span className="text-xs text-[#667085] group-hover:text-[#DC2626] font-medium flex items-center gap-0.5">
            View details <ChevronRight size={13} />
          </span>
        </div>
      )}
    </div>
  )
}
