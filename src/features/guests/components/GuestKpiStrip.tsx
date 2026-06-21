"use client"

import React from "react"

interface GuestKpiStripProps {
  totalGuests: number
  repeatGuests: number
  longTerm: number
}

export function GuestKpiStrip({ totalGuests, repeatGuests, longTerm }: GuestKpiStripProps) {
  const kpis = [
    { label: "Total guests", value: totalGuests },
    { label: "Repeat guests", value: repeatGuests },
    { label: "Long-term residents", value: longTerm },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
        </div>
      ))}
    </div>
  )
}
