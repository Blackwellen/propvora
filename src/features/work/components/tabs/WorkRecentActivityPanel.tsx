import React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface ActivityItem {
  icon: LucideIcon
  bg: string
  color: string
  text: string
  initials: string
  time: string
}

interface WorkRecentActivityPanelProps {
  activityItems: ActivityItem[]
}

export function WorkRecentActivityPanel({ activityItems }: WorkRecentActivityPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Recent Activity</h2>
      <div className="flex flex-col divide-y divide-slate-100">
        {activityItems.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  item.bg
                )}
              >
                <Icon className={cn("w-4 h-4", item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-snug">{item.text}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold text-white bg-slate-400 rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {item.initials.slice(0, 1)}
                </span>
                <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
