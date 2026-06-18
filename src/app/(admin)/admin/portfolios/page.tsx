import React from "react"
import { Building2, CheckCircle2, Home, MapPin, Layers, ShieldCheck, Activity } from "lucide-react"
import { listAllProperties, listAudit } from "@/lib/admin/data"
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
import DiagnosticsBrowser from "./DiagnosticsBrowser"

export const dynamic = "force-dynamic"

function timeAgo(iso: string | null): string {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function AdminPortfoliosPage() {
  const [rows, audit] = await Promise.all([
    listAllProperties(300),
    listAudit({ limit: 8 }),
  ])

  const occupied = rows.filter((r) => (r.status ?? "").toLowerCase() === "occupied").length
  const vacant = rows.filter((r) => (r.status ?? "").toLowerCase() === "vacant").length
  const occupancy = rows.length ? Math.round((occupied / rows.length) * 100) : 0

  // Type mix (template) for the right rail.
  const typeMix: Record<string, number> = {}
  for (const r of rows) {
    const t = r.meta ?? "Unspecified"
    typeMix[t] = (typeMix[t] ?? 0) + 1
  }
  const topTypes = Object.entries(typeMix).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Distinct workspaces represented.
  const workspaces = new Set(rows.map((r) => r.workspaceId)).size

  const kpis: AdminKpi[] = [
    { label: "Total properties", value: rows.length.toLocaleString("en-GB"), icon: Building2, tone: "blue" },
    { label: "Occupied", value: occupied.toLocaleString("en-GB"), icon: CheckCircle2, tone: "emerald", sub: `${occupancy}% of stock` },
    { label: "Vacant", value: vacant.toLocaleString("en-GB"), icon: Home, tone: "amber" },
    { label: "Workspaces", value: workspaces.toLocaleString("en-GB"), icon: Layers, tone: "violet" },
    { label: "Locations", value: new Set(rows.map((r) => r.secondary).filter(Boolean)).size.toLocaleString("en-GB"), icon: MapPin, tone: "sky" },
  ]

  const auditEntries: AdminAuditEntry[] = audit.map((a) => ({
    actor: a.actorName ?? "System",
    action: `${a.action.replace(/[._]/g, " ")}${a.workspaceName ? ` · ${a.workspaceName}` : ""}`,
    when: timeAgo(a.createdAt),
  }))

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Building2}
        title="Portfolios — All Properties"
        subtitle="Read-only cross-workspace property diagnostics for platform admin and support. No tenant or owner data is editable here."
      />

      <AdminKpiStrip kpis={kpis} cols={5} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-2 space-y-4">
          <DiagnosticsBrowser rows={rows} primaryLabel="Property" metaLabel="Type" icon={Building2} />
        </div>

        <AdminRightRail>
          <AdminBanner tone="blue" icon={ShieldCheck} title="Diagnostics only.">
            This surface is read-only. Property edits are made by the owning workspace inside the app.
          </AdminBanner>

          <AdminSectionCard title="Property types" icon={Layers}>
            {topTypes.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-2">No properties yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {topTypes.map(([label, count]) => {
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
