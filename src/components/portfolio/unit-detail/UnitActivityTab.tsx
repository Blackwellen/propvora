"use client"

import React from "react"
import { Activity } from "lucide-react"
import { fmtDate, type ActivityRow } from "./shared"

export function UnitActivityTab({ events, loaded }: { events: ActivityRow[]; loaded: boolean }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Activity className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">{loaded ? "No activity yet" : "Loading activity…"}</p>
          <p className="text-[12px] text-slate-500 mt-1">Actions on this unit and its tenancy will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {events.map((a) => (
          <div key={a.id} className="flex gap-3 p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white bg-[var(--brand)]">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-slate-900">{a.action ?? "Activity"}</span>
                <span className="text-[11px] text-slate-500">·</span>
                <span className="text-[11px] text-slate-500">{fmtDate(a.created_at)}</span>
              </div>
              {a.description && <div className="text-[12px] text-slate-500 mt-0.5">{a.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
