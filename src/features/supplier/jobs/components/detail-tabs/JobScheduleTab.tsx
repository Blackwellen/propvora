"use client"

import { CalendarClock } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"

export interface JobScheduleTabProps {
  job: SupplierAssignmentRow
}

export function JobScheduleTab({ job }: JobScheduleTabProps) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-3">Schedule</h2>
      {job.scheduled_for ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{shortDate(job.scheduled_for)}</p>
            <p className="text-xs text-slate-500">Agreed appointment</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No appointment scheduled yet. The property manager sets the date when the job is assigned; coordinate via Messages if it needs to change.
        </p>
      )}
    </SupplierCard>
  )
}
