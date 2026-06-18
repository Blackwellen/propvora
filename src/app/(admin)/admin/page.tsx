import React from "react"
import {
  LayoutDashboard, Building2, Activity, Store, UserCheck, BarChart3,
  AlertCircle, ShieldCheck, Users, TrendingUp, CreditCard, ShieldAlert,
  Database, ChevronRight, HeartPulse, Gauge,
} from "lucide-react"
import {
  AdminPageHeader, AdminKpiStrip, AdminCard, AdminSectionCard, AdminBanner,
  AdminStatusChip, AdminQueuePanel, AdminButtonLink, type AdminKpi,
} from "@/components/admin/ui"
import {
  getPlatformStats, listAudit, listWorkspaces, getDashboardTrends,
  getExtendedPlatformStats, listPendingVerifications, listOpenDisputes,
} from "@/lib/admin/data"
import DashboardCharts from "@/components/admin-dashboard/DashboardCharts"
import Link from "next/link"

export const dynamic = "force-dynamic"

function fmt(n: number | null): string {
  if (n === null) return "—"
  return n.toLocaleString("en-GB")
}
function fmtPence(n: number | null): string {
  if (n === null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n / 100)
}
function shortDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"
}
function planTone(plan: string): "violet" | "blue" | "amber" | "slate" {
  if (plan === "enterprise") return "violet"
  if (plan === "business" || plan === "pro") return "blue"
  if (plan === "trial") return "amber"
  return "slate"
}

