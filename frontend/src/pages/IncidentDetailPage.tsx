import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Zap, MapPin, Droplets, Layers, Clock,
  AlertTriangle, CheckCircle2, Circle, ChevronRight, Phone, ShieldCheck,
  MoreVertical, Navigation, Activity, ArrowUpRight, Sparkles
} from 'lucide-react'

import { PuneNetworkMap } from '@/components/overview/PuneNetworkMap'
import { cn } from '@/lib/utils'
import { DEMO_INCIDENT, DEMO_CANDIDATES, ALL_INCIDENTS } from '@/data/demoData'
import type { Incident } from '@/types'


// Tabs
const TABS = [
  'Donor Matching',
  'Response Cascade',
  'Updates & Timeline',
  'Hospital Details',
  'Map & Location',
  'Audit Log',
]

// Incident Progress Stages
const STAGES = [
  { label: 'Verified', status: 'done' },
  { label: 'Matching', status: 'done' },
  { label: 'Mobilising', status: 'active' },
  { label: 'On Route', status: 'pending' },
  { label: 'Fulfilled', status: 'pending' },
]

export function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Donor Matching')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const incident: Incident = ALL_INCIDENTS.find(i => i.incident_id === id) ?? DEMO_INCIDENT
  const { requirement: req } = incident
  const wave1Candidates = DEMO_CANDIDATES.filter(c => c.wave === 1)

  return (
    <div className="space-y-5 animate-fade-in font-body text-[#111827] max-w-[1600px] mx-auto pb-12">
      {/* Back Link & Header */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/incidents')}
          className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Incidents
        </button>

        {/* Header Main Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold font-mono text-[#111827] tracking-wider">
                {incident.incident_id}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] text-xs font-bold font-mono">
                {req.blood_group}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-bold tracking-wide">
                CRITICAL · {req.units_required} UNITS
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Blood requirement incident · Created 08m 42s ago
            </p>
          </div>

          {/* Header Right: Workflow Progress Tracker & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Horizontal Workflow Stepper */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {STAGES.map((s, idx) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    {s.status === 'done' ? (
                      <CheckCircle2 size={16} className="text-[#10B981]" />
                    ) : s.status === 'active' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#E11D48] bg-[#FFE4E6] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                      </div>
                    ) : (
                      <Circle size={16} className="text-[#D1D5DB]" />
                    )}
                    <span className={cn(
                      'text-[11px] font-semibold',
                      s.status === 'done' ? 'text-[#10B981]' : s.status === 'active' ? 'text-[#E11D48]' : 'text-[#9CA3AF]'
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={cn('w-4 h-0.5', s.status === 'done' ? 'bg-[#10B981]' : 'bg-[#E5E7EB]')} />
                  )}
                </div>
              ))}
            </div>

            {/* Launch Response Cascade Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/response')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Zap size={15} />
                <span>Launch Response Cascade</span>
              </button>
              <button className="p-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Summary Cards (5 Cards Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Location */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Location</span>
              <span className="text-xs font-bold text-[#111827] block font-display">Wagholi, Pune</span>
              <span className="text-[10px] text-[#6B7280] block truncate">Sahyadri Hospital, Hadapsar</span>
            </div>
          </div>
        </div>

        {/* Card 2: Blood Group */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
              <Droplets size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Blood Group</span>
              <span className="text-xs font-bold text-[#111827] block font-display">O-</span>
              <span className="text-[10px] text-[#6B7280] block">Universal recipient</span>
            </div>
          </div>
        </div>

        {/* Card 3: Units Required */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Units Required</span>
              <span className="text-xs font-bold text-[#111827] block font-display">2 Units</span>
              <span className="text-[10px] text-[#6B7280] block">Whole Blood / Washed</span>
            </div>
          </div>
        </div>

        {/* Card 4: Elapsed Time */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Elapsed Time</span>
              <span className="text-xs font-bold text-[#111827] block font-mono">08m 42s</span>
              <span className="text-[10px] text-[#6B7280] block">Since requirement</span>
            </div>
          </div>
        </div>

        {/* Card 5: Incident Priority */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Incident Priority</span>
              <span className="text-xs font-bold text-[#E11D48] block font-display">Critical</span>
              <span className="text-[10px] text-[#6B7280] block">Immediate response required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-6 text-xs font-semibold overflow-x-auto pb-0.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'Response Cascade') navigate('/response')
                else if (tab === 'Audit Log') navigate('/audit')
                else if (tab === 'Map & Location') navigate('/intelligence')
              }}
              className={cn(
                'py-2.5 transition-all relative whitespace-nowrap',
                isActive
                  ? 'text-[#E11D48] font-bold border-b-2 border-[#E11D48]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              )}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Donor Matching & Network Availability (Col 8 / ~68%) */}
        <div className="lg:col-span-8 space-y-5">
          {/* SECTION 1: Recommended Donor Capacity (Wave 1) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#111827] font-display">
                  Recommended Donor Capacity (Wave 1)
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Best matched donors based on compatibility, proximity and availability.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#059669] bg-[#D1FAE5] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
                  3 candidates ranked
                </span>
                <button
                  onClick={() => navigate('/network')}
                  className="text-xs font-semibold text-[#E11D48] hover:underline flex items-center gap-0.5"
                >
                  <span>View all candidates</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Donor Cards List */}
            <div className="space-y-3">
              {wave1Candidates.map((c, idx) => {
                const rank = idx + 1
                const isExpanded = expandedId === c.donor_id
                const confidencePct = Math.round(c.match_confidence * 100)
                const likelihoodPct = Math.round(c.response_likelihood * 100)

                return (
                  <div
                    key={c.donor_id}
                    className={cn(
                      'rounded-xl border border-[#E5E7EB] p-4 transition-all bg-white hover:shadow-xs space-y-3',
                      rank === 1 && 'border-l-4 border-l-[#10B981]'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <div className={cn(
                          'w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center font-display shrink-0',
                          rank === 1 ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#EFF6FF] text-[#2563EB]'
                        )}>
                          #{rank}
                        </div>

                        {/* Donor Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#111827] font-mono">{c.donor_id}</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#FFE4E6] text-[#E11D48] text-[10px] font-bold font-mono">
                              {c.blood_group}
                            </span>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold',
                              c.availability === 'Ready' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#EFF6FF] text-[#2563EB]'
                            )}>
                              {c.availability}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-[#6B7280] mt-1">
                            <span className="flex items-center gap-1 font-medium">
                              <Navigation size={13} className="text-[#9CA3AF]" />
                              {c.distance_km} km away
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Activity size={13} className="text-[#10B981]" />
                              {likelihoodPct}% response likelihood
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Match Score & Action */}
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-xl font-bold font-display text-[#111827] block leading-none">
                            {confidencePct}
                          </span>
                          <span className="text-[10px] font-semibold text-[#6B7280]">Match Score</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate('/response')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-semibold text-xs shadow-2xs transition-colors"
                          >
                            <Phone size={13} />
                            <span>Contact Donor</span>
                          </button>

                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c.donor_id)}
                            className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F9FAFB]"
                          >
                            <ChevronRight size={16} className={cn('transition-transform', isExpanded && 'rotate-90')} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Grid */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-[#F3F4F6] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#F9FAFB] p-3 rounded-lg">
                        <div>
                          <span className="text-[#6B7280] block text-[11px]">Compatibility</span>
                          <span className="font-bold text-[#10B981]">✓ Direct Match</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280] block text-[11px]">Availability</span>
                          <span className="font-bold text-[#10B981]">Available Now</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280] block text-[11px]">Distance</span>
                          <span className="font-bold text-[#111827]">{c.distance_km} km</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280] block text-[11px]">Response Likelihood</span>
                          <span className="font-bold text-[#111827]">{likelihoodPct}%</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280] block text-[11px]">Contact Reliability</span>
                          <span className="font-bold text-[#10B981]">{c.contact_reliability_level}</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280] block text-[11px]">Recent Load</span>
                          <span className="font-bold text-[#10B981]">{c.recent_load_level}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Privacy Notice Card */}
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center gap-3">
              <ShieldCheck size={18} className="text-[#E11D48] shrink-0" />
              <div className="text-xs text-[#4B5563]">
                <strong className="text-[#E11D48] block font-semibold">Contact information is unlocked only after the donor responds.</strong>
                This helps ensure donor privacy and safety. All access is audit-logged.
              </div>
            </div>
          </div>

          {/* SECTION 2: Network Availability (O-) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111827] font-display">Network Availability (O-)</h3>
                <p className="text-xs text-[#6B7280]">Real-time O- donor availability in Pune network.</p>
              </div>

              <button
                onClick={() => navigate('/intelligence')}
                className="text-xs font-semibold text-[#111827] hover:text-[#E11D48] flex items-center gap-1 border border-[#E5E7EB] px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>View network</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-2">
              {/* Radial Donut Gauge */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <svg className="w-32 h-32" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="35"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-bold font-display text-[#111827] leading-none block">86</span>
                  <span className="text-[10px] font-semibold text-[#10B981]">Available</span>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="flex-1 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#4B5563] font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Ready donors
                    </span>
                    <span className="font-bold text-[#111827]">143 <span className="text-[#9CA3AF] font-normal">86%</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div className="h-full bg-[#10B981] rounded-full" style={{ width: '86%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#4B5563] font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> May be available
                    </span>
                    <span className="font-bold text-[#111827]">18 <span className="text-[#9CA3AF] font-normal">11%</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: '11%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#4B5563] font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#E11D48]" /> Temporarily unavailable
                    </span>
                    <span className="font-bold text-[#111827]">5 <span className="text-[#9CA3AF] font-normal">3%</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div className="h-full bg-[#E11D48] rounded-full" style={{ width: '3%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Location Map & Explainable Matching (Col 4 / ~32%) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Incident Location Map */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#111827] font-display">Incident Location</h4>
              <button
                onClick={() => navigate('/intelligence')}
                className="text-[11px] font-semibold text-[#111827] hover:text-[#E11D48] flex items-center gap-0.5"
              >
                <span>View Full Map</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="h-[210px] rounded-xl overflow-hidden border border-[#E5E7EB]">
              <PuneNetworkMap />
            </div>

            <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[#E11D48] shrink-0" />
                <div>
                  <span className="font-bold text-[#111827] block">{req.location.zone}, Pune</span>
                  <span className="text-[11px] text-[#6B7280]">{req.requesting_facility}</span>
                </div>
              </div>

              <button className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
                <span>Get Directions</span>
                <ArrowUpRight size={12} />
              </button>
            </div>
          </div>

          {/* Card 2: Why These Donors? */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#111827] font-display">Why These Donors?</h4>
              <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE] flex items-center gap-1">
                <Sparkles size={11} /> Explainable Matching
              </span>
            </div>

            <p className="text-xs text-[#6B7280] leading-snug">
              RAKTSETU ranks candidates using a multi-factor mobilisation algorithm:
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#D1FAE5] text-[#059669] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="text-xs font-bold text-[#111827] block">Blood Group Compatibility</span>
                  <span className="text-[11px] text-[#6B7280] leading-tight block">Strict antigen match for O- universal recipient safety.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="text-xs font-bold text-[#111827] block">Distance & Travel Time</span>
                  <span className="text-[11px] text-[#6B7280] leading-tight block">Proximity priority (under 5 km radius for first cohort).</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#D97706] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="text-xs font-bold text-[#111827] block">Historical Response Rate</span>
                  <span className="text-[11px] text-[#6B7280] leading-tight block">92% probability score derived from past responses.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
