// RAKTSETU — Application Router
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { OverviewPage } from '@/pages/OverviewPage'
import { IncidentsPage } from '@/pages/IncidentsPage'
import { CreateIncidentPage } from '@/pages/CreateIncidentPage'
import { IncidentDetailPage } from '@/pages/IncidentDetailPage'
import { DonorNetworkPage } from '@/pages/DonorNetworkPage'
import { ResponseCascadePage } from '@/pages/ResponseCascadePage'
import { NetworkIntelligencePage } from '@/pages/NetworkIntelligencePage'
import { StressLabPage } from '@/pages/StressLabPage'
import { PartnerNetworkPage } from '@/pages/PartnerNetworkPage'
import { AuditLogPage } from '@/pages/AuditLogPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/incidents/create" element={<CreateIncidentPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="/network" element={<DonorNetworkPage />} />
          <Route path="/response" element={<ResponseCascadePage />} />
          <Route path="/intelligence" element={<NetworkIntelligencePage />} />
          <Route path="/stress" element={<StressLabPage />} />
          <Route path="/partners" element={<PartnerNetworkPage />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
