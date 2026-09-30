// RAKTSETU — Premium Light Blood Group Badge
import { cn, bloodGroupColor } from '@/lib/utils'
import type { BloodGroup } from '@/types'

interface BloodGroupBadgeProps {
  group: BloodGroup
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BloodGroupBadge({ group, size = 'md', className }: BloodGroupBadgeProps) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-bold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }

  return (
    <span className={cn(
      'inline-flex items-center justify-center rounded-md border font-mono tracking-tight shadow-2xs',
      bloodGroupColor(group),
      sizes[size],
      className,
    )}>
      {group}
    </span>
  )
}
