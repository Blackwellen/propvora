import React from "react"
import { Bug, AlertTriangle, Loader2, ShieldAlert, CheckCircle2, Layers } from "lucide-react"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminSectionCard,
  AdminBarChart,
  AdminNotConfigured,
  type AdminKpi,
} from "@/components/admin/ui"
import { getBugReportsData } from "@/lib/admin/pages/batch4"
import BugReportsClient from "./BugReportsClient"

export const dynamic = "force-dynamic"
export const metadata = { title: "Bug reports — Propvora admin" }

export default async function AdminBugReportsPage() {
  const data = await getBugReportsData(200)

  const kpis: AdminKpi[] = [
    { label: "Total reports", value: data.kpis.total, icon: Bug, tone: "blue" },
    { label: "In progress", value: data.kpis.inProgress, icon: Loader2, tone: "amber" },
    { label: "Critical", value: data.kpis.critical, icon: ShieldAlert, tone: "red" },
    { label: "Resolved", value: data.kpis.resolved, icon: CheckCircle2, tone: "emerald" },
    { label: "New / open", value: data.kpis.open, icon: AlertTriangle, tone: "sky" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Bug}
        title="Bug reports"
        subtitle="Captured client errors and user-submitted reports across all workspaces. Triage by severity and status. No stack traces or secrets are stored."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Operations" }, { label: "Bug reports" }]}
      />

      {data.notConfigured ? (
        <AdminNotConfigured
          title="bug_reports table not provisioned"
          description="Apply the bug_reports migration to enable the bug inbox. Client error-boundary captures and user-submitted reports will appear here."
        />
      ) : (
        <>
          <AdminKpiStrip kpis={kpis} cols={5} />
          <BugReportsClient rows={data.rows} />
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminSectionCard title="By severity" icon={ShieldAlert}>
              {data.bySeverity.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-6 text-center">No data yet.</p>
              ) : (
                <AdminBarChart data={data.bySeverity.map((d) => ({ label: d.label, value: d.value }))} tone="red" />
              )}
            </AdminSectionCard>
            <AdminSectionCard title="By status" icon={Layers}>
              {data.byStatus.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-6 text-center">No data yet.</p>
              ) : (
                <AdminBarChart data={data.byStatus.map((d) => ({ label: d.label, value: d.value }))} tone="blue" />
              )}
            </AdminSectionCard>
          </div>
        </>
      )}
    </div>
  )
}
