import React from "react"
import Link from "next/link"
import {
  Building2, Activity, Clock3, Ban, TrendingUp, ChevronRight, Users, Sparkles,
} from "lucide-react"
import {
  AdminPageHeader, AdminKpiStrip, AdminCard, AdminSectionCard, AdminTable,
  AdminStatusChip, AdminSearchInput, AdminActionMenu, AdminEmptyState,
  AdminTabs, type AdminKpi, type AdminTab, type AdminTone,
} from "@/components/admin/ui"
import { listWorkspaces, listUserPicks } from "@/lib/admin/data"
import { getWorkspaceKpis } from "@/lib/admin/pages/batch1"
import CreateWorkspaceWizard from "@/components/admin-workspaces/CreateWorkspaceWizard"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 25

interface PageProps { searchParams: Promise<{ q?: string; status?: string; plan?: string; page?: string }> }

function planTone(plan: string): AdminTone {
  if (plan === "enterprise") return "violet"
  if (plan === "business" || plan === "pro") return "blue"
  if (plan === "basic") return "sky"
  if (plan === "trial") return "amber"
  return "slate"
}
function statusTone(status: string): AdminTone {
  if (status === "active") return "emerald"
  if (status === "trialing" || status === "trial") return "amber"
  if (status === "suspended" || status === "past_due") return "red"
  return "slate"
}
function shortDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}
function fmt(n: number | null) { return n === null ? "—" : n.toLocaleString("en-GB") }

