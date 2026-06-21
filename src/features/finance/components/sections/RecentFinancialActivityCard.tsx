"use client"

import Link from "next/link"
import { ArrowRight, FileText } from "lucide-react"
import { ActivityRowIcon } from "./ActivityRowIcon"
import type { MoneyActivityRow } from "@/hooks/useMoneyData"

interface RecentFinancialActivityCardProps {
  activity: MoneyActivityRow[] | undefined
}

export function RecentFinancialActivityCard({ activity }: RecentFinancialActivityCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recent Financial Activity</h2>
          <p className="text-xs text-slate-500 mt-0.5">Latest events across Money</p>
        </div>
        <Link href="/property-manager/money/activity" className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1">
          View all activity <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {activity && activity.length > 0 ? (
        <div className="flex flex-col divide-y divide-slate-100">
          {activity.map((row: MoneyActivityRow) => (
            <div key={row.id} className="flex items-center gap-4 py-3">
              <ActivityRowIcon eventType={row.event_type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{row.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">{row.entity_type.replace(/_/g, " ")}</p>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">
                {row.created_at
                  ? new Date(row.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <FileText className="w-10 h-10 text-slate-200" />
          <p className="text-sm font-medium text-slate-500">No activity yet</p>
          <p className="text-xs text-slate-500">Financial events will appear here as you add records.</p>
        </div>
      )}
    </div>
  )
}
