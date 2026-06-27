import React from "react"
import Link from "next/link"
import { XCircle, Clock, Calendar } from "lucide-react"

interface SlaOverdueAlertsPanelProps {
  overdue: number
  dueThisWeek: number
  scheduledJobs: number
}

export function SlaOverdueAlertsPanel({ overdue, dueThisWeek, scheduledJobs }: SlaOverdueAlertsPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-4">SLA &amp; Overdue Alerts</h2>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{overdue} Overdue</p>
            <p className="text-xs text-slate-500">Require immediate attention</p>
          </div>
          <Link href="/property-manager/work/tasks" className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] shrink-0">
            View →
          </Link>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{dueThisWeek} Due This Week</p>
            <p className="text-xs text-slate-500">Next 7 days</p>
          </div>
          <Link href="/property-manager/work/tasks" className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] shrink-0">
            View →
          </Link>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{scheduledJobs} Scheduled Jobs</p>
            <p className="text-xs text-slate-500">Upcoming</p>
          </div>
          <Link href="/property-manager/calendar" className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] shrink-0">
            View →
          </Link>
        </div>
      </div>
    </div>
  )
}
