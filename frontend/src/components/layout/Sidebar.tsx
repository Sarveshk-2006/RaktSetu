// RAKTSETU — Clean Light Sidebar Navigation
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, FilePlus, GitPullRequest, Zap,
  Users, Network, Handshake, FlaskConical, FileText, Settings,
  Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  badge?: string
  badgeColor?: string
}

interface NavGroup {
  groupName?: string
  items: NavItem[]
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
      { to: '/incidents',            label: 'Incidents',        icon: AlertTriangle, badge: '4', badgeColor: 'bg-[#E11D48] text-white' },
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
    <aside className="fixed left-0 top-[60px] bottom-0 w-[240px] bg-white border-r border-[#E5E7EB] z-40 flex flex-col justify-between overflow-y-auto font-body text-[#111827]">
      <div className="py-4 px-3 space-y-4">
        {NAV_GROUPS.map((group, idx) => (
          <div key={group.groupName || idx} className="space-y-1">
            {group.groupName && (
              <div className="px-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                {group.groupName}
              </div>
            )}
            {group.items.map(({ to, label, icon: Icon, badge, badgeColor }) => {
              const isActive = to === '/'
                ? location.pathname === '/'
                : location.pathname === to

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all',
                    isActive
                      ? 'bg-[#FFF1F2] text-[#E11D48] font-semibold'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-[#E11D48]' : 'text-[#6B7280]'} />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className={cn('px-1.5 py-0.2 text-[10px] font-bold rounded-full', badgeColor)}>
                      {badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      {/* Network Status Card at Bottom */}
      <div className="p-3 m-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-left">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111827]">
            <Sun size={14} className="text-amber-500" />
            <span>Pune Network</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#047857]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Online
          </span>
        </div>
        <p className="text-[11px] text-[#6B7280]">Node #PN-411</p>
        <p className="text-[11px] text-[#6B7280]">20,000 synthetic pool</p>
        <p className="text-[10px] text-[#9CA3AF] mt-1 pt-1 border-t border-[#E5E7EB]">
          Last sync: 21:42 IST
        </p>
      </div>
    </aside>
  )
}

