// RAKTSETU — Premium Light Metric Card Component
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: string
  trendUp?: boolean
  accent?: 'red' | 'green' | 'amber' | 'blue' | 'default'
  className?: string
}

const accentMap = {
  red:     { icon: 'text-[#DC2626]', bg: 'bg-red-50 text-[#DC2626]' },
  green:   { icon: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700' },
  amber:   { icon: 'text-amber-600', bg: 'bg-amber-50 text-amber-700' },
  blue:    { icon: 'text-blue-600', bg: 'bg-blue-50 text-blue-700' },
  default: { icon: 'text-[#667085]', bg: 'bg-slate-100 text-slate-700' },
}

export function KpiCard({ label, value, icon: Icon, trend, trendUp, accent = 'default', className }: KpiCardProps) {
  const colors = accentMap[accent]

  return (
    <div className={cn(
      'rounded-xl bg-white border border-[#E4E7EC] p-5 flex flex-col justify-between transition-all duration-200 shadow-[0_2px_4px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_8px_rgba(16,24,40,0.06)]',
      className,
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#667085]">
          {label}
        </span>
        {Icon && (
          <div className={cn('p-1.5 rounded-lg', colors.bg)}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="text-3xl font-bold font-display tracking-tight text-[#17202A] my-1">
        {value}
      </div>

      {trend && (
        <div className={cn(
          'text-xs font-medium mt-1 flex items-center gap-1',
          trendUp ? 'text-emerald-600' : 'text-[#667085]'
        )}>
          {trend}
        </div>
      )}
    </div>
  )
}
