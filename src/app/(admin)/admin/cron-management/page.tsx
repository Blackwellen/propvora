import React from "react"
import { redirect } from "next/navigation"
import {
  ServerCog, CalendarClock, Activity, AlertTriangle, PlayCircle, ListChecks,
} from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import {
  AdminPageHeader, AdminKpiStrip, AdminSectionCard, AdminTabs, AdminBanner,
  AdminEmptyState, AdminNotConfigured, type AdminKpi,
} from "@/components/admin/ui"
import { getCronKpis, listCronRuns } from "@/lib/admin/pages/batch3"
import CronRunsTable from "./CronRunsTable"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUS_TABS = [
  { key: "", label: "Run history" },
  { key: "failed", label: "Failed jobs" },
  { key: "running", label: "Running" },
  { key: "success", label: "Succeeded" },
]

function num(n: number | null): string {
  return n == null ? "—" : n.toLocaleString("en-GB")
}

/**
 * Cron / scheduled-job management (manifest row 30, target path).
 *
 * Cross-tenant BY DESIGN — a platform admin oversees scheduled-job execution
 * across every workspace. Gated by the (admin) layout AND re-checked here
 * server-side (fail-closed). Manual run / pause / resume are dangerous, explicit
 * admin actions: they require confirmation and are written to the audit log
 * (see ./actions.ts + ./CronRunsTable.tsx). The engine run ledger is the honest
 * source of run history — there is no fabricated job state.
 */
export default async function AdminCronManagementPage({ searchParams }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const sp = await searchParams
  const status = sp.status || ""

  const [kpis, runs] = await Promise.all([
    getCronKpis(),
    listCronRuns({ status }),
  ])

  const kpiCards: AdminKpi[] = [
    { label: "Scheduled jobs", value: num(kpis.scheduledJobs), icon: CalendarClock, tone: "blue" },
    { label: "Recent runs", value: num(kpis.recentRuns), icon: Activity, tone: "violet" },
    { label: "Failed runs", value: num(kpis.failedRuns), icon: AlertTriangle, tone: kpis.failedRuns ? "red" : "emerald" },
    { label: "Currently running", value: num(kpis.runningJobs), icon: PlayCircle, tone: kpis.runningJobs ? "amber" : "slate" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Cron management"
        icon={ServerCog}
        breadcrumb={[{ label: "Operations" }, { label: "Cron management" }]}
        subtitle="Scheduled jobs, run history, failed-job recovery and manual reruns across the platform's automation runner."
      />

      {kpis.available && <AdminKpiStrip kpis={kpiCards} cols={4} />}

      <AdminBanner tone="slate" icon={ServerCog} title="Governance surface.">
        Run history is real recorded engine state across all workspaces. Manual run, pause and resume are explicit,
        recorded admin actions — each requires confirmation and is written to the audit log. Stuck or failed jobs are
        surfaced here for human recovery; nothing is auto-retried without an authorised request.
      </AdminBanner>

      <AdminSectionCard title="Scheduled-job run history" icon={ListChecks} viewAllHref="/admin/automations" viewAllLabel="Automation engine">
        <div className="mb-4">
          <AdminTabs tabs={STATUS_TABS} activeKey={status} />
        </div>

        {!runs.available ? (
          <AdminNotConfigured
            title="Job runner not provisioned"
            description="The automation_runs ledger is not present in this database yet. Scheduled-job run history will appear here once the automation runner is provisioned."
          />
        ) : runs.rows.length === 0 ? (
          <AdminEmptyState
            icon={CalendarClock}
            title={status ? "No runs in this state" : "No runs recorded yet"}
            description={status ? "Adjust the filter to see other runs." : "Scheduled-job runs across workspaces will appear here once the runner executes."}
          />
        ) : (
          <CronRunsTable rows={runs.rows} />
        )}
      </AdminSectionCard>
    </div>
  )
}
