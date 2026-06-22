import React from "react"
import { redirect } from "next/navigation"
import {
  Gauge, Activity, Sparkles, Webhook, AlertTriangle, Building2, History, HardDrive,
} from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import {
  AdminPageHeader, AdminKpiStrip, AdminSectionCard, AdminTable, AdminStatusChip,
  AdminEmptyState, AdminNotConfigured, AdminBanner, AdminSearchInput, AdminTabs,
  AdminAuditTrailPanel, type AdminKpi, type AdminTone, type AdminAuditEntry,
} from "@/components/admin/ui"
import {
  getAutomationUsageKpis, listAutomationUsageLimits, listAutomationLimitAudit, shortId,
} from "@/lib/admin/pages/batch3"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

const STATUS_TABS = [
  { key: "", label: "All workspaces" },
  { key: "Healthy", label: "Healthy" },
  { key: "Approaching", label: "Approaching" },
  { key: "Over", label: "Over limit" },
]

function num(n: number | null): string {
  return n == null ? "—" : n.toLocaleString("en-GB")
}

function limit(n: number | null): string {
  return n == null ? "∞" : n.toLocaleString("en-GB")
}

function statusTone(status: string): AdminTone {
  const s = status.toLowerCase()
  if (s === "healthy") return "emerald"
  if (s === "approaching" || s === "warning") return "amber"
  if (s === "over" || s === "exceeded") return "red"
  return "slate"
}

function fmtWhen(iso: string | null): string {
  if (!iso) return "—"
  try { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) }
  catch { return "—" }
}

/**
 * Automation usage caps oversight (manifest row 29, target path).
 *
 * Cross-tenant BY DESIGN — a platform admin oversees automation quotas, AI limits
 * and overage across every workspace. Gated by the (admin) layout AND re-checked
 * here server-side (fail-closed). Read-only oversight: limit changes are made in
 * the per-workspace automation settings and recorded in the audit trail below.
 */
export default async function AdminAutomationUsagePage({ searchParams }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/bw-console-x9f3")

  const sp = await searchParams
  const status = sp.status || ""
  const q = sp.q || ""

  const [kpis, limits, audit] = await Promise.all([
    getAutomationUsageKpis(),
    listAutomationUsageLimits({ q, status }),
    listAutomationLimitAudit(15),
  ])

  const kpiCards: AdminKpi[] = [
    { label: "Tracked workspaces", value: num(kpis.trackedWorkspaces), icon: Building2, tone: "blue" },
    { label: "Automation runs", value: num(kpis.totalRuns), icon: Activity, tone: "violet", sub: "recorded total" },
    { label: "AI credits used", value: num(kpis.totalAiCredits), icon: Sparkles, tone: "sky" },
    { label: "Webhook volume", value: num(kpis.totalWebhooks), icon: Webhook, tone: "emerald" },
    { label: "Over / at limit", value: num(kpis.overageWorkspaces), icon: AlertTriangle, tone: kpis.overageWorkspaces ? "red" : "emerald" },
  ]

  const auditEntries: AdminAuditEntry[] = audit.rows.map((r) => ({
    actor: r.actor ?? "System",
    action: `${r.action.replace(/[._]/g, " ")}${r.workspaceName ? ` · ${r.workspaceName}` : ""}`,
    when: fmtWhen(r.createdAt),
    tone: "violet",
  }))

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Automation usage caps"
        icon={Gauge}
        breadcrumb={[{ label: "Automations", href: "/admin/automations" }, { label: "Usage caps" }]}
        subtitle="Cross-workspace automation quotas, AI limits, webhook throttles, overage alerts and the limit-change audit trail."
      />

      {kpis.available && <AdminKpiStrip kpis={kpiCards} cols={5} />}

      <AdminBanner tone="slate" icon={Gauge} title="Real recorded usage.">
        Every figure is real recorded automation usage across all workspaces. Caps gate VOLUME; access is gated upstream
        by plan entitlements. Payment and legal nodes can never auto-run regardless of quota — they always require an approval.
        Limit changes are explicit, recorded actions shown in the audit trail.
      </AdminBanner>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <AdminSectionCard title="Workspace caps & quotas" icon={Gauge} className="xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AdminTabs tabs={STATUS_TABS} activeKey={status} className="sm:max-w-[60%]" />
            <AdminSearchInput placeholder="Search workspace…" className="sm:w-56" />
          </div>

          {!limits.available ? (
            <AdminNotConfigured
              title="Automation caps not provisioned"
              description="The automation_usage_limits table is not present in this database yet. Per-workspace caps will appear here once the automations subsystem is provisioned."
            />
          ) : limits.rows.length === 0 ? (
            <AdminEmptyState
              icon={Gauge}
              title={status || q ? "No workspaces match" : "No caps configured"}
              description={status || q ? "Adjust the filters to widen the search." : "Per-workspace automation caps will appear here once configured."}
            />
          ) : (
            <AdminTable
              minWidth={760}
              head={[
                { label: "Workspace" }, { label: "Plan" },
                { label: "Runs", align: "right" }, { label: "AI credits", align: "right" },
                { label: "Webhooks", align: "right" }, { label: "Storage GB", align: "right" },
                { label: "Status" },
              ]}
            >
              {limits.rows.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAFCFF]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#0B1B3F] truncate max-w-[180px]">{r.workspaceName ?? "Workspace"}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{shortId(r.workspaceId)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.plan ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{limit(r.runsLimit)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{limit(r.aiCreditsLimit)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{limit(r.webhooksLimit)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{limit(r.storageLimitGb)}</td>
                  <td className="px-4 py-3"><AdminStatusChip tone={statusTone(r.status)} dot>{r.status}</AdminStatusChip></td>
                </tr>
              ))}
            </AdminTable>
          )}
        </AdminSectionCard>

        <div className="space-y-4">
          <AdminSectionCard title="Overage alerts" icon={AlertTriangle}>
            <div className="flex items-center gap-3">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${kpis.overageWorkspaces ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[26px] font-bold text-[#0B1B3F] leading-none">{num(kpis.overageWorkspaces)}</p>
                <p className="text-[12px] text-slate-500">workspaces over / at limit</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-[12.5px] text-slate-600">
              <li className="flex items-center justify-between"><span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-slate-400" /> Storage limits</span><AdminStatusChip tone="slate">tracked</AdminStatusChip></li>
              <li className="flex items-center justify-between"><span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-sky-400" /> AI credit limits</span><AdminStatusChip tone="slate">tracked</AdminStatusChip></li>
            </ul>
          </AdminSectionCard>

          <AdminAuditTrailPanel
            title="Limit-change audit"
            entries={auditEntries}
            viewAllHref="/admin/audit-log"
          />
          {!audit.available && (
            <p className="text-[11px] text-slate-400 -mt-2 px-1 flex items-center gap-1"><History className="w-3 h-3" /> Audit table not provisioned yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
