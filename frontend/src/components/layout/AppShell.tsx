// RAKTSETU — Clean Light Application Shell Layout
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#17212B] selection:bg-[#FDF2F4] selection:text-[#861D2B]">
      <TopBar
        onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
        isMobileMenuOpen={mobileOpen}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className="md:pl-[256px] pt-[64px] min-h-[calc(100vh-64px)] bg-[#F7F8FA] p-4 sm:p-6 lg:p-8 transition-all overflow-x-hidden">
        <div key={location.pathname} className="max-w-[1600px] mx-auto animate-page-entrance">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