export default async function AdminDashboardPage() {
  const [stats, extStats, recentWorkspaces, recentAudit, trends, pendingVerifs, openDisputes] = await Promise.all([
    getPlatformStats(),
    getExtendedPlatformStats(),
    listWorkspaces(6),
    listAudit({ limit: 7 }),
    getDashboardTrends(),
    listPendingVerifications(5),
    listOpenDisputes(5),
  ])

  const kpis: AdminKpi[] = [
    { label: "Workspaces", value: fmt(stats.workspaces), icon: Building2, tone: "blue", href: "/admin/workspaces" },
    { label: "Active", value: fmt(stats.workspacesActive), icon: Activity, tone: "emerald", href: "/admin/workspaces" },
    { label: "Users", value: fmt(stats.users), icon: Users, tone: "violet", href: "/admin/users" },
    { label: "Platform GMV", value: fmtPence(extStats.platformGmvPence), icon: BarChart3, tone: "emerald", href: "/admin/marketplace/oversight" },
    { label: "Open disputes", value: fmt(extStats.openDisputes), icon: AlertCircle, tone: "red", href: "/admin/marketplace/disputes" },
    { label: "Pending verifs", value: fmt(extStats.pendingVerifications), icon: ShieldCheck, tone: "amber", href: "/admin/supplier-verification" },
    { label: "Suppliers", value: fmt(extStats.activeSuppliers), icon: Store, tone: "sky", href: "/admin/suppliers" },
  ]

  const mrrUnknown = extStats.mrrPence === null || extStats.mrrPence === 0

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={LayoutDashboard}
        title="Platform Command Centre"
        subtitle={`Live platform overview — ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        actions={
          <>
            <AdminButtonLink href="/admin/audit-log" icon={ShieldAlert}>Audit log</AdminButtonLink>
            <AdminButtonLink href="/admin/health" variant="primary" icon={HeartPulse}>System health</AdminButtonLink>
          </>
        }
      />

      <AdminKpiStrip kpis={kpis} cols={7} />

      {/* Growth + plan-mix */}
      <DashboardCharts trends={trends} />

      {/* MRR / ARR honesty banner */}
      {mrrUnknown && (
        <AdminBanner tone="amber" icon={CreditCard} title="Revenue metrics (MRR / ARR / churn) are billing-dependent.">
          These figures require a live Stripe integration with populated <code className="font-mono">subscriptions</code> data and are
          intentionally not shown to avoid fabricated numbers. See{" "}
          <Link href="/admin/subscriptions" className="underline font-semibold">Subscriptions</Link> for current billing state.
        </AdminBanner>
      )}

      {/* Recent signups · recent admin events · verification queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AdminSectionCard title="Recent signups" icon={Building2} viewAllHref="/admin/workspaces" className="lg:col-span-1">
          {recentWorkspaces.length === 0 ? (
            <p className="text-[13px] text-slate-400 py-4">No workspaces yet.</p>
          ) : (
            <ul className="space-y-1 -mx-1.5">
              {recentWorkspaces.map((ws) => (
                <li key={ws.id}>
                  <Link href={`/admin/workspaces/${ws.id}`} className="flex items-center gap-3 px-1.5 py-2 rounded-lg hover:bg-slate-50">
                    <span className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#2563EB] text-[11px] font-bold flex items-center justify-center shrink-0">
                      {(ws.name ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#0B1B3F] truncate">{ws.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{ws.ownerName ?? ws.ownerEmail ?? "—"} · {shortDate(ws.createdAt)}</p>
                    </div>
                    <AdminStatusChip tone={planTone(ws.plan)}>{ws.plan}</AdminStatusChip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminSectionCard>

        <AdminSectionCard title="Recent admin events" icon={ShieldAlert} viewAllHref="/admin/audit-log">
          {recentAudit.length === 0 ? (
            <div className="text-center py-6">
              <Database className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-[12px] text-slate-400">No audit events recorded yet.</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {recentAudit.map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-mono font-medium text-slate-700 truncate">{ev.action}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {ev.actorName ?? ev.actorEmail ?? "system"}{ev.workspaceName ? ` · ${ev.workspaceName}` : ""}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{shortDate(ev.createdAt)}</span>
                </li>
              ))}
            </ol>
          )}
        </AdminSectionCard>

        <AdminQueuePanel title="Verification queue" icon={ShieldCheck} count={pendingVerifs.length} viewAllHref="/admin/supplier-verification">
          {pendingVerifs.length === 0 ? (
            <div className="text-center py-6">
              <ShieldCheck className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-[12px] text-slate-400">No pending verifications.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {pendingVerifs.map((v) => (
                <li key={v.workspaceId} className="flex items-center gap-3 py-1.5">
                  <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-[#0B1B3F] truncate">{v.businessName ?? v.workspaceName ?? v.workspaceId.slice(0, 8)}</p>
                    <p className="text-[11px] text-slate-400">{shortDate(v.submittedAt)}</p>
                  </div>
                  <Link href={`/admin/supplier-verification?workspace=${v.workspaceId}`} className="text-[12px] font-semibold text-[#2563EB] hover:underline shrink-0">Review</Link>
                </li>
              ))}
            </ul>
          )}
        </AdminQueuePanel>
      </div>

      {/* Open disputes · platform health · risk · system health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AdminQueuePanel title="Open disputes" icon={AlertCircle} count={openDisputes.length} viewAllHref="/admin/marketplace/disputes">
          {openDisputes.length === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-[12px] text-slate-400">No open disputes.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {openDisputes.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-1.5">
                  <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-[#0B1B3F] truncate">{d.reason ?? "Dispute"} — {d.raisedByWorkspaceName ?? d.id.slice(0, 8)}</p>
                    <p className="text-[11px] text-slate-400">{shortDate(d.createdAt)}</p>
                  </div>
                  <AdminStatusChip tone={d.status === "open" ? "red" : "amber"}>{d.status.replace("_", " ")}</AdminStatusChip>
                </li>
              ))}
            </ul>
          )}
        </AdminQueuePanel>

        <AdminSectionCard title="Platform health" icon={Gauge}>
          <dl className="space-y-2.5">
            {[
              { label: "Active workspaces", value: fmt(stats.workspacesActive), tone: "emerald" as const },
              { label: "Suspended", value: fmt(stats.workspacesSuspended), tone: "red" as const },
              { label: "Operators", value: fmt(extStats.activeOperators), tone: "blue" as const },
              { label: "Customers", value: fmt(extStats.activeCustomers), tone: "sky" as const },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <dt className="text-[13px] text-slate-500">{r.label}</dt>
                <dd className="text-[13px] font-semibold text-[#0B1B3F]">{r.value}</dd>
              </div>
            ))}
          </dl>
        </AdminSectionCard>

        <AdminSectionCard title="Platform footprint" icon={TrendingUp}>
          <dl className="space-y-2.5">
            {[
              { label: "Properties", value: fmt(stats.properties), href: "/admin/portfolios" },
              { label: "Contacts", value: fmt(stats.contacts), href: "/admin/work" },
              { label: "Tasks", value: fmt(stats.tasks), href: "/admin/work" },
              { label: "Audit events", value: fmt(stats.auditEvents), href: "/admin/audit-log" },
              { label: "MRR", value: mrrUnknown ? "—" : fmtPence(extStats.mrrPence), href: "/admin/subscriptions" },
            ].map((r) => (
              <Link key={r.label} href={r.href} className="flex items-center justify-between group">
                <dt className="text-[13px] text-slate-500 group-hover:text-slate-700">{r.label}</dt>
                <dd className="text-[13px] font-semibold text-[#0B1B3F] flex items-center gap-1">{r.value}<ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" /></dd>
              </Link>
            ))}
          </dl>
        </AdminSectionCard>
      </div>
    </div>
  )
}
