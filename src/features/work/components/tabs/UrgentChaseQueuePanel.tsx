import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChaseItem {
  title: string
  property: string
  supplier: string
  status: string
  color: "red" | "amber"
  initials: string
}

interface UrgentChaseQueuePanelProps {
  chaseItems: ChaseItem[]
}

export function UrgentChaseQueuePanel({ chaseItems }: UrgentChaseQueuePanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">Urgent Chase Queue</h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">
          {chaseItems.length} Urgent
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {chaseItems.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No overdue items — great work!</p>
        ) : chaseItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50"
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                item.color === "red" ? "bg-red-500" : "bg-amber-400"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
              <p className="text-xs text-slate-500">
                {item.property} · {item.supplier}
              </p>
              <p
                className={cn(
                  "text-[11px] font-semibold mt-0.5",
                  item.color === "red" ? "text-red-500" : "text-amber-500"
                )}
              >
                {item.status}
              </p>
            </div>
            <Link
              href="/property-manager/work/tasks"
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
            >
              Chase <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
