import React from "react"
import Link from "next/link"
import {
  UserCheck, Building2, Info, Users, Activity, Clock3, AlertTriangle,
  Crown, ChevronRight, TrendingUp,
} from "lucide-react"
import {
  AdminPageHeader, AdminKpiStrip, AdminCard, AdminSectionCard, AdminBanner,
  AdminTable, AdminStatusChip, AdminFilterBar, AdminSearchInput, AdminActionMenu,
  AdminEmptyState, AdminTabs, type AdminKpi, type AdminTab, type AdminTone,
} from "@/components/admin/ui"
import { listCustomers } from "@/lib/admin/data"
import { getCustomerKpis } from "@/lib/admin/pages/batch1"

export const dynamic = "force-dynamic"

interface PageProps { searchParams: Promise<{ q?: string; plan?: string; status?: string }> }

function planTone(plan: string): AdminTone {
  if (plan === "enterprise") return "violet"
  if (plan === "business" || plan === "pro") return "blue"
  if (plan === "trial") return "amber"
  return "slate"
}
function statusTone(status: string): AdminTone {
  if (status === "active") return "emerald"
  if (status === "trial" || status === "trialing") return "amber"
  if (status === "past_due") return "red"
  if (status === "suspended" || status === "canceled") return "slate"
  return "slate"
}
function shortDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = (sp.q ?? "").toLowerCase().trim()
  const planFilter = sp.plan ?? "all"
  const statusFilter = sp.status ?? "all"

  const [{ rows: allRows }, kpis] = await Promise.all([listCustomers(), getCustomerKpis()])

  const rows = allRows.filter((c) => {
    if (q && !(`${c.name ?? ""} ${c.email ?? ""} ${c.primaryWorkspaceName}`.toLowerCase().includes(q))) return false
    if (planFilter !== "all" && c.plan !== planFilter) return false
    if (statusFilter !== "all" && c.planStatus !== statusFilter) return false
    return true
  })

  const kpiCards: AdminKpi[] = [
    { label: "Total customers", value: kpis.total.toLocaleString("en-GB"), icon: Users, tone: "blue" },
    { label: "Active", value: kpis.active.toLocaleString("en-GB"), icon: Activity, tone: "emerald" },
    { label: "Trialing", value: kpis.trialing.toLocaleString("en-GB"), icon: Clock3, tone: "amber" },
    { label: "Churn risk", value: kpis.churnRisk.toLocaleString("en-GB"), icon: AlertTriangle, tone: "red" },
    { label: "Workspaces", value: kpis.workspaces.toLocaleString("en-GB"), icon: Building2, tone: "violet" },
    { label: "Enterprise accounts", value: kpis.enterprise.toLocaleString("en-GB"), icon: Crown, tone: "sky" },
  ]

  const planTabs: AdminTab[] = [
    { key: "all", label: "All plans", href: buildHref(sp, { plan: undefined }) },
    { key: "trial", label: "Trial", href: buildHref(sp, { plan: "trial" }) },
    { key: "pro", label: "Pro", href: buildHref(sp, { plan: "pro" }) },
    { key: "business", label: "Business", href: buildHref(sp, { plan: "business" }) },
    { key: "enterprise", label: "Enterprise", href: buildHref(sp, { plan: "enterprise" }) },
  ]
  const statusTabs: AdminTab[] = [
    { key: "all", label: "Any status", href: buildHref(sp, { status: undefined }) },
    { key: "active", label: "Active", href: buildHref(sp, { status: "active" }) },
    { key: "trial", label: "Trial", href: buildHref(sp, { status: "trial" }) },
    { key: "suspended", label: "Suspended", href: buildHref(sp, { status: "suspended" }) },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={UserCheck}
        title="Customers"
        subtitle={`${kpis.total.toLocaleString("en-GB")} customer accounts · derived from workspace owners`}
      />

      <AdminKpiStrip kpis={kpiCards} cols={6} />

      <AdminBanner tone="blue" icon={Info} title="Derived view.">
        There is no dedicated <code className="font-mono">platform_customers</code> CRM table yet, so this is derived from real data —
        each workspace owner is treated as one customer account. It is not a fabricated customer list.
      </AdminBanner>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <AdminCard padded={false}>
          <div className="p-4 border-b border-[#EEF3FB] space-y-3">
            <AdminFilterBar className="mb-0">
              <AdminSearchInput placeholder="Search customers, email, workspace…" className="w-full sm:w-72" />
            </AdminFilterBar>
            <div className="flex flex-wrap gap-3">
              <AdminTabs tabs={planTabs} activeKey={planFilter} />
              <AdminTabs tabs={statusTabs} activeKey={statusFilter} />
            </div>
          </div>

          {rows.length === 0 ? (
            <AdminEmptyState
              icon={UserCheck}
              title="No customers match"
              description={allRows.length === 0 ? "Customer accounts appear as workspaces are created." : "Try clearing your search or filters."}
            />
          ) : (
            <>
              <AdminTable head={[
                { label: "Customer" }, { label: "Workspaces", align: "center" }, { label: "Plan" },
                { label: "Status" }, { label: "Since" }, { label: "", align: "right" },
              ]} minWidth={760}>
                {rows.map((c) => (
                  <tr key={c.ownerId} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/customers/${c.ownerId}`} className="flex items-center gap-2.5 group">
                        <span className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#2563EB] text-[11px] font-bold flex items-center justify-center shrink-0">
                          {(c.name ?? c.email ?? "?").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{c.name ?? c.primaryWorkspaceName}</span>
                          <span className="block text-[11px] text-slate-400 truncate">{c.email ?? "—"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-center text-[13px] text-slate-600">{c.workspaceCount}</td>
                    <td className="px-4 py-2.5"><AdminStatusChip tone={planTone(c.plan)}>{c.plan}</AdminStatusChip></td>
                    <td className="px-4 py-2.5"><AdminStatusChip tone={statusTone(c.planStatus)} dot>{c.planStatus}</AdminStatusChip></td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-400 whitespace-nowrap">{shortDate(c.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <AdminActionMenu actions={[
                        { label: "View customer", href: `/admin/customers/${c.ownerId}` },
                        { label: "View user", href: `/admin/users/${c.ownerId}` },
                        { label: "Primary workspace", href: `/admin/workspaces/${c.primaryWorkspaceId}` },
                      ]} />
                    </td>
                  </tr>
                ))}
              </AdminTable>
              <div className="px-4 py-2.5 border-t border-[#EEF3FB] text-[12px] text-slate-500">
                Showing {rows.length} of {allRows.length} customer{allRows.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </AdminCard>

        {/* Right rail */}
        <div className="space-y-4">
          <AdminSectionCard title="Plan mix" icon={TrendingUp}>
            {kpis.planMix.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-2">No plan data yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {kpis.planMix.map((p) => {
                  const pct = kpis.workspaces ? Math.round((p.value / kpis.workspaces) * 100) : 0
                  return (
                    <li key={p.label}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="capitalize text-slate-600">{p.label}</span>
                        <span className="font-semibold text-[#0B1B3F]">{p.value} <span className="text-slate-400 font-normal">· {pct}%</span></span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Churn risk" icon={AlertTriangle}>
            <p className="text-[26px] font-bold text-[#0B1B3F] leading-none">{kpis.churnRisk}</p>
            <p className="mt-1.5 text-[12px] text-slate-500">accounts past-due, suspended or cancelled.</p>
            <Link href={buildHref(sp, { status: "suspended" })} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
              Review at-risk <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </AdminSectionCard>

          <AdminSectionCard title="New customers" icon={UserCheck}>
            <p className="text-[26px] font-bold text-emerald-600 leading-none">+{kpis.newThisMonth}</p>
            <p className="mt-1.5 text-[12px] text-slate-500">new customer accounts this month.</p>
          </AdminSectionCard>
        </div>
      </div>
    </div>
  )
}

function buildHref(
  current: { q?: string; plan?: string; status?: string },
  patch: Partial<{ plan?: string; status?: string }>,
): string {
  const params = new URLSearchParams()
  if (current.q) params.set("q", current.q)
  const plan = "plan" in patch ? patch.plan : current.plan
  const status = "status" in patch ? patch.status : current.status
  if (plan && plan !== "all") params.set("plan", plan)
  if (status && status !== "all") params.set("status", status)
  const qs = params.toString()
  return qs ? `/admin/customers?${qs}` : "/admin/customers"
}
