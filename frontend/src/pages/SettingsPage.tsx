// RAKTSETU — Complete Production Settings Page Redesign
import { useState } from 'react'
import {
  Settings, Bell, Shield, Globe,
  RotateCcw, CheckCircle2, Edit3,
  Building2, Sliders, AlertTriangle, X, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'General' | 'Notifications' | 'Data & Privacy' | 'Account'>('General')

  // Operational preferences state
  const [defaultView, setDefaultView] = useState('Overview')
  const [autoRefresh, setAutoRefresh] = useState('1 minute')
  const [distanceUnit, setDistanceUnit] = useState('Kilometres (km)')
  const [defaultMapCenter, setDefaultMapCenter] = useState('Pune Metropolitan Area')

  // Notification toggles state
  const [notifyNewReq, setNotifyNewReq] = useState(true)
  const [notifyIncidentUpdate, setNotifyIncidentUpdate] = useState(true)
  const [notifyPartnerAlerts, setNotifyPartnerAlerts] = useState(true)
  const [notifySystemAlerts, setNotifySystemAlerts] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(false)

  // Data & Privacy state
  const [showDonorPII, setShowDonorPII] = useState(false)
  const [showExactLocations, setShowExactLocations] = useState(false)
  const [retentionPeriod, setRetentionPeriod] = useState('12 months')
  const [auditAccess, setAuditAccess] = useState('Operators Only')

  // System Preferences
  const [theme, setTheme] = useState('Light')
  const [language, setLanguage] = useState('English')
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD')
  const [timeFormat, setTimeFormat] = useState('24 hour (14:30)')

  // Modals & Toasts state
  const [showEditOrgModal, setShowEditOrgModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  const handleResetPreferences = () => {
    setDefaultView('Overview')
    setAutoRefresh('1 minute')
    setDistanceUnit('Kilometres (km)')
    setDefaultMapCenter('Pune Metropolitan Area')
    setNotifyNewReq(true)
    setNotifyIncidentUpdate(true)
    setNotifyPartnerAlerts(true)
    setNotifySystemAlerts(true)
    setNotifyEmail(false)
    setShowDonorPII(false)
    setShowExactLocations(false)
    setRetentionPeriod('12 months')
    setAuditAccess('Operators Only')
    setTheme('Light')
    setLanguage('English')
    setDateFormat('YYYY-MM-DD')
    setTimeFormat('24 hour (14:30)')
    setShowResetModal(false)
    triggerToast('Local preferences reset to default values.')
  }

  return (
    <div className="space-y-6 animate-fade-in font-body text-[#17212B] max-w-[1400px] mx-auto pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#17212B] text-white px-4 py-3 rounded-xl shadow-xl border border-[#2A3441] flex items-center gap-3 animate-slide-up">
          <CheckCircle2 size={18} className="text-[#16805D]" />
          <div className="text-xs">
            <span className="font-bold block">Settings Saved</span>
            <span className="text-[#98A2B3]">{toastMessage}</span>
          </div>
          <button onClick={() => setShowToast(false)} className="text-[#98A2B3] hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-[#E6E8EC]">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#17212B] tracking-tight flex items-center gap-2.5">
            <Settings size={22} className="text-[#B42336]" />
            <span>Settings</span>
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Manage system preferences, notifications, data privacy and node configuration.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="card-command p-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {(['General', 'Notifications', 'Data & Privacy', 'Account'] as const).map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0',
                isActive
                  ? 'bg-[#B42336] text-white shadow-xs'
                  : 'text-[#667085] hover:bg-[#F2F4F7] hover:text-[#17212B]'
              )}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* GENERAL TAB CONTENT */}
      {(activeTab === 'General' || activeTab === 'Notifications' || activeTab === 'Data & Privacy' || activeTab === 'Account') && (
        <div className="space-y-6">
          {/* SECTION 1 — Organisation Information (Full Width) */}
          <div className="card-command p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E8EC] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-[#B42336] flex items-center justify-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-[#17212B] uppercase tracking-wider">Node & Organisation Profile</h3>
                  <p className="text-xs text-[#667085]">Basic configuration for this RAKTSETU node.</p>
                </div>
              </div>

              <button
                onClick={() => setShowEditOrgModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E8EC] hover:bg-[#F8F9FA] text-xs font-bold text-[#475467] transition-colors"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E6E8EC]">
                <span className="text-[#667085] text-[11px] font-medium block">Node Name</span>
                <span className="font-bold text-[#17212B] text-sm">Pune Central Node</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E6E8EC]">
                <span className="text-[#667085] text-[11px] font-medium block">Region</span>
                <span className="font-bold text-[#17212B] text-sm">Pune Metropolitan Area</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E6E8EC]">
                <span className="text-[#667085] text-[11px] font-medium block">Timezone</span>
                <span className="font-bold text-[#17212B] text-sm font-mono">Asia/Kolkata (IST)</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E6E8EC]">
                <span className="text-[#667085] text-[11px] font-medium block">Primary Contact</span>
                <span className="font-bold text-[#17212B] text-sm">RAKTSETU Operations Desk</span>
              </div>
            </div>
          </div>

          {/* SECTION 2 — 2-Column Grid (Operational Preferences + Notification Settings) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Operational Preferences */}
            <div className="lg:col-span-6 card-command p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E6E8EC] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#3567B7] flex items-center justify-center shrink-0 border border-[#B2DDFF]">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-[#17212B] uppercase tracking-wider">Operational Preferences</h3>
                  <p className="text-xs text-[#667085]">Configure default behaviour for the operator console.</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#17212B]">Default View</span>
                  <select
                    value={defaultView}
                    onChange={(e) => {
                      setDefaultView(e.target.value)
                      triggerToast(`Default view set to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="Overview">Overview</option>
                    <option value="Incidents">Emergency Incidents</option>
                    <option value="Donor Network">Donor Network</option>
                    <option value="Partner Network">Partner Network</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <span className="font-bold text-[#17212B]">Auto-refresh Interval</span>
                  <select
                    value={autoRefresh}
                    onChange={(e) => {
                      setAutoRefresh(e.target.value)
                      triggerToast(`Auto-refresh interval updated to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="30 seconds">30 seconds</option>
                    <option value="1 minute">1 minute</option>
                    <option value="5 minutes">5 minutes</option>
                    <option value="Off">Off</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <span className="font-bold text-[#17212B]">Distance Unit</span>
                  <select
                    value={distanceUnit}
                    onChange={(e) => {
                      setDistanceUnit(e.target.value)
                      triggerToast(`Distance unit set to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="Kilometres (km)">Kilometres (km)</option>
                    <option value="Miles (mi)">Miles (mi)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <span className="font-bold text-[#17212B]">Default Map Center</span>
                  <select
                    value={defaultMapCenter}
                    onChange={(e) => {
                      setDefaultMapCenter(e.target.value)
                      triggerToast(`Default map center set to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="Pune Metropolitan Area">Pune Metropolitan Area</option>
                    <option value="Wagholi Sector">Wagholi Sector</option>
                    <option value="Pimpri-Chinchwad">Pimpri-Chinchwad</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Notification Settings */}
            <div className="lg:col-span-6 card-command p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E6E8EC] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#FEF3F2] text-[#B42336] flex items-center justify-center shrink-0 border border-[#FECDCA]">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-[#17212B] uppercase tracking-wider">Notification Settings</h3>
                  <p className="text-xs text-[#667085]">Choose what notifications you want to receive.</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Toggle 1 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#17212B] block">New Blood Requirements</span>
                    <span className="text-[11px] text-[#667085]">Notified when verified requirements are created.</span>
                  </div>
                  <button
                    onClick={() => {
                      setNotifyNewReq(!notifyNewReq)
                      triggerToast(`New requirements alert ${!notifyNewReq ? 'enabled' : 'disabled'}`)
                    }}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0',
                      notifyNewReq ? 'bg-[#B42336]' : 'bg-[#D0D5DD]'
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow-xs transition-transform', notifyNewReq ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <div>
                    <span className="font-bold text-[#17212B] block">Incident Updates</span>
                    <span className="text-[11px] text-[#667085]">Notifications for incident status changes.</span>
                  </div>
                  <button
                    onClick={() => {
                      setNotifyIncidentUpdate(!notifyIncidentUpdate)
                      triggerToast(`Incident updates ${!notifyIncidentUpdate ? 'enabled' : 'disabled'}`)
                    }}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0',
                      notifyIncidentUpdate ? 'bg-[#B42336]' : 'bg-[#D0D5DD]'
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow-xs transition-transform', notifyIncidentUpdate ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>

                {/* Toggle 3 */}
                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <div>
                    <span className="font-bold text-[#17212B] block">Partner Alerts</span>
                    <span className="text-[11px] text-[#667085]">Alerts when partner support is requested.</span>
                  </div>
                  <button
                    onClick={() => {
                      setNotifyPartnerAlerts(!notifyPartnerAlerts)
                      triggerToast(`Partner alerts ${!notifyPartnerAlerts ? 'enabled' : 'disabled'}`)
                    }}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0',
                      notifyPartnerAlerts ? 'bg-[#B42336]' : 'bg-[#D0D5DD]'
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow-xs transition-transform', notifyPartnerAlerts ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>

                {/* Toggle 4 */}
                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <div>
                    <span className="font-bold text-[#17212B] block">System Alerts</span>
                    <span className="text-[11px] text-[#667085]">Operational anomalies and critical warnings.</span>
                  </div>
                  <button
                    onClick={() => {
                      setNotifySystemAlerts(!notifySystemAlerts)
                      triggerToast(`System alerts ${!notifySystemAlerts ? 'enabled' : 'disabled'}`)
                    }}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0',
                      notifySystemAlerts ? 'bg-[#B42336]' : 'bg-[#D0D5DD]'
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow-xs transition-transform', notifySystemAlerts ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>

                {/* Toggle 5 */}
                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <div>
                    <span className="font-bold text-[#17212B] block">Email Notifications</span>
                    <span className="text-[11px] text-[#667085]">Receive critical escalation alerts via email.</span>
                  </div>
                  <button
                    onClick={() => {
                      setNotifyEmail(!notifyEmail)
                      triggerToast(`Email alerts ${!notifyEmail ? 'enabled' : 'disabled'}`)
                    }}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0',
                      notifyEmail ? 'bg-[#B42336]' : 'bg-[#D0D5DD]'
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow-xs transition-transform', notifyEmail ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 — 2-Column Grid (Data & Privacy + System Preferences) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Data & Privacy */}
            <div className="lg:col-span-6 card-command p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E6E8EC] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#EBFDF5] text-[#16805D] flex items-center justify-center shrink-0 border border-[#A6F4C5]">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-[#17212B] uppercase tracking-wider">Data & Privacy Safeguards</h3>
                  <p className="text-xs text-[#667085]">Manage data visibility and privacy settings.</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Privacy Toggle 1 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#17212B] block">Show Donor Personal Details</span>
                    <span className="text-[11px] text-[#667085]">Masked by default to protect donor privacy.</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowDonorPII(!showDonorPII)
                      triggerToast(`Donor PII visibility set to ${!showDonorPII ? 'ON (Warning)' : 'OFF (Protected)'}`)
                    }}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0',
                      showDonorPII ? 'bg-[#B42336]' : 'bg-[#D0D5DD]'
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow-xs transition-transform', showDonorPII ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>

                {/* Privacy Toggle 2 */}
                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <div>
                    <span className="font-bold text-[#17212B] block">Show Exact Locations</span>
                    <span className="text-[11px] text-[#667085]">Coarse zone coordinates used by default.</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowExactLocations(!showExactLocations)
                      triggerToast(`Exact location visibility set to ${!showExactLocations ? 'ON' : 'OFF'}`)
                    }}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0',
                      showExactLocations ? 'bg-[#B42336]' : 'bg-[#D0D5DD]'
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow-xs transition-transform', showExactLocations ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>

                {/* Retention Period Dropdown */}
                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <div>
                    <span className="font-bold text-[#17212B] block">Data Retention Period</span>
                    <span className="text-[11px] text-[#667085]">How long operational data is retained.</span>
                  </div>
                  <select
                    value={retentionPeriod}
                    onChange={(e) => {
                      setRetentionPeriod(e.target.value)
                      triggerToast(`Data retention period set to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="6 months">6 months</option>
                    <option value="12 months">12 months</option>
                    <option value="24 months">24 months</option>
                  </select>
                </div>

                {/* Audit Access Dropdown */}
                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <div>
                    <span className="font-bold text-[#17212B] block">Audit Log Access</span>
                    <span className="text-[11px] text-[#667085]">Role requirement to view audit trails.</span>
                  </div>
                  <select
                    value={auditAccess}
                    onChange={(e) => {
                      setAuditAccess(e.target.value)
                      triggerToast(`Audit log access updated to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="Operators Only">Operators Only</option>
                    <option value="System Admins">System Admins</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: System Preferences */}
            <div className="lg:col-span-6 card-command p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E6E8EC] pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#F9F5FF] text-[#7C3AED] flex items-center justify-center shrink-0 border border-[#E9D7FE]">
                  <Globe size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-[#17212B] uppercase tracking-wider">System Preferences</h3>
                  <p className="text-xs text-[#667085]">Configure display settings and locale format.</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#17212B]">Theme</span>
                  <select
                    value={theme}
                    onChange={(e) => {
                      setTheme(e.target.value)
                      triggerToast(`Theme preference updated to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="Light">Light Command Centre</option>
                    <option value="System Default">System Default</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <span className="font-bold text-[#17212B]">Language</span>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value)
                      triggerToast(`Language set to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="English">English</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <span className="font-bold text-[#17212B]">Date Format</span>
                  <select
                    value={dateFormat}
                    onChange={(e) => {
                      setDateFormat(e.target.value)
                      triggerToast(`Date format set to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-[#E6E8EC] pt-3">
                  <span className="font-bold text-[#17212B]">Time Format</span>
                  <select
                    value={timeFormat}
                    onChange={(e) => {
                      setTimeFormat(e.target.value)
                      triggerToast(`Time format set to ${e.target.value}`)
                    }}
                    className="bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-1.5 text-xs text-[#17212B] font-semibold outline-none cursor-pointer hover:border-[#D0D5DD]"
                  >
                    <option value="24 hour (14:30)">24 hour (14:30)</option>
                    <option value="12 hour (02:30 PM)">12 hour (02:30 PM)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 — Danger Zone (Full Width Card at Bottom) */}
          <div className="card-command p-5 border-l-4 border-l-[#B42336] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3F2] text-[#B42336] flex items-center justify-center shrink-0 border border-[#FECDCA]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-[#B42336] uppercase tracking-wider">Reset Local Console</h3>
                <p className="text-xs text-[#667085]">
                  Reset local UI preferences to default values. This will not alter operational or database records.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#B42336] text-[#B42336] hover:bg-[#B42336] hover:text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto shrink-0"
            >
              <RotateCcw size={14} />
              <span>Reset Local Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* EDIT ORGANISATION MODAL */}
      {showEditOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="card-command max-w-md w-full overflow-hidden space-y-4 animate-scale-up border-[#E6E8EC] shadow-2xl">
            <div className="p-4 bg-[#F8F9FA] border-b border-[#E6E8EC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#B42336]" />
                <h3 className="font-bold font-display text-sm text-[#17212B]">Edit Node Information</h3>
              </div>
              <button onClick={() => setShowEditOrgModal(false)} className="text-[#98A2B3] hover:text-[#17212B]">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#475467] mb-1">Node Name</label>
                <input
                  type="text"
                  defaultValue="Pune Central Node"
                  className="w-full bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#B42336]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475467] mb-1">Region</label>
                <input
                  type="text"
                  defaultValue="Pune Metropolitan Area"
                  className="w-full bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#B42336]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475467] mb-1">Primary Contact</label>
                <input
                  type="text"
                  defaultValue="RAKTSETU Operations Desk"
                  className="w-full bg-[#F8F9FA] border border-[#E6E8EC] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#B42336]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#F8F9FA] border-t border-[#E6E8EC] flex justify-end gap-2">
              <button
                onClick={() => setShowEditOrgModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E8EC] text-xs font-bold text-[#475467] hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEditOrgModal(false)
                  triggerToast('Node information updated successfully.')
                }}
                className="px-4 py-2 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Save Changes</span>
                <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="card-command max-w-md w-full overflow-hidden space-y-4 animate-scale-up border-[#E6E8EC] shadow-2xl">
            <div className="p-4 bg-[#FEF3F2] border-b border-[#FECDCA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#B42336]" />
                <h3 className="font-bold font-display text-sm text-[#861D2B]">Reset Local Preferences?</h3>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-[#98A2B3] hover:text-[#17212B]">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-2 text-xs text-[#475467]">
              <p className="font-bold text-[#17212B]">Are you sure you want to restore all local preferences to defaults?</p>
              <p className="text-[#667085]">
                This will reset your view defaults, notification toggles, and display options. Your operational donor, incident, and partner records will remain intact.
              </p>
            </div>

            <div className="p-4 bg-[#F8F9FA] border-t border-[#E6E8EC] flex justify-end gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E8EC] text-xs font-bold text-[#475467] hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPreferences}
                className="px-4 py-2 rounded-xl bg-[#B42336] hover:bg-[#861D2B] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Reset to Defaults</span>
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
