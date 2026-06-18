import React from "react"
import { ClipboardList, CheckCircle2, Clock, FileText, Layers, ShieldCheck, MapPin } from "lucide-react"
import { listAllPlanningSets, listAudit } from "@/lib/admin/data"
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

export default async function AdminPlanningPage() {
  const [rows, audit] = await Promise.all([
    listAllPlanningSets(300),
    listAudit({ limit: 8 }),
  ])

  const active = rows.filter((r) => ["active", "in_progress", "live"].includes((r.status ?? "").toLowerCase())).length
  const draft = rows.filter((r) => (r.status ?? "").toLowerCase() === "draft").length
  const completed = rows.filter((r) => ["complete", "completed", "archived"].includes((r.status ?? "").toLowerCase())).length
  const workspaces = new Set(rows.map((r) => r.workspaceId)).size

  const profileMix: Record<string, number> = {}
  for (const r of rows) {
    const p = r.meta ?? "Unspecified"
    profileMix[p] = (profileMix[p] ?? 0) + 1
  }
  const topProfiles = Object.entries(profileMix).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const kpis: AdminKpi[] = [
    { label: "Planning sets", value: rows.length.toLocaleString("en-GB"), icon: ClipboardList, tone: "blue" },
    { label: "Active", value: active.toLocaleString("en-GB"), icon: Clock, tone: "amber" },
    { label: "Drafts", value: draft.toLocaleString("en-GB"), icon: FileText, tone: "slate" },
    { label: "Completed", value: completed.toLocaleString("en-GB"), icon: CheckCircle2, tone: "emerald" },
    { label: "Workspaces", value: workspaces.toLocaleString("en-GB"), icon: Layers, tone: "violet" },
  ]

  const auditEntries: AdminAuditEntry[] = audit.map((a) => ({
    actor: a.actorName ?? "System",
    action: `${a.action.replace(/[._]/g, " ")}${a.workspaceName ? ` · ${a.workspaceName}` : ""}`,
    when: timeAgo(a.createdAt),
  }))

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={ClipboardList}
        title="Planning — All Sets"
        subtitle="Read-only cross-workspace planning-set diagnostics for platform admin and support. Plans are owned by the originating workspace."
      />

      <AdminKpiStrip kpis={kpis} cols={5} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 space-y-4">
          <DiagnosticsBrowser rows={rows} primaryLabel="Planning set" metaLabel="Profile" icon={ClipboardList} />
        </div>

        <AdminRightRail>
          <AdminBanner tone="blue" icon={ShieldCheck} title="Diagnostics only.">
            This surface is read-only. Plans are edited by the owning workspace inside the app.
          </AdminBanner>

          <AdminSectionCard title="By profile" icon={MapPin}>
            {topProfiles.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-2">No planning sets yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {topProfiles.map(([label, count]) => {
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
