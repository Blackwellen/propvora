import React from "react"
import Link from "next/link"
import {
  Users, Activity, ShieldCheck, Ban, UserMinus, KeyRound, ChevronRight, TrendingUp,
} from "lucide-react"
import {
  AdminPageHeader, AdminKpiStrip, AdminCard, AdminSectionCard, AdminTable,
  AdminStatusChip, AdminFilterBar, AdminSearchInput, AdminActionMenu, AdminEmptyState,
  AdminTabs, type AdminKpi, type AdminTab, type AdminTone,
} from "@/components/admin/ui"
import { listUsers } from "@/lib/admin/data"
import { getUserKpis } from "@/lib/admin/pages/batch1"
import CreateUserWizard from "@/components/admin-users/CreateUserWizard"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 25

interface PageProps { searchParams: Promise<{ q?: string; role?: string; page?: string }> }

function roleTone(role: string): AdminTone {
  if (role === "platform_admin" || role === "admin") return "violet"
  if (role === "support") return "blue"
  return "slate"
}
function roleLabel(role: string) {
  if (role === "platform_admin" || role === "admin") return "Platform admin"
  if (role === "support") return "Support"
  return "User"
}
function initials(name: string | null, email: string | null) {
  return (name || email || "?").split(/[\s@.]+/).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2)
}
function shortDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}
function fmt(n: number | null) { return n === null ? "—" : n.toLocaleString("en-GB") }

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = (sp.q ?? "").toLowerCase().trim()
  const roleFilter = sp.role ?? "all"
  const page = Math.max(1, Number(sp.page ?? "1") || 1)

  const [allUsers, kpis] = await Promise.all([listUsers(500), getUserKpis()])

  const filtered = allUsers.filter((u) => {
    if (q && !(`${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(q))) return false
    if (roleFilter === "admin" && !(u.role === "platform_admin" || u.role === "admin")) return false
    if (roleFilter === "support" && u.role !== "support") return false
    if (roleFilter === "user" && (u.role === "platform_admin" || u.role === "admin" || u.role === "support")) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clamped = Math.min(page, totalPages)
  const pageRows = filtered.slice((clamped - 1) * PAGE_SIZE, clamped * PAGE_SIZE)

  const kpiCards: AdminKpi[] = [
    { label: "Total users", value: fmt(kpis.total), icon: Users, tone: "blue" },
    { label: "Active in 30 days", value: fmt(kpis.activeLast30), icon: Activity, tone: "emerald" },
    { label: "Admins", value: fmt(kpis.admins), icon: ShieldCheck, tone: "violet" },
    { label: "Suspended", value: fmt(kpis.suspended), icon: Ban, tone: "red" },
    { label: "Unassigned", value: fmt(kpis.unassigned), icon: UserMinus, tone: "amber" },
    { label: "MFA enabled", value: fmt(kpis.mfaEnabled), icon: KeyRound, tone: "sky" },
  ]

  const roleTabs: AdminTab[] = [
    { key: "all", label: "All", href: tabHref(sp, undefined) },
    { key: "admin", label: "Admins", href: tabHref(sp, "admin") },
    { key: "support", label: "Support", href: tabHref(sp, "support") },
    { key: "user", label: "Users", href: tabHref(sp, "user") },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Users}
        title="Users"
        subtitle={`${fmt(kpis.total)} users · ${kpis.admins} admin${kpis.admins === 1 ? "" : "s"} · live from profiles + auth + memberships`}
        actions={<CreateUserWizard />}
      />

      <AdminKpiStrip kpis={kpiCards} cols={6} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <AdminCard padded={false}>
          <div className="p-4 border-b border-[#EEF3FB] flex flex-wrap items-center gap-3">
            <AdminSearchInput placeholder="Search by name or email…" className="w-full sm:w-72" />
            <AdminTabs tabs={roleTabs} activeKey={roleFilter} className="sm:ml-auto" />
          </div>

          {pageRows.length === 0 ? (
            <AdminEmptyState icon={Users} title="No users match" description={allUsers.length === 0 ? "Users appear here as people register." : "Try clearing your search or role filter."} />
          ) : (
            <>
              <AdminTable head={[
                { label: "User" }, { label: "Role" }, { label: "Workspaces", align: "center" },
                { label: "Joined" }, { label: "", align: "right" },
              ]} minWidth={720}>
                {pageRows.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2.5 group">
                        <span className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-[11px] font-bold flex items-center justify-center shrink-0">{initials(u.name, u.email)}</span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{u.name ?? "—"}</span>
                          <span className="block text-[11px] text-slate-400 truncate">{u.email ?? ""}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5"><AdminStatusChip tone={roleTone(u.role)}>{roleLabel(u.role)}</AdminStatusChip></td>
                    <td className="px-4 py-2.5 text-center text-[13px] text-slate-600">{u.workspaceCount}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-400 whitespace-nowrap">{shortDate(u.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <AdminActionMenu actions={[
                        { label: "View user", href: `/admin/users/${u.id}` },
                        { label: "View as customer", href: `/admin/customers/${u.id}` },
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
          <AdminSectionCard title="Role mix" icon={ShieldCheck}>
            {kpis.roleMix.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-2">No users yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {kpis.roleMix.map((r) => {
                  const pct = kpis.total ? Math.round((r.value / kpis.total) * 100) : 0
                  return (
                    <li key={r.label}>
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="text-slate-600">{roleLabel(r.label)}</span>
                        <span className="font-semibold text-[#0B1B3F]">{r.value} <span className="text-slate-400 font-normal">· {pct}%</span></span>
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

          <AdminSectionCard title="Security posture" icon={KeyRound}>
            <dl className="space-y-2.5 text-[13px]">
              <RailRow label="MFA enabled" value={fmt(kpis.mfaEnabled)} />
              <RailRow label="Suspended" value={fmt(kpis.suspended)} />
              <RailRow label="Unassigned" value={fmt(kpis.unassigned)} />
              <RailRow label="Active in 30 days" value={fmt(kpis.activeLast30)} />
            </dl>
            <Link href="/admin/security" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
              Security centre <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </AdminSectionCard>

          <AdminSectionCard title="Footprint" icon={TrendingUp}>
            <p className="text-[26px] font-bold text-[#0B1B3F] leading-none">{fmt(kpis.total)}</p>
            <p className="mt-1.5 text-[12px] text-slate-500">total registered users across the platform.</p>
          </AdminSectionCard>
        </div>
      </div>
    </div>
  )
}

function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-[#0B1B3F]">{value}</dd>
    </div>
  )
}

function tabHref(sp: { q?: string; role?: string }, role: string | undefined): string {
  const params = new URLSearchParams()
  if (sp.q) params.set("q", sp.q)
  if (role) params.set("role", role)
  const qs = params.toString()
  return qs ? `/admin/users?${qs}` : "/admin/users"
}

function PageLink({ sp, page, disabled, children }: { sp: { q?: string; role?: string }; page: number; disabled: boolean; children: React.ReactNode }) {
  if (disabled) return <span className="h-8 px-3 inline-flex items-center rounded-lg text-[12px] font-semibold text-slate-300">{children}</span>
  const params = new URLSearchParams()
  if (sp.q) params.set("q", sp.q)
  if (sp.role) params.set("role", sp.role)
  params.set("page", String(page))
  return <Link href={`/admin/users?${params.toString()}`} className="h-8 px-3 inline-flex items-center rounded-lg border border-[#E2EAF6] text-[12px] font-semibold text-slate-700 hover:bg-slate-50">{children}</Link>
}
