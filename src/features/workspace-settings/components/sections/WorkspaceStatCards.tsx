"use client"

import React from "react"

export interface WorkspaceStatCardsProps {
  planLabel: string
  planBadgeClass: string
  memberCount: number
  seatLimit: number
  aiEnabled: boolean
  pendingInvites: number
}

export function WorkspaceStatCards({
  planLabel,
  planBadgeClass,
  memberCount,
  seatLimit,
  aiEnabled,
  pendingInvites,
}: WorkspaceStatCardsProps) {
  const stats = [
    {
      label: "Subscription",
      value: planLabel,
      badge: <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${planBadgeClass}`}>{planLabel}</span>,
    },
    {
      label: "Team Members",
      value: `${memberCount}`,
      note: pendingInvites > 0 ? `${pendingInvites} pending invite${pendingInvites > 1 ? "s" : ""}` : undefined,
    },
    {
      label: "Seats",
      value: seatLimit === 9999 ? "Unlimited" : `${memberCount} / ${seatLimit}`,
    },
    {
      label: "AI Copilot",
      value: aiEnabled ? "Active" : "Disabled",
      badge: (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${aiEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {aiEnabled ? "Active" : "Disabled"}
        </span>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">{s.label}</p>
          {s.badge ? (
            s.badge
          ) : (
            <p className="text-[22px] font-bold text-slate-900 tabular-nums leading-none">{s.value}</p>
          )}
          {s.note && <p className="text-[11px] text-amber-600 font-medium mt-1">{s.note}</p>}
        </div>
      ))}
    </div>
  )
}
