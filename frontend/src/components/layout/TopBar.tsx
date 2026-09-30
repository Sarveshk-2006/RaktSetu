// RAKTSETU — Clean Light Top Navigation Bar
import { Bell, Droplets } from 'lucide-react'

export function TopBar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-[60px] z-50 bg-white border-b border-[#E4E7EC] shadow-[0_1px_3px_rgba(16,24,40,0.05)]"
    >
      <div className="h-[60px] w-full px-6 flex items-center justify-between">
        {/* Left: Brand & Tagline */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#DC2626] flex items-center justify-center text-white shadow-sm">
              <Droplets size={18} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold text-[#17202A] tracking-tight">
                  RAKTSETU
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-[#DC2626] border border-red-200">
                  Network Intelligence
                </span>
              </div>
              <span className="text-xs text-[#667085] hidden sm:inline">
                Blood Response Coordination Platform
              </span>
            </div>
          </div>
        </div>

        {/* Right: Operational Context & User */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">
              Pune Network · Operational
            </span>
          </div>

          <div className="h-5 w-px bg-[#E4E7EC]" />

          <button className="relative p-2 rounded-lg text-[#667085] hover:text-[#17202A] hover:bg-[#F1F3F9] transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
          </button>

          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              OP
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#17202A] leading-tight">Operator Console</span>
              <span className="text-[11px] text-[#667085] leading-tight">Pune Central Node</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
