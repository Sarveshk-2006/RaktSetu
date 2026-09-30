// RAKTSETU — Clean Light Top Navigation Bar
import { useState, useEffect } from 'react'
import { Bell, Droplets, Search, Menu, X } from 'lucide-react'

interface TopBarProps {
  onMobileMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export function TopBar({ onMobileMenuToggle, isMobileMenuOpen }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.getElementById('global-search-input')
        input?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 h-[64px] z-50 bg-white border-b border-[#E5E7EB] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="h-[64px] w-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Brand & Mobile Menu Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="w-9 h-9 rounded-xl bg-[#E11D48] flex items-center justify-center text-white shadow-xs">
            <Droplets size={20} className="fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base font-bold text-[#111827] tracking-tight leading-none">
              RAKTSETU
            </span>
            <span className="text-[11px] text-[#6B7280] font-medium mt-0.5 hidden sm:inline">
              Blood Response Coordination Platform
            </span>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center max-w-md w-full relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incidents, hospitals, donors, or blood groups..."
            className="w-full bg-[#F9FAFB] hover:bg-[#F3F4F6] focus:bg-white border border-[#E5E7EB] focus:border-[#E11D48] focus:ring-2 focus:ring-red-100 rounded-xl pl-9 pr-16 py-2 text-xs text-[#111827] placeholder-[#9CA3AF] outline-none transition-all shadow-2xs"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[10px] font-medium text-[#6B7280] shadow-2xs pointer-events-none">
            <span>Ctrl K</span>
          </div>
        </div>

        {/* Right: Operational Status, Notifications & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold text-[#047857]">
              Pune Network · Operational
            </span>
          </div>

          <button className="relative p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E11D48]" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-[#E5E7EB]">
            <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              OP
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#111827] leading-tight">Operator Console</span>
              <span className="text-[11px] text-[#6B7280] leading-tight">Pune Central Node</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
