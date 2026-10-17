// RAKTSETU — Clean Light Sidebar Navigation
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, FilePlus, GitPullRequest, Zap,
  Users, Network, Handshake, FlaskConical, FileText, Settings,
  Activity, PanelLeftClose, PanelLeftOpen
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
      { to: '/incidents',            label: 'Incidents Queue',  icon: AlertTriangle, badge: '4', badgeColor: 'bg-[#FEF3F2] text-[#912020] border border-[#FECDCA]' },
      { to: '/incidents/create',     label: 'Create Requisition', icon: FilePlus },
      { to: '/incidents/INC-PN-48291', label: 'Incident Command', icon: GitPullRequest },
      { to: '/response',             label: 'Response Cascade', icon: Zap },
    ],
  },
  {
    groupName: 'NETWORK INTELLIGENCE',
    items: [
      { to: '/network',      label: 'Donor Network',       icon: Users },
      { to: '/intelligence', label: 'Network Intelligence', icon: Network },
      { to: '/partners',     label: 'Partner Network',     icon: Handshake },
    ],
  },
  {
    groupName: 'SIMULATION & PLANNING',
    items: [
      { to: '/stress', label: 'Stress Lab', icon: FlaskConical },
    ],
  },
  {
    groupName: 'GOVERNANCE & AUDIT',
    items: [
      { to: '/audit', label: 'Verifiable Audit Log', icon: FileText },
      { to: '/settings', label: 'System Settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  onCloseMobile?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({
  mobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-[64px] bottom-0 bg-white border-r border-[#E6E8EC] z-40 flex flex-col justify-between overflow-y-auto overflow-x-hidden font-body text-[#17212B] transition-[width,transform] duration-200 ease-in-out motion-reduce:transition-none',
          isCollapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className={cn('py-4 space-y-4', isCollapsed ? 'px-2' : 'px-3')}>
          {NAV_GROUPS.map((group, idx) => (
            <div key={group.groupName || idx} className="space-y-1">
              {group.groupName && (
                isCollapsed ? (
                  <div className="h-px bg-[#E6E8EC] my-2 mx-2" title={group.groupName} />
                ) : (
                  <div className="px-3 text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
                    {group.groupName}
                  </div>
                )
              )}
              {group.items.map(({ to, label, icon: Icon, badge, badgeColor }) => {
                const isActive = to === '/'
                  ? location.pathname === '/'
                  : location.pathname === to || (to !== '/' && location.pathname.startsWith(to) && to !== '/incidents')

                if (isCollapsed) {
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onCloseMobile}
                      title={badge ? `${label} (${badge})` : label}
                      aria-label={label}
                      className={cn(
                        'w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-xs font-medium transition-all duration-150 relative group active:scale-95',
                        isActive
                          ? 'bg-[#FDF2F4] text-[#861D2B] font-semibold border border-[#F8D7DC] shadow-2xs'
                          : 'text-[#475467] hover:text-[#17212B] hover:bg-[#F8F9FA]',
                      )}
                    >
                      <Icon
                        size={18}
                        className={cn(
                          'shrink-0 transition-colors duration-150',
                          isActive ? 'text-[#B42336]' : 'text-[#667085] group-hover:text-[#17212B]'
                        )}
                      />
                      <span className="sr-only">{label}</span>
                      {badge && (
                        <span className="w-2 h-2 rounded-full bg-[#B42336] absolute top-1.5 right-1.5 ring-2 ring-white" />
                      )}
                    </NavLink>
                  )
                }

                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onCloseMobile}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ease-out group active:scale-[0.98]',
                      isActive
                        ? 'bg-[#FDF2F4] text-[#861D2B] font-semibold border-l-2 border-[#B42336] shadow-2xs'
                        : 'text-[#475467] hover:text-[#17212B] hover:bg-[#F8F9FA]',
                    )}
                  >
                    <div className="flex items-center gap-2.5 transition-transform duration-150 group-hover:translate-x-0.5">
                      <Icon size={16} className={cn('transition-colors duration-150', isActive ? 'text-[#B42336]' : 'text-[#667085] group-hover:text-[#17212B]')} />
                      <span>{label}</span>
                    </div>
                    {badge && (
                      <span className={cn('px-1.5 py-0.5 text-[10px] font-bold rounded-md leading-none transition-transform duration-150 group-hover:scale-105', badgeColor)}>
                        {badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        {isCollapsed ? (
          <div className="p-2 space-y-2 border-t border-[#E6E8EC]">
            <div
              className="w-10 h-10 mx-auto rounded-xl bg-[#EBFDF5] border border-[#A6F4C5] flex items-center justify-center text-[#16805D] cursor-help"
              title="Pune Central Node · Live Dispatch Active (87% Capacity)"
            >
              <Activity size={18} />
            </div>
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl text-[#667085] hover:text-[#17212B] hover:bg-[#F2F4F7] border border-[#E6E8EC] transition-colors active:scale-95"
              title="Expand Sidebar (Ctrl+\)"
              aria-label="Expand Sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {/* Operational Status Card */}
            <div className="p-3.5 mx-3 rounded-xl bg-[#F8F9FA] border border-[#E6E8EC] text-left space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#17212B]">
                  <Activity size={14} className="text-[#16805D]" />
                  <span>Pune Central Node</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#085D40] bg-[#EBFDF5] px-2 py-0.5 rounded-full border border-[#A6F4C5]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16805D]" /> Live
                </span>
              </div>
              <p className="text-[11px] text-[#667085]">Authorised Dispatch Active</p>
              <div className="text-[10px] text-[#667085] pt-1.5 border-t border-[#E6E8EC] flex items-center justify-between">
                <span>12 Coverage Zones</span>
                <span className="text-[#085D40] font-semibold">87% Capacity</span>
              </div>
            </div>

            {/* Collapse Toggle Control */}
            <div className="px-3 pt-1">
              <button
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#667085] hover:text-[#17212B] hover:bg-[#F2F4F7] border border-transparent hover:border-[#E6E8EC] transition-colors group active:scale-[0.98]"
                title="Collapse Sidebar (Ctrl+\)"
                aria-label="Collapse Sidebar"
              >
                <span className="flex items-center gap-2">
                  <PanelLeftClose size={15} className="text-[#667085] group-hover:text-[#17212B] transition-colors" />
                  <span>Collapse Sidebar</span>
                </span>
                <kbd className="text-[10px] text-[#98A2B3] bg-[#F8F9FA] px-1.5 py-0.5 rounded border border-[#E6E8EC]">Ctrl+\</kbd>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}