export default async function AdminWorkspacesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = (sp.q ?? "").toLowerCase().trim()
  const statusFilter = sp.status ?? "all"
  const planFilter = sp.plan ?? "all"
  const page = Math.max(1, Number(sp.page ?? "1") || 1)

  const [allWorkspaces, users, kpis] = await Promise.all([
    listWorkspaces(500),
    listUserPicks(200),
    getWorkspaceKpis(),
  ])

  const filtered = allWorkspaces.filter((w) => {
    if (q && !(`${w.name} ${w.ownerName ?? ""} ${w.ownerEmail ?? ""}`.toLowerCase().includes(q))) return false
    if (statusFilter !== "all" && w.planStatus !== statusFilter) return false
    if (planFilter !== "all" && w.plan !== planFilter) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clamped = Math.min(page, totalPages)
  const pageRows = filtered.slice((clamped - 1) * PAGE_SIZE, clamped * PAGE_SIZE)

  const topByMembers = [...allWorkspaces].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5)

  const kpiCards: AdminKpi[] = [
    { label: "Total workspaces", value: fmt(kpis.total), icon: Building2, tone: "blue" },
    { label: "Active", value: fmt(kpis.active), icon: Activity, tone: "emerald" },
    { label: "Trialing", value: fmt(kpis.trialing), icon: Clock3, tone: "amber" },
    { label: "Suspended", value: fmt(kpis.suspended), icon: Ban, tone: "red" },
    { label: "New this month", value: fmt(kpis.newThisMonth), icon: Sparkles, tone: "violet" },
  ]

  const statusTabs: AdminTab[] = [
    { key: "all", label: "Any status", href: tabHref(sp, { status: undefined }) },
    { key: "active", label: "Active", href: tabHref(sp, { status: "active" }) },
    { key: "trialing", label: "Trialing", href: tabHref(sp, { status: "trialing" }) },
    { key: "suspended", label: "Suspended", href: tabHref(sp, { status: "suspended" }) },
  ]
  const planTabs: AdminTab[] = [
    { key: "all", label: "All plans", href: tabHref(sp, { plan: undefined }) },
    { key: "pro", label: "Pro", href: tabHref(sp, { plan: "pro" }) },
    { key: "business", label: "Business", href: tabHref(sp, { plan: "business" }) },
    { key: "enterprise", label: "Enterprise", href: tabHref(sp, { plan: "enterprise" }) },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Building2}
        title="Workspaces"
        subtitle={`${fmt(kpis.total)} workspaces on the platform · live cross-workspace view`}
        actions={<CreateWorkspaceWizard users={users} />}
      />

      <AdminKpiStrip kpis={kpiCards} cols={5} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <AdminCard padded={false}>
          <div className="p-4 border-b border-[#EEF3FB] space-y-3">
            <AdminSearchInput placeholder="Search workspaces or owners…" className="w-full sm:w-72" />
            <div className="flex flex-wrap gap-3">
              <AdminTabs tabs={statusTabs} activeKey={statusFilter} />
              <AdminTabs tabs={planTabs} activeKey={planFilter} />
            </div>
          </div>

          {pageRows.length === 0 ? (
            <AdminEmptyState icon={Building2} title="No workspaces match" description={allWorkspaces.length === 0 ? "Workspaces appear here as customers sign up." : "Try clearing your search or filters."} />
          ) : (
            <>
              <AdminTable head={[
                { label: "Workspace" }, { label: "Owner" }, { label: "Plan" },
                { label: "Status" }, { label: "Members", align: "center" }, { label: "Created" }, { label: "", align: "right" },
              ]} minWidth={860}>
                {pageRows.map((w) => (
                  <tr key={w.id} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/workspaces/${w.id}`} className="flex items-center gap-2.5 group">
                        <span className="w-8 h-8 rounded-lg bg-[#0D1B2A] flex items-center justify-center shrink-0"><Building2 className="w-4 h-4 text-white" /></span>
                        <span className="block text-[13px] font-semibold text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{w.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-[12.5px] text-slate-600 truncate">{w.ownerName ?? "—"}</p>
                      <p className="text-[11px] text-slate-400 truncate">{w.ownerEmail ?? ""}</p>
                    </td>
                    <td className="px-4 py-2.5"><AdminStatusChip tone={planTone(w.plan)}>{w.plan}</AdminStatusChip></td>
                    <td className="px-4 py-2.5"><AdminStatusChip tone={statusTone(w.planStatus)} dot>{w.planStatus}</AdminStatusChip></td>
                    <td className="px-4 py-2.5 text-center text-[13px] text-slate-600">{w.memberCount}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-400 whitespace-nowrap">{shortDate(w.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <AdminActionMenu actions={[
                        { label: "View workspace", href: `/admin/workspaces/${w.id}` },
                        { label: "Subscriptions", href: `/admin/subscriptions?workspace=${w.id}` },
                        { label: "Audit log", href: `/admin/audit-log?workspace=${w.id}` },
                      ]} />
                    </td>
                  </tr>
                ))}
              </AdminTable>
              <div className="px-4 py-2.5 border-t border-[#EEF3FB] flex items-center justify-between">
                <span className="text-[12px] text-slate-500">Showing {pageRows.length} of {filtered.length}</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <PageLink sp={sp} page={clamped - 1} disabled={clamped <= 1}>Prev</PageLink>
                    <span className="text-[12px] text-slate-500 px-2">{clamped} / {totalPages}</span>
                    <PageLink sp={sp} page={clamped + 1} disabled={clamped >= totalPages}>Next</PageLink>
                  </div>
                )}
              </div>
            </>
          )}
        </AdminCard>

        {/* Right rail */}
        <div className="space-y-4">
          <AdminSectionCard title="Plan distribution" icon={TrendingUp}>
            {kpis.planMix.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-2">No workspaces yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {kpis.planMix.map((p) => {
                  const pct = kpis.total ? Math.round((p.value / kpis.total) * 100) : 0
                  return (
                    <li key={p.label}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="capitalize text-slate-600">{p.label}</span>
                        <span className="font-semibold text-[#0B1B3F]">{p.value} <span className="text-slate-400 font-normal">· {pct}%</span></span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Top by activity" icon={Users}>
            {topByMembers.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-2">No workspaces yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {topByMembers.map((w) => (
                  <li key={w.id}>
                    <Link href={`/admin/workspaces/${w.id}`} className="flex items-center justify-between gap-2 group">
                      <span className="text-[13px] font-medium text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{w.name}</span>
                      <span className="text-[12px] text-slate-500 shrink-0 inline-flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" />{w.memberCount}<ChevronRight className="w-3.5 h-3.5 text-slate-300" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Growth" icon={Sparkles}>
            <p className="text-[26px] font-bold text-emerald-600 leading-none">+{kpis.newThisMonth}</p>
            <p className="mt-1.5 text-[12px] text-slate-500">new workspaces created this month.</p>
          </AdminSectionCard>
        </div>
      </div>
    </div>
  )
}

function tabHref(sp: { q?: string; status?: string; plan?: string }, patch: Partial<{ status?: string; plan?: string }>): string {
  const params = new URLSearchParams()
  if (sp.q) params.set("q", sp.q)
  const status = "status" in patch ? patch.status : sp.status
  const plan = "plan" in patch ? patch.plan : sp.plan
  if (status && status !== "all") params.set("status", status)
  if (plan && plan !== "all") params.set("plan", plan)
  const qs = params.toString()
  return qs ? `/admin/workspaces?${qs}` : "/admin/workspaces"
}

function PageLink({ sp, page, disabled, children }: { sp: { q?: string; status?: string; plan?: string }; page: number; disabled: boolean; children: React.ReactNode }) {
  if (disabled) return <span className="h-8 px-3 inline-flex items-center rounded-lg text-[12px] font-semibold text-slate-300">{children}</span>
  const params = new URLSearchParams()
  if (sp.q) params.set("q", sp.q)
  if (sp.status) params.set("status", sp.status)
  if (sp.plan) params.set("plan", sp.plan)
  params.set("page", String(page))
  return <Link href={`/admin/workspaces?${params.toString()}`} className="h-8 px-3 inline-flex items-center rounded-lg border border-[#E2EAF6] text-[12px] font-semibold text-slate-700 hover:bg-slate-50">{children}</Link>
}
