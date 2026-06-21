"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface JobForSchedule {
  id: string
  title: string
  scheduledStart: string
  property: string
  supplier: string
  status: string
}

export interface TodaySchedulePanelProps {
  jobs: JobForSchedule[]
}

function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled:   "bg-[#EFF6FF] text-[#2563EB]",
    in_progress: "bg-blue-50 text-blue-700",
    overdue:     "bg-red-50 text-red-700",
    waiting:     "bg-amber-50 text-amber-700",
    complete:    "bg-emerald-50 text-emerald-700",
    invoiced:    "bg-violet-50 text-violet-700",
  }
  const labels: Record<string, string> = {
    scheduled:   "Scheduled",
    in_progress: "In Progress",
    overdue:     "Overdue",
    waiting:     "Waiting",
    complete:    "Complete",
    invoiced:    "Invoiced",
  }
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", map[status] ?? "bg-slate-100 text-slate-600")}>
      {labels[status] ?? status}
    </span>
  )
}

export function TodaySchedulePanel({ jobs }: TodaySchedulePanelProps) {
  const todayStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  const todayItems = jobs.filter((j) => j.scheduledStart.startsWith(todayStr))
  const displayItems = todayItems.length > 0 ? todayItems : jobs.slice(0, 3)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Today&apos;s Schedule</h3>
      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <p className="text-[12px] text-slate-400">No jobs scheduled for today.</p>
        ) : (
          displayItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="text-[11px] text-slate-400 w-14 shrink-0 mt-0.5">
                {item.scheduledStart.includes(", ")
                  ? item.scheduledStart.split(", ")[1]
                  : item.scheduledStart}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-slate-900 truncate">{item.title}</p>
                <p className="text-[11px] text-slate-400">{item.property} · {item.supplier}</p>
              </div>
              <JobStatusBadge status={item.status} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TodaySchedulePanel
