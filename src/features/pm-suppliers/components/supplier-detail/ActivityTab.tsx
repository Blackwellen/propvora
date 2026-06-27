"use client"

import React from "react"
import { Activity } from "lucide-react"
import { useContactActivity } from "@/features/suppliers/useSupplierTabs"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ActivityTabProps {
  workspaceId: string | undefined
  supplierId: string | undefined
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityTab({ workspaceId, supplierId }: ActivityTabProps) {
  const { data: events = [], isLoading } = useContactActivity(workspaceId, supplierId)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">No activity yet</p>
          <p className="text-[12.5px] text-slate-500">Logged actions and notes for this supplier will appear here.</p>
        </div>
      ) : (
        <div className="relative px-5 py-4 pl-8 before:absolute before:left-[22px] before:top-5 before:bottom-5 before:w-0.5 before:bg-slate-100">
          {events.map((ev) => (
            <div key={ev.id} className="relative mb-4 last:mb-0">
              <div className="absolute -left-[18px] w-3 h-3 rounded-full bg-[var(--brand)] border-2 border-white mt-1" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">{ev.title}</p>
                  {ev.description && (
                    <p className="text-[12px] text-slate-600 mt-0.5">{ev.description}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                    {ev.activity_type.replace(/_/g, " ")}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                  {new Date(ev.created_at).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
