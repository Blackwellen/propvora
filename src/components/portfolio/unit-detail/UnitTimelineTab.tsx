"use client"

import React from "react"
import { Activity } from "lucide-react"
import { fmtDate, type ActivityRow } from "./shared"

export function UnitTimelineTab({ events, loaded }: { events: ActivityRow[]; loaded: boolean }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Activity className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">{loaded ? "No timeline events yet" : "Loading timeline…"}</p>
          <p className="text-[12px] text-slate-500 mt-1">Events for this unit and its tenancy will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="relative">
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-200" />
          <div className="space-y-0">
            {events.map((item) => (
              <div key={item.id} className="flex gap-4 pb-6 last:pb-0 relative">
                <div className="flex-shrink-0 w-10 flex items-start pt-0.5 justify-center relative z-10">
                  <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-blue-500" />
                </div>
                <div className="flex-1 min-w-0 pt-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[13px] font-bold text-slate-900">{item.action ?? "Activity"}</span>
                    {item.entity_type && (
                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{item.entity_type}</span>
                    )}
                  </div>
                  {item.description && <div className="text-[12px] text-slate-500">{item.description}</div>}
                  <div className="text-[11px] text-slate-500 mt-0.5">{fmtDate(item.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
