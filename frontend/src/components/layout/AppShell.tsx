// RAKTSETU — Clean Light Application Shell Layout
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#17202A] selection:bg-red-100 selection:text-[#DC2626]">
      <TopBar
        onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
        isMobileMenuOpen={mobileOpen}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className="md:pl-[250px] pt-[64px] min-h-[calc(100vh-64px)] bg-[#F7F8FA] p-4 sm:p-6 transition-all">
        <div className="max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
