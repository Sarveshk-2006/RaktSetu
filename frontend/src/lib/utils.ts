// RAKTSETU — Shared Light Mode Utility Functions
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { BloodGroup, IncidentUrgency, IncidentStatus, SeverityLevel, DonorReadiness, WaveStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

export function formatResponseTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function pct(value: number): string {
  return `${Math.round(value)}%`
}

// ─── Light Mode Colour helpers ─────────────────────────────────────────────

export function urgencyColor(urgency: IncidentUrgency): string {
  switch (urgency) {
    case 'Critical': return 'text-[#912020] bg-[#FEF3F2] border-[#FECDCA]'
    case 'High':     return 'text-[#8D5A0F] bg-[#FEF7EC] border-[#FDE2B5]'
    case 'Moderate': return 'text-[#234B8E] bg-[#EFF4FB] border-[#B9D3F8]'
    case 'Routine':  return 'text-[#475467] bg-[#F8F9FA] border-[#E6E8EC]'
  }
}

export function statusColor(status: IncidentStatus): string {
  switch (status) {
    case 'PendingVerification': return 'text-[#6941C6] bg-[#F9F5FF] border-[#E9D7FE]'
    case 'Verified':            return 'text-[#234B8E] bg-[#EFF4FB] border-[#B9D3F8]'
    case 'Matching':            return 'text-[#8D5A0F] bg-[#FEF7EC] border-[#FDE2B5]'
    case 'Mobilising':          return 'text-[#B42336] bg-[#FDF2F4] border-[#F8D7DC]'
    case 'Partially Fulfilled': return 'text-[#0E7090] bg-[#ECFEFF] border-[#A5F3FC]'
    case 'Fulfilled':           return 'text-[#085D40] bg-[#EBFDF5] border-[#A6F4C5]'
    case 'Escalated':           return 'text-[#912020] bg-[#FEF3F2] border-[#FECDCA]'
    case 'Cancelled':           return 'text-[#475467] bg-[#F8F9FA] border-[#E6E8EC]'
    case 'Closed':              return 'text-[#475467] bg-[#F2F4F7] border-[#EAECF0]'
    default:                    return 'text-[#475467] bg-[#F8F9FA] border-[#E6E8EC]'
  }
}

export function severityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'Critical':  return 'text-[#C62828]'
    case 'High Risk': return 'text-[#B7791F]'
    case 'Stable':    return 'text-[#3567B7]'
    case 'Strong':    return 'text-[#16805D]'
  }
}

export function severityBg(severity: SeverityLevel): string {
  switch (severity) {
    case 'Critical':  return 'bg-[#FEF3F2] border-[#FECDCA]'
    case 'High Risk': return 'bg-[#FEF7EC] border-[#FDE2B5]'
    case 'Stable':    return 'bg-[#EFF4FB] border-[#B9D3F8]'
    case 'Strong':    return 'bg-[#EBFDF5] border-[#A6F4C5]'
  }
}

export function bloodGroupColor(bg: BloodGroup): string {
  if (bg.includes('-')) return 'text-[#861D2B] bg-[#FDF2F4] border-[#F8D7DC]'
  return 'text-[#17212B] bg-[#F8F9FA] border-[#E6E8EC]'
}

export function readinessColor(r: DonorReadiness): string {
  switch (r) {
    case 'Ready':       return 'text-[#16805D] font-semibold'
    case 'Maybe':       return 'text-[#B7791F] font-semibold'
    case 'Unavailable': return 'text-[#C62828] font-semibold'
    case 'Unknown':     return 'text-[#667085]'
    default:            return 'text-[#667085]'
  }
}

export function waveStatusColor(s: WaveStatus): string {
  switch (s) {
    case 'Active':       return 'text-[#B7791F]'
    case 'Complete':     return 'text-[#16805D]'
    case 'Completed':    return 'text-[#16805D]'
    case 'Insufficient': return 'text-[#C62828]'
    case 'Exhausted':    return 'text-[#C62828]'
    case 'Cancelled':    return 'text-[#98A2B3]'
    case 'Dispatched':   return 'text-[#3567B7]'
    case 'Evaluating':   return 'text-[#6941C6]'
    case 'Pending':      return 'text-[#667085]'
    default:             return 'text-[#667085]'
  }
}

export function coverageBarColor(pct: number): string {
  if (pct >= 80) return 'bg-[#16805D]'
  if (pct >= 60) return 'bg-[#3567B7]'
  if (pct >= 40) return 'bg-[#B7791F]'
  return 'bg-[#C62828]'
}
