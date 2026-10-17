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
  red:     { icon: 'text-[#B42336]', bg: 'bg-[#FDF2F4] text-[#861D2B]' },
  green:   { icon: 'text-[#16805D]', bg: 'bg-[#EBFDF5] text-[#085D40]' },
  amber:   { icon: 'text-[#B7791F]', bg: 'bg-[#FEF7EC] text-[#8D5A0F]' },
  blue:    { icon: 'text-[#3567B7]', bg: 'bg-[#EFF4FB] text-[#234B8E]' },
  default: { icon: 'text-[#667085]', bg: 'bg-[#F8F9FA] text-[#475467]' },
}

export function KpiCard({ label, value, icon: Icon, trend, trendUp, accent = 'default', className }: KpiCardProps) {
  const colors = accentMap[accent]

  return (
    <div className={cn(
      'rounded-xl bg-white border border-[#E6E8EC] p-5 flex flex-col justify-between transition-all duration-200 shadow-[0_1px_3px_rgba(16,24,40,0.03)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] hover:border-[#D0D5DD]',
      className,
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#667085] tracking-wide">
          {label}
        </span>
        {Icon && (
          <div className={cn('p-1.5 rounded-lg border border-transparent', colors.bg)}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="text-3xl font-bold font-display tracking-tight text-[#17212B] my-1">
        {value}
      </div>

      {trend && (
        <div className={cn(
          'text-xs font-medium mt-1 flex items-center gap-1',
          trendUp ? 'text-[#16805D]' : 'text-[#667085]'
        )}>
          {trend}
        </div>
      )}
    </div>
  )
}
