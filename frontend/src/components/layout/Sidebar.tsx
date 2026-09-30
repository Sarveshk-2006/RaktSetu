// RAKTSETU — Clean Light Sidebar Navigation
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, FilePlus, GitPullRequest, Zap,
  Users, Network, Handshake, FlaskConical, FileText, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavGroup {
  groupName?: string
  items: {
    to: string
    label: string
    icon: typeof LayoutDashboard
  }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    groupName: 'RESPONSE',
    items: [
      { to: '/incidents',            label: 'Incidents',        icon: AlertTriangle },
      { to: '/incidents/create',     label: 'Requirement',      icon: FilePlus },
      { to: '/incidents/INC-PN-48291', label: 'Incident Command', icon: GitPullRequest },
      { to: '/response',             label: 'Response Cascade', icon: Zap },
    ],
  },
  {
    groupName: 'NETWORK',
    items: [
      { to: '/network',      label: 'Donor Network',       icon: Users },
      { to: '/intelligence', label: 'Network Intelligence', icon: Network },
      { to: '/partners',     label: 'Partner Network',     icon: Handshake },
    ],
  },
  {
    groupName: 'PLANNING',
    items: [
      { to: '/stress', label: 'Stress Lab', icon: FlaskConical },
    ],
  },
  {
    groupName: 'ACTIVITY',
    items: [
      { to: '/audit', label: 'Audit Log', icon: FileText },
    ],
  },
  {
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-[60px] bottom-0 w-[260px] bg-white border-r border-[#E4E7EC] z-40 flex flex-col justify-between overflow-y-auto font-body text-[#17202A]">
      <div className="py-4 px-3 space-y-4">
        {NAV_GROUPS.map((group, idx) => (
          <div key={group.groupName || idx} className="space-y-1">
            {group.groupName && (
              <div className="px-3 text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-1">
                {group.groupName}
              </div>
            )}
            {group.items.map(({ to, label, icon: Icon }) => {
              const isActive = to === '/'
                ? location.pathname === '/'
                : location.pathname === to

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                    isActive
                      ? 'bg-red-50 text-[#DC2626] font-semibold border-l-2 border-[#DC2626]'
                      : 'text-[#667085] hover:text-[#17202A] hover:bg-[#F1F3F9]',
                  )}
                >
                  <Icon size={16} className={isActive ? 'text-[#DC2626]' : 'text-[#667085]'} />
                  <span>{label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      {/* Subtle Footer Note */}
      <div className="p-4 border-t border-[#E4E7EC] text-center">
        <p className="text-[11px] text-[#667085]">
          Prototype data • No real donor info
        </p>
      </div>
    </aside>
  )
}
