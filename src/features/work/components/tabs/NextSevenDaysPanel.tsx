import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface UpcomingItem {
  date: string
  title: string
  property: string
  status: string
  statusColor: string
}

interface NextSevenDaysPanelProps {
  upcomingItems: UpcomingItem[]
}

export function NextSevenDaysPanel({ upcomingItems }: NextSevenDaysPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">Next 7 Days</h2>
        <Link
          href="/property-manager/calendar"
          className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] flex items-center gap-0.5"
        >
          Calendar <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {upcomingItems.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Nothing due in the next 7 days.</p>
        ) : upcomingItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-12 shrink-0 rounded-lg bg-blue-50 px-1 py-1 text-center">
              <p className="text-[9px] font-bold text-blue-600 leading-none">{item.date}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{item.title}</p>
              <p className="text-[10px] text-slate-500 truncate">{item.property}</p>
            </div>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0", item.statusColor)}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
