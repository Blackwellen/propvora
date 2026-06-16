import React from "react"
import Link from "next/link"
import {
  Users, Building2, Home, Contact, ListChecks, FileText, ChevronRight,
  Activity, ShieldAlert, CreditCard, Ban, Database,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { getPlatformStats, listAudit, listWorkspaces, getDashboardTrends } from "@/lib/admin/data"
import DashboardCharts from "@/components/admin-dashboard/DashboardCharts"

export const dynamic = "force-dynamic"

function fmt(n: number | null): string {
  if (n === null) return "—"
  return n.toLocaleString("en-GB")
}

function planBadge(plan: string) {
  if (plan === "enterprise")   return <Badge variant="ai" size="sm">Enterprise</Badge>
  if (plan === "business")     return <Badge variant="primary" size="sm">Business</Badge>
  if (plan === "pro")          return <Badge variant="primary" size="sm">Pro</Badge>
  if (plan === "trial")        return <Badge variant="warning" size="sm">Trial</Badge>
  return <Badge variant="default" size="sm">{plan}</Badge>
}

export default async function AdminDashboardPage() {
  const [stats, recentWorkspaces, recentAudit, trends] = await Promise.all([
    getPlatformStats(),
    listWorkspaces(6),
    listAudit({ limit: 8 }),
    getDashboardTrends(),
  ])

  const kpis: Array<{ label: string; value: string; icon: React.ElementType; colour: string; bg: string; href: string }> = [
    { label: "Workspaces",       value: fmt(stats.workspaces),         icon: Building2,  colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]", href: "/admin/workspaces" },
    { label: "Active",           value: fmt(stats.workspacesActive),   icon: Activity,   colour: "text-[#10B981]", bg: "bg-[#ECFDF5]", href: "/admin/workspaces" },
    { label: "Suspended",        value: fmt(stats.workspacesSuspended),icon: Ban,        colour: "text-[#EF4444]", bg: "bg-[#FEF2F2]", href: "/admin/workspaces" },
    { label: "Users",            value: fmt(stats.users),              icon: Users,      colour: "text-[#7C3AED]", bg: "bg-[#F5F3FF]", href: "/admin/users" },
    { label: "Properties",       value: fmt(stats.properties),         icon: Home,       colour: "text-[#0284c7]", bg: "bg-[#f0f9ff]", href: "/admin/portfolios" },
    { label: "Contacts",         value: fmt(stats.contacts),           icon: Contact,    colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]", href: "/admin/work" },
    { label: "Tasks",            value: fmt(stats.tasks),              icon: ListChecks, colour: "text-[#d97706]", bg: "bg-[#FFFBEB]", href: "/admin/work" },
    { label: "Audit Events",     value: fmt(stats.auditEvents),        icon: FileText,   colour: "text-slate-600", bg: "bg-slate-100", href: "/admin/audit" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Command Centre</h1>
          <p className="text-sm text-slate-500">
            Live platform overview — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/audit"><Button variant="outline" size="sm"><FileText className="w-4 h-4" /> Audit Log</Button></Link>
          <Link href="/admin/health"><Button variant="ghost" size="sm"><Activity className="w-4 h-4" /> Health</Button></Link>
        </div>
      </div>

      {/* KPI Row — all live, clickable to filtered views */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link key={kpi.label} href={kpi.href}>
              <Card className="p-3 hover:border-[#BFDBFE] hover:shadow-sm transition-all h-full">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", kpi.bg)}>
                  <Icon className={cn("w-4 h-4", kpi.colour)} />
                </div>
                <p className={cn("text-lg font-bold leading-none", kpi.colour)}>{kpi.value}</p>
                <p className="text-[10px] font-medium text-slate-600 mt-1">{kpi.label}</p>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Growth + plan-mix charts — real series from created_at + plan/status */}
      <DashboardCharts trends={trends} />

      {/* Billing note — honest, no fabricated MRR */}
      <Card className="p-4 border-amber-200 bg-[#FFFBEB]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Revenue metrics (MRR / ARR / churn) are billing-dependent</p>
            <p className="text-xs text-amber-700 mt-0.5">
              These figures require a live Stripe billing integration and populated <code className="font-mono">subscriptions</code> data.
              They are intentionally not shown to avoid displaying fabricated numbers. See{" "}
              <Link href="/admin/subscriptions" className="underline font-medium">Subscriptions</Link> for current billing data.
            </p>
          </div>
        </div>
      </Card>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent workspaces */}
        <div className="lg:col-span-2">
          <Card noPadding>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-slate-900">Recent Workspaces</h3>
              <Link href="/admin/workspaces"><Button variant="ghost" size="xs">View all</Button></Link>
            </div>
            <div className="overflow-x-auto">
              {recentWorkspaces.length === 0 ? (
                <div className="text-center py-10">
                  <Building2 className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No workspaces yet</p>
                </div>
              ) : (
                <>
                {/* Mobile card list */}
                <ul className="lg:hidden divide-y divide-[#F1F5F9]" role="list">
                  {recentWorkspaces.map((ws) => (
                    <li key={ws.id}>
                      <Link href={`/admin/workspaces/${ws.id}`} className="flex items-center gap-3 p-3.5 hover:bg-slate-50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{ws.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{ws.ownerName ?? ws.ownerEmail ?? "—"}</p>
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                            {planBadge(ws.plan)}
                            <span>{ws.memberCount} members</span>
                            <span>· {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {/* Desktop table */}
                <table className="hidden lg:table w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      {["Workspace", "Owner", "Plan", "Members", "Created", ""].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-slate-400 px-4 py-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {recentWorkspaces.map((ws) => (
                      <tr key={ws.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs font-medium text-slate-800">{ws.name}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">{ws.ownerName ?? ws.ownerEmail ?? "—"}</td>
                        <td className="px-4 py-2">{planBadge(ws.plan)}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">{ws.memberCount}</td>
                        <td className="px-4 py-2 text-xs text-slate-400 whitespace-nowrap">
                          {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </td>
                        <td className="px-4 py-2">
                          <Link href={`/admin/workspaces/${ws.id}`}>
                            <Button variant="ghost" size="xs"><ChevronRight className="w-3.5 h-3.5" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Recent audit events */}
        <div className="space-y-4">
          <Card noPadding>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#2563EB]" /> Recent Admin Events
              </h3>
              <Link href="/admin/audit"><Button variant="ghost" size="xs">All</Button></Link>
            </div>
            <CardContent className="pt-3">
              {recentAudit.length === 0 ? (
                <div className="text-center py-6">
                  <Database className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No audit events recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentAudit.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-2.5 py-1.5 border-b border-slate-50 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                        <Activity className="w-3 h-3 text-[#2563EB]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-medium text-slate-700 truncate">{ev.action}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {ev.actorName ?? ev.actorEmail ?? "system"}
                          {ev.workspaceName ? ` · ${ev.workspaceName}` : ""}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {ev.createdAt ? new Date(ev.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
