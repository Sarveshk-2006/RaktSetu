// RAKTSETU — Clean Light Application Shell Layout with Collapsible Rail
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('raktsetu_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const location = useLocation()

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('raktsetu_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Keyboard shortcut Ctrl+\ or Cmd+\ to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        handleToggleCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#17212B] selection:bg-[#FDF2F4] selection:text-[#861D2B]">
      <TopBar
        onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
        isMobileMenuOpen={mobileOpen}
        isSidebarCollapsed={isCollapsed}
        onToggleSidebar={handleToggleCollapse}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <main
        className={cn(
          "pt-[64px] min-h-[calc(100vh-64px)] bg-[#F7F8FA] transition-[margin-left] duration-200 ease-in-out p-4 sm:p-6 lg:p-8 min-w-0",
          isCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"
        )}
      >
        <div key={location.pathname} className="max-w-[1600px] w-full mx-auto animate-page-entrance min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}


