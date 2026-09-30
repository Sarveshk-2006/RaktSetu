// RAKTSETU — Premium Light Mode Status Badge Component
import { cn, urgencyColor, statusColor, severityColor } from '@/lib/utils'
import type { IncidentUrgency, IncidentStatus, SeverityLevel } from '@/types'

interface StatusBadgeProps {
  type: 'urgency' | 'status' | 'severity' | 'custom'
  value: string
  className?: string
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  let colorClass = ''

  if (type === 'urgency') {
    colorClass = urgencyColor(value as IncidentUrgency)
  } else if (type === 'status') {
    colorClass = statusColor(value as IncidentStatus)
  } else if (type === 'severity') {
    colorClass = severityColor(value as SeverityLevel) + ' bg-transparent'
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold tracking-wide whitespace-nowrap',
      colorClass,
      className,
    )}>
      {value}
    </span>
  )
}

export function StatusDot({ status }: { status: IncidentStatus | 'operational' }) {
  const colors: Record<string, string> = {
    Verified:    'bg-blue-600',
    Matching:    'bg-amber-500',
    Mobilising:  'bg-orange-500 animate-pulse',
    Fulfilled:   'bg-emerald-600',
    Closed:      'bg-slate-400',
    operational: 'bg-emerald-500 animate-pulse',
  }
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full', colors[status] ?? 'bg-slate-400')} />
  )
}
