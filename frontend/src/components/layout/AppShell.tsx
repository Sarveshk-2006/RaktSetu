// RAKTSETU — Clean Light Application Shell Layout
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#17202A] selection:bg-red-100 selection:text-[#DC2626]">
      <Sidebar />
      <TopBar />
      <main
        className="pl-[260px] pt-[60px] min-h-[calc(100vh-60px)] bg-[#F7F8FA] p-6 transition-all"
      >
        <div className="max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
