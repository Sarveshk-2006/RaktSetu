// RAKTSETU — Clean Light Sidebar Navigation
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, FilePlus, GitPullRequest, Zap,
  Users, Network, Handshake, FlaskConical, FileText, Settings,
  Activity
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
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-[64px] bottom-0 w-[250px] bg-white border-r border-[#E5E7EB] z-40 flex flex-col justify-between overflow-y-auto font-body text-[#111827] transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="py-4 px-3 space-y-4">
          {NAV_GROUPS.map((group, idx) => (
            <div key={group.groupName || idx} className="space-y-1">
              {group.groupName && (
                <div className="px-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">
                  {group.groupName}
                </div>
              )}
              {group.items.map(({ to, label, icon: Icon, badge, badgeColor }) => {
                const isActive = to === '/'
                  ? location.pathname === '/'
                  : location.pathname === to || (to !== '/' && location.pathname.startsWith(to) && to !== '/incidents')

                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onCloseMobile}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      isActive
                        ? 'bg-[#FFF1F2] text-[#E11D48] font-semibold shadow-2xs'
                        : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB]',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
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
        <div className="p-3.5 m-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111827]">
              <Activity size={14} className="text-[#10B981]" />
              <span>Pune Network</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#047857] bg-[#ECFDF5] px-1.5 py-0.5 rounded-full border border-[#A7F3D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Operational
            </span>
          </div>
          <p className="text-[11px] text-[#6B7280]">Pune Central Node</p>
          <div className="text-[10px] text-[#9CA3AF] pt-1.5 border-t border-[#E5E7EB] flex items-center justify-between">
            <span>12 Active Zones</span>
            <span className="text-[#047857] font-medium">87% Capacity</span>
          </div>
        </div>
      </aside>
    </>
  )
}
