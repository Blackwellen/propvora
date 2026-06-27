"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useSupplierPlan } from "@/components/supplier-workspace/useSupplierPlan"
import { MobileTopBar } from "@/components/mobile"
import { SupplierCard, SupplierLoadingState } from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"
import { JobsKpiStrip } from "@/features/supplier/jobs/components/JobsKpiStrip"
import { JobsListTab } from "@/features/supplier/jobs/components/tabs/JobsListTab"
import { DispatchBoardTab } from "@/features/supplier/jobs/components/tabs/DispatchBoardTab"
import { EvidenceBoardTab } from "@/features/supplier/jobs/components/tabs/EvidenceBoardTab"

const ACTIVE = new Set(["assigned", "accepted", "in_progress"])

/* Route-aware wrapper: team/enterprise plans get the Dispatch (image 8) and
   Evidence (image 10) boards via ?tab=; everything else (and Solo) is the list. */
export default function SupplierJobsPage() {
  return (
    <Suspense
      fallback={
        <SupplierCard className="p-5">
          <SupplierLoadingState rows={5} />
        </SupplierCard>
      }
    >
      <JobsRouter />
    </Suspense>
  )
}

function JobsRouter() {
  const { isTeam } = useSupplierPlan()
  const tab = useSearchParams().get("tab")

  if (isTeam && tab === "dispatch") {
    return (
      <div className="space-y-5">
        <MobileTopBar title="Dispatch board" subtitle="Team jobs" />
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-slate-900">Team Jobs: Dispatch Board</h1>
        </div>
        <DispatchBoardTab />
      </div>
    )
  }

  if (isTeam && tab === "evidence") {
    return (
      <div className="space-y-5">
        <MobileTopBar title="Evidence" subtitle="Team jobs" />
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-slate-900">
            Team Jobs: Evidence &amp; Sign-off
          </h1>
        </div>
        <EvidenceBoardTab />
      </div>
    )
  }

  return <JobsListWithKpi isTeam={isTeam} />
}

function JobsListWithKpi({ isTeam }: { isTeam: boolean }) {
  const baseUrl = useSupplierApiUrl("/api/supplier/jobs", { side: "supplier" })
  const jobs = useSupplierApi<SupplierAssignmentRow[]>(isTeam ? baseUrl : null, {
    select: (j) =>
      (j as { items?: SupplierAssignmentRow[] }).items ??
      (Array.isArray(j) ? (j as SupplierAssignmentRow[]) : []),
  })
  const rows = jobs.data ?? []
  const activeCount = rows.filter((j) => ACTIVE.has((j.status ?? "").toLowerCase())).length
  const unassignedCount = rows.filter((j) => (j.status ?? "").toLowerCase() === "assigned").length
  const completedCount = rows.filter((j) => (j.status ?? "").toLowerCase() === "completed").length
  // SLA risk = active (not completed) jobs scheduled in the past or within the next 24h.
  const slaThreshold = Date.now() + 24 * 60 * 60 * 1000
  const slaRiskCount = rows.filter((j) => {
    if (!ACTIVE.has((j.status ?? "").toLowerCase())) return false
    if (!j.scheduled_for) return false
    return new Date(j.scheduled_for).getTime() <= slaThreshold
  }).length

  return (
    <>
      <MobileTopBar title="Jobs" subtitle="Your work orders" />
      {isTeam && (
        <JobsKpiStrip
          stats={[
            { label: "Active jobs", value: String(activeCount), tone: "blue" },
            { label: "Awaiting assignment", value: String(unassignedCount), tone: "amber" },
            { label: "SLA risk", value: String(slaRiskCount), tone: "red" },
            { label: "Completed", value: String(completedCount), tone: "slate" },
          ]}
        />
      )}
      <JobsListTab />
    </>
  )
}
