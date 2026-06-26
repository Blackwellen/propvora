import React from "react"
import { CheckSquare, AlertTriangle, Clock, Flame, CheckCircle2, Layers, ShieldCheck } from "lucide-react"
import { listAllTasks, listAudit } from "@/lib/admin/data"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminRightRail,
  AdminSectionCard,
  AdminAuditTrailPanel,
  AdminBanner,
  type AdminKpi,
  type AdminAuditEntry,
} from "@/components/admin/ui"
import DiagnosticsBrowser from "../portfolios/DiagnosticsBrowser"

export const dynamic = "force-dynamic"

function timeAgo(iso: string | null): string {
  if (!iso) return "—"
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function AdminWorkPage() {
  const [rows, audit] = await Promise.all([
    listAllTasks(300),
    listAudit({ limit: 8 }),
  ])

  const s = (v: string) => (x: { status: string | null }) => (x.status ?? "").toLowerCase() === v
  const open = rows.filter((r) => !["done", "completed", "closed", "cancelled"].includes((r.status ?? "").toLowerCase())).length
  const inProgress = rows.filter(s("in_progress")).length
  const completed = rows.filter((r) => ["done", "completed", "closed"].includes((r.status ?? "").toLowerCase())).length
  const highPriority = rows.filter((r) => ["high", "urgent", "critical"].includes((r.meta ?? "").toLowerCase())).length
  const blocked = rows.filter((r) => ["blocked", "overdue"].includes((r.status ?? "").toLowerCase())).length

  const priorityMix: Record<string, number> = {}
  for (const r of rows) {
    const p = r.meta ?? "Unset"
    priorityMix[p] = (priorityMix[p] ?? 0) + 1
  }
  const topPriorities = Object.entries(priorityMix).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const kpis: AdminKpi[] = [
    { label: "Open tasks", value: open.toLocaleString("en-GB"), icon: CheckSquare, tone: "blue" },
    { label: "In progress", value: inProgress.toLocaleString("en-GB"), icon: Clock, tone: "amber" },
    { label: "High priority", value: highPriority.toLocaleString("en-GB"), icon: Flame, tone: "red" },
    { label: "Blocked / overdue", value: blocked.toLocaleString("en-GB"), icon: AlertTriangle, tone: "violet" },
    { label: "Completed", value: completed.toLocaleString("en-GB"), icon: CheckCircle2, tone: "emerald" },
  ]

  const auditEntries: AdminAuditEntry[] = audit.map((a) => ({
    actor: a.actorName ?? "System",
    action: `${a.action.replace(/[._]/g, " ")}${a.workspaceName ? ` · ${a.workspaceName}` : ""}`,
    when: timeAgo(a.createdAt),
  }))

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={CheckSquare}
        title="Work — All Tasks"
        subtitle="Read-only cross-workspace task diagnostics for platform admin and support. Tasks are managed by the owning workspace."
      />

      <AdminKpiStrip kpis={kpis} cols={5} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 space-y-4">
          <DiagnosticsBrowser rows={rows} primaryLabel="Task" metaLabel="Priority" iconKey="task" />
        </div>

        <AdminRightRail>
          <AdminBanner tone="blue" icon={ShieldCheck} title="Diagnostics only.">
            This surface is read-only. Task changes are made by the owning workspace inside the app.
          </AdminBanner>

          <AdminSectionCard title="By priority" icon={Layers}>
            {topPriorities.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-2">No tasks yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {topPriorities.map(([label, count]) => {
                  const pct = rows.length ? Math.round((count / rows.length) * 100) : 0
                  return (
                    <li key={label}>
                      <div className="flex items-center justify-between text-[12.5px] mb-1">
                        <span className="font-medium text-slate-600 capitalize">{label.replace(/_/g, " ")}</span>
                        <span className="text-slate-400">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </AdminSectionCard>

          <AdminAuditTrailPanel title="Recent platform events" entries={auditEntries} viewAllHref="/admin/audit" />
        </AdminRightRail>
      </div>
    </div>
  )
}
