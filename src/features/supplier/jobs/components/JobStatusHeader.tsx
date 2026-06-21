"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { SupplierStatusBadge, toneForStatus, humaniseStatus } from "@/components/supplier-workspace/ui"
import { shortDate } from "@/components/supplier-workspace/format"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"

export interface JobStatusHeaderProps {
  id: string
  job: SupplierAssignmentRow
}

export function JobStatusHeader({ id, job }: JobStatusHeaderProps) {
  return (
    <div className="hidden md:flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link href="/supplier/jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to jobs
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Job {id.slice(0, 8)}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {job.quote_id ? "From an accepted quote" : "Direct assignment"} · created {shortDate(job.created_at)}
        </p>
      </div>
      <SupplierStatusBadge tone={toneForStatus(job.status)}>{humaniseStatus(job.status)}</SupplierStatusBadge>
    </div>
  )
}
