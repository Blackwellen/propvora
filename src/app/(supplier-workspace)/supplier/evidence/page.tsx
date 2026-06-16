"use client"

import Link from "next/link"
import { Images, ArrowUpRight } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierStatusBadge, SupplierBanner, toneForStatus, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate } from "@/components/supplier-workspace/format"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"

const EVIDENCEABLE = new Set(["accepted", "in_progress", "completed"])

export default function SupplierEvidencePage() {
  const jobs = useSupplierApi<SupplierAssignmentRow[]>(
    useSupplierApiUrl("/api/supplier/jobs", { side: "supplier" }),
    { select: (j) => (j as { items?: SupplierAssignmentRow[] }).items ?? [] }
  )
  const items = (jobs.data ?? []).filter((j) => EVIDENCEABLE.has(j.status))

  return (
    <div className="space-y-5">
      <MobileTopBar title="Evidence" subtitle="Job documentation" />
      <SupplierPageHeader
        title="Evidence"
        subtitle="Before / during / after photos and documents are attached per job. Open a job to capture and review its evidence."
      />

      <SupplierBanner tone="blue">
        Evidence lives on each job. This page lists jobs where you can add or review evidence — open one to manage its before/during/after files.
      </SupplierBanner>

      {jobs.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : items.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Images}
            title="No jobs to document yet"
            description="Once you accept a job, you can attach before/during/after evidence to it. Jobs you're working appear here."
          />
        </SupplierCard>
      ) : (
        <SupplierCard className="divide-y divide-slate-100">
          {items.map((j) => (
            <Link key={j.id} href={`/supplier/jobs/${j.id}?tab=evidence`} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><Images className="w-4 h-4 text-violet-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">Job {j.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-400">{j.scheduled_for ? `Scheduled ${shortDate(j.scheduled_for)}` : "Awaiting schedule"}</p>
              </div>
              <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>
              <ArrowUpRight className="w-4 h-4 text-slate-300 shrink-0" />
            </Link>
          ))}
        </SupplierCard>
      )}
    </div>
  )
}
