"use client"

import { Building2, Calendar, Activity, FileText } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import { shortDate, humaniseStatus } from "@/components/supplier-workspace/format"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"

function Detail({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="text-sm font-medium text-slate-800 mt-0.5 truncate">{value}</dd>
      </div>
    </div>
  )
}

export interface JobOverviewTabProps {
  job: SupplierAssignmentRow
}

export function JobOverviewTab({ job }: JobOverviewTabProps) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Overview</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <Detail icon={Building2} label="Operator workspace" value={job.operator_workspace_id.slice(0, 8)} />
        <Detail icon={Calendar} label="Scheduled" value={shortDate(job.scheduled_for)} />
        <Detail icon={Activity} label="Status" value={humaniseStatus(job.status)} />
        <Detail icon={FileText} label="Linked job" value={job.job_id ? job.job_id.slice(0, 8) : "—"} />
      </dl>
    </SupplierCard>
  )
}
