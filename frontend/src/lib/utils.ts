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
    case 'Critical': return 'text-[#DC2626] bg-red-50 border-red-200'
    case 'High':     return 'text-amber-800 bg-amber-50 border-amber-200'
    case 'Moderate': return 'text-blue-800 bg-blue-50 border-blue-200'
    case 'Routine':  return 'text-slate-700 bg-slate-100 border-slate-200'
  }
}

export function statusColor(status: IncidentStatus): string {
  switch (status) {
    case 'Verified':   return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'Matching':   return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'Mobilising': return 'text-orange-700 bg-orange-50 border-orange-200'
    case 'Fulfilled':  return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    case 'Closed':     return 'text-slate-600 bg-slate-100 border-slate-200'
  }
}

export function severityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'Critical':  return 'text-[#DC2626]'
    case 'High Risk': return 'text-amber-700'
    case 'Stable':    return 'text-blue-700'
    case 'Strong':    return 'text-emerald-700'
  }
}

export function severityBg(severity: SeverityLevel): string {
  switch (severity) {
    case 'Critical':  return 'bg-red-50 border-red-200'
    case 'High Risk': return 'bg-amber-50 border-amber-200'
    case 'Stable':    return 'bg-blue-50 border-blue-200'
    case 'Strong':    return 'bg-emerald-50 border-emerald-200'
  }
}

export function bloodGroupColor(bg: BloodGroup): string {
  if (bg.includes('-')) return 'text-[#DC2626] bg-red-50 border-red-200'
  return 'text-[#17202A] bg-slate-100 border-slate-200'
}

export function readinessColor(r: DonorReadiness): string {
  switch (r) {
    case 'Ready':       return 'text-emerald-600 font-semibold'
    case 'Maybe':       return 'text-amber-600 font-semibold'
    case 'Unavailable': return 'text-red-600 font-semibold'
    case 'Unknown':     return 'text-slate-500'
  }
}

export function waveStatusColor(s: WaveStatus): string {
  switch (s) {
    case 'Active':       return 'text-amber-700'
    case 'Complete':     return 'text-emerald-700'
    case 'Insufficient': return 'text-[#DC2626]'
    case 'Pending':      return 'text-slate-500'
  }
}

export function coverageBarColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 60) return 'bg-blue-500'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-[#DC2626]'
}
