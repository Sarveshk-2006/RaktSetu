// RAKTSETU — Clean Light Top Navigation Bar with Smooth Microinteractions
import { useState, useEffect, useRef } from 'react'
import {
  Bell, Droplets, Search, Menu, X, ShieldCheck, ChevronRight,
  User, LogOut, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { checkBackendHealth } from '@/lib/api'

interface TopBarProps {
  onMobileMenuToggle?: () => void
  isMobileMenuOpen?: boolean
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

interface OperationalAlert {
  id: string
  title: string
  time: string
  type: 'critical' | 'warning' | 'info'
  read: boolean
}

const INITIAL_ALERTS: OperationalAlert[] = [
  {
    id: 'alt-1',
    title: 'INC-PN-48291: Wave 1 contact cascade active for 4 units O-',
    time: '2m ago',
    type: 'critical',
    read: false,
  },
  {
    id: 'alt-2',
    title: 'Sassoon General Blood Bank: O- inventory at 8 units (Threshold: 10)',
    time: '14m ago',
    type: 'warning',
    read: false,
  },
  {
    id: 'alt-3',
    title: 'Symbiosis University Hospital confirmed mutual-aid reserve status',
    time: '45m ago',
    type: 'info',
    read: true,
  },
]

export function TopBar({
  onMobileMenuToggle,
  isMobileMenuOpen,
  isSidebarCollapsed = false,
  onToggleSidebar,
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [alerts, setAlerts] = useState<OperationalAlert[]>(INITIAL_ALERTS)
  const [backendStatus, setBackendStatus] = useState<{
    live: boolean
    mode: 'authoritative' | 'demo'
    service: string
  }>({
    live: false,
    mode: 'demo',
    service: 'Verified Deterministic Demo Sandbox',
  })
  
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const unreadCount = alerts.filter(a => !a.read).length

  // Check backend health on mount
  useEffect(() => {
    let mounted = true
    checkBackendHealth().then((status) => {
      if (mounted) setBackendStatus(status)
    })
    return () => {
      mounted = false
    }
  }, [])

  // Global Ctrl+K shortcut and Escape key closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.getElementById('global-search-input')
        input?.focus()
      } else if (e.key === 'Escape') {
        setShowNotifications(false)
        setShowProfile(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const query = searchQuery.trim().toLowerCase()
    if (query.includes('inc') || query.includes('48291')) {
      navigate('/incidents/INC-PN-48291')
    } else if (query.includes('donor') || query.includes('ready')) {
      navigate('/network')
    } else if (query.includes('partner') || query.includes('hospital')) {
      navigate('/partners')
    } else {
      navigate('/incidents')
    }
    setSearchQuery('')
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-[64px] z-50 bg-white border-b border-[#E6E8EC] shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="h-[64px] w-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Brand & Menu Toggles */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-1.5 rounded-lg text-[#667085] hover:text-[#17212B] hover:bg-[#F3F4F6] transition-colors active:scale-95"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-[#667085] hover:text-[#17212B] hover:bg-[#F3F4F6] transition-colors active:scale-95 border border-[#E6E8EC]"
            aria-label={isSidebarCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
            title={isSidebarCollapsed ? "Expand sidebar (Ctrl+\\)" : "Collapse sidebar (Ctrl+\\)"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#B42336] flex items-center justify-center text-white shadow-xs group-hover:bg-[#861D2B] transition-colors duration-150">
              <Droplets size={20} className="fill-white/20 transition-transform duration-150 group-hover:scale-105" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold text-[#17212B] tracking-tight leading-none group-hover:text-[#861D2B] transition-colors">
                  रक्तसेतु RAKTSETU
                </span>
                <span className="hidden xl:inline text-[9px] uppercase tracking-wider font-bold bg-[#FDF2F4] text-[#861D2B] px-1.5 py-0.5 rounded border border-[#F8D7DC]">
                  Command
                </span>
              </div>
              <span className="text-[11px] text-[#667085] font-medium mt-0.5 hidden sm:inline">
                Blood Response Coordination Platform
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center max-w-md w-full relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] transition-colors" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incidents, hospitals, donors, blood groups..."
            className="w-full bg-[#F8F9FA] hover:bg-[#F2F4F7] focus:bg-white border border-[#E6E8EC] focus:border-[#B42336] focus:ring-2 focus:ring-[#FDF2F4] rounded-xl pl-9 pr-16 py-2 text-xs text-[#17212B] placeholder-[#98A2B3] outline-none transition-all shadow-2xs"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#17212B] p-0.5"
            >
              <X size={13} />
            </button>
          ) : (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white border border-[#E6E8EC] text-[10px] font-medium text-[#667085] shadow-2xs pointer-events-none">
              <span>Ctrl K</span>
            </div>
          )}
        </form>

        {/* Right: Operational Status, Notifications & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {backendStatus.live ? (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBFDF5] border border-[#A6F4C5] transition-all cursor-help"
              title="Connected to authoritative FastAPI backend and managed database"
            >
              <span className="w-2 h-2 rounded-full bg-[#16805D] animate-pulse-sentinel" />
              <span className="text-xs font-semibold text-[#085D40]">
                Live Backend Connected
              </span>
            </div>
          ) : (
            <div 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF7EC] border border-[#FEDF89] transition-all cursor-help"
              title="Authoritative PostgreSQL & FastAPI backend offline. Operating in verified deterministic demo mode for Pune District."
            >
              <span className="w-2 h-2 rounded-full bg-[#B7791F]" />
              <span className="text-xs font-semibold text-[#8D5A0F]">
                Standalone Demo Sandbox
              </span>
            </div>
          )}

          {/* Notifications Trigger & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowProfile(false)
              }}
              className="relative p-2 rounded-lg text-[#667085] hover:text-[#17212B] hover:bg-[#F3F4F6] transition-all active:scale-95"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B42336] animate-pulse-sentinel" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E6E8EC] rounded-2xl shadow-dropdown z-50 p-4 animate-dropdown origin-top-right">
                <div className="flex items-center justify-between pb-3 border-b border-[#F2F4F7]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#17212B]">Operational Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#FDF2F4] text-[#861D2B] border border-[#F8D7DC]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-[#B42336] hover:text-[#861D2B] font-semibold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#F2F4F7] max-h-72 overflow-y-auto my-1">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`py-2.5 px-1 flex gap-2.5 items-start transition-colors rounded-lg ${
                        alert.read ? 'opacity-70' : 'bg-[#FCFCFD]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {alert.type === 'critical' ? (
                          <div className="w-2 h-2 rounded-full bg-[#C62828] mt-1.5" />
                        ) : alert.type === 'warning' ? (
                          <div className="w-2 h-2 rounded-full bg-[#B7791F] mt-1.5" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-[#3567B7] mt-1.5" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs text-[#17212B] font-medium leading-snug">
                          {alert.title}
                        </p>
                        <span className="text-[10px] text-[#98A2B3] mt-0.5 block">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#F2F4F7] text-center">
                  <button
                    onClick={() => {
                      navigate('/audit')
                      setShowNotifications(false)
                    }}
                    className="text-xs font-semibold text-[#475467] hover:text-[#17212B] flex items-center justify-center gap-1 w-full py-1.5 rounded-lg hover:bg-[#F8F9FA] transition-colors"
                  >
                    <span>View full verifiable audit stream</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Operator Profile Trigger & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(!showProfile)
                setShowNotifications(false)
              }}
              className="flex items-center gap-2.5 pl-2 border-l border-[#E6E8EC] text-left hover:opacity-90 transition-opacity cursor-pointer group"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#17212B] text-white font-semibold text-xs flex items-center justify-center shadow-xs group-hover:ring-2 group-hover:ring-[#B42336]/20 transition-all">
                OP
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#17212B] leading-tight group-hover:text-[#861D2B] transition-colors">
                  Operator Console
                </span>
                <span className="text-[11px] text-[#667085] leading-tight">Pune Central Node</span>
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E6E8EC] rounded-2xl shadow-dropdown z-50 p-4 animate-dropdown origin-top-right">
                <div className="pb-3 border-b border-[#F2F4F7]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#17212B] text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                      OP
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#17212B]">Sarvesh Kulkarni</div>
                      <div className="text-[11px] text-[#667085]">Lead Dispatch Controller</div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#16805D] bg-[#EBFDF5] px-2 py-1 rounded-md">
                    <ShieldCheck size={13} />
                    <span>Role: Master Operator (Level 3)</span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg text-[#475467] hover:bg-[#F8F9FA] transition-colors">
                    <span className="text-[#667085]">Active Node</span>
                    <span className="font-semibold text-[#17212B]">Pune Central (MH-12)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg text-[#475467] hover:bg-[#F8F9FA] transition-colors">
                    <span className="text-[#667085]">Shift Started</span>
                    <span className="font-mono text-[#17212B]">08:00 IST</span>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/settings')
                      setShowProfile(false)
                    }}
                    className="w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg text-[#475467] hover:text-[#17212B] hover:bg-[#F8F9FA] transition-colors"
                  >
                    <User size={14} />
                    <span>Console Configuration</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#F2F4F7]">
                  <button
                    onClick={() => {
                      setShowProfile(false)
                      navigate('/settings')
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg text-[#C62828] bg-[#FEF3F2] hover:bg-[#FEE4E2] transition-colors"
                  >
                    <LogOut size={13} />
                    <span>Lock Console Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

