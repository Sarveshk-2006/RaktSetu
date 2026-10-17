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
      'inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors',
      colorClass,
      className,
    )}>
      {value}
    </span>
  )
}

export function StatusDot({ status }: { status: IncidentStatus | 'operational' }) {
  const colors: Record<string, string> = {
    Verified:    'bg-[#3567B7]',
    Matching:    'bg-[#B7791F]',
    Mobilising:  'bg-[#B42336] animate-pulse',
    Fulfilled:   'bg-[#16805D]',
    Closed:      'bg-[#98A2B3]',
    operational: 'bg-[#16805D] animate-pulse',
  }
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full', colors[status] ?? 'bg-[#98A2B3]')} />
  )
}
