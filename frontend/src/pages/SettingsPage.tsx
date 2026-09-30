// RAKTSETU — Settings Page (stub)
export function SettingsPage() {
  return (
    <div className="max-w-[600px] animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Application configuration and preferences</p>
      </div>
      <div className="rounded-lg border border-white/8 bg-[#12121e] p-6 space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-white/6">
          <div>
            <p className="text-[13px] text-white font-medium">Environment</p>
            <p className="text-[12px] text-slate-500">Current operating mode</p>
          </div>
          <span className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-900/30 px-2.5 py-1 rounded font-semibold">
            DEMO
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/6">
          <div>
            <p className="text-[13px] text-white font-medium">Data Mode</p>
            <p className="text-[12px] text-slate-500">All data is synthetic — no real donor information</p>
          </div>
          <span className="text-[11px] text-green-400 bg-green-950/30 border border-green-900/30 px-2.5 py-1 rounded font-semibold">
            SYNTHETIC
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/6">
          <div>
            <p className="text-[13px] text-white font-medium">Network</p>
            <p className="text-[12px] text-slate-500">Pune Community Network</p>
          </div>
          <span className="text-[11px] text-slate-300">Active</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <div>
            <p className="text-[13px] text-white font-medium">Version</p>
            <p className="text-[12px] text-slate-500">RAKTSETU prototype v1.0</p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">1.0.0-demo</span>
        </div>
      </div>
    </div>
  )
}
