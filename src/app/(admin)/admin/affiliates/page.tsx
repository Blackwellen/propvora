import React from "react"
import Link from "next/link"
import {
  UserCheck, Inbox, Users, Banknote, CheckCircle2, Wallet, Percent,
  ChevronRight, Award, CalendarClock, ShieldCheck,
} from "lucide-react"
import {
  AdminPageHeader, AdminKpiStrip, AdminCard, AdminSectionCard, AdminTable,
  AdminStatusChip, AdminSearchInput, AdminActionMenu, AdminEmptyState, AdminNotConfigured,
  AdminTabs, type AdminKpi, type AdminTab, type AdminTone,
} from "@/components/admin/ui"
import { listAffiliates, listAffiliateApplications, listWorkspacePicks } from "@/lib/admin/data"
import { getAffiliateKpis } from "@/lib/admin/pages/batch1"
import { formatPence } from "@/lib/affiliate/levels"
import ApplicationsReview from "./ApplicationsReview"
import CreateAffiliateWizard from "@/components/admin-affiliates/CreateAffiliateWizard"

export const dynamic = "force-dynamic"

interface PageProps { searchParams: Promise<{ q?: string; status?: string }> }

function statusTone(status: string): AdminTone {
  if (status === "active") return "emerald"
  if (status === "pending") return "amber"
  return "slate"
}

export default async function AdminAffiliatesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = (sp.q ?? "").toLowerCase().trim()
  const statusFilter = sp.status ?? "all"

  const [{ available, rows: allRows }, apps, workspacePicks, kpis] = await Promise.all([
    listAffiliates(500),
    listAffiliateApplications(500),
    listWorkspacePicks(300),
    getAffiliateKpis(),
  ])

  const rows = allRows.filter((a) => {
    if (q && !(`${a.name ?? ""} ${a.email ?? ""} ${a.code}`.toLowerCase().includes(q))) return false
    if (statusFilter !== "all" && a.status !== statusFilter) return false
    return true
  })

  const topPerformers = [...allRows].sort((a, b) => b.referrals - a.referrals).slice(0, 5)

  const kpiCards: AdminKpi[] = [
    { label: "Applications", value: kpis.applications.toLocaleString("en-GB"), icon: Inbox, tone: "blue", sub: `${kpis.pendingApplications} pending` },
    { label: "Active affiliates", value: kpis.activeAffiliates.toLocaleString("en-GB"), icon: Users, tone: "emerald" },
    { label: "Pending payouts", value: formatPence(kpis.pendingPayoutPence), icon: Banknote, tone: "amber" },
    { label: "Cleared", value: formatPence(kpis.clearedPence), icon: CheckCircle2, tone: "violet" },
    { label: "Paid total", value: formatPence(kpis.paidPence), icon: Wallet, tone: "sky" },
    { label: "Avg rate", value: kpis.avgCommissionRate == null ? "—" : `${Math.round(kpis.avgCommissionRate * 100)}%`, icon: Percent, tone: "blue" },
  ]

  const statusTabs: AdminTab[] = [
    { key: "all", label: "All affiliates", href: tabHref(sp, undefined) },
    { key: "active", label: "Active", href: tabHref(sp, "active") },
    { key: "pending", label: "Pending", href: tabHref(sp, "pending") },
    { key: "none", label: "Not enrolled", href: tabHref(sp, "none") },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={UserCheck}
        title="Affiliates"
        subtitle="Applications, enrolled affiliates and live commission balances. Commission accrues from paid invoices and clears after a 30-day cooling-off."
        actions={<CreateAffiliateWizard workspaces={workspacePicks} />}
      />

      <AdminKpiStrip kpis={kpiCards} cols={6} />

      {/* Applications review */}
      <AdminSectionCard
        title="Applications"
        icon={Inbox}
        actions={kpis.pendingApplications > 0 ? <AdminStatusChip tone="amber">{kpis.pendingApplications} pending</AdminStatusChip> : undefined}
      >
        {!apps.available ? (
          <p className="text-[13px] text-slate-400 py-3 text-center">Applications table not provisioned.</p>
        ) : apps.rows.length === 0 ? (
          <p className="text-[13px] text-slate-400 py-3 text-center">No affiliate applications yet.</p>
        ) : (
          <ApplicationsReview rows={apps.rows} />
        )}
      </AdminSectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <AdminCard padded={false}>
          <div className="p-4 border-b border-[#EEF3FB] flex flex-wrap items-center gap-3">
            <AdminSearchInput placeholder="Search affiliates or codes…" className="w-full sm:w-72" />
            <AdminTabs tabs={statusTabs} activeKey={statusFilter} className="sm:ml-auto" />
          </div>

          {!available ? (
            <AdminNotConfigured
              title="Affiliates table not provisioned"
              description="The affiliates table is not present in this database yet. Enrolled affiliates and their commission balances will appear here once the programme is live."
            />
          ) : rows.length === 0 ? (
            <AdminEmptyState icon={UserCheck} title="No affiliates match" description={allRows.length === 0 ? "Affiliate accounts appear here as people join the programme." : "Try clearing your search or filter."} />
          ) : (
            <>
              <AdminTable head={[
                { label: "Affiliate" }, { label: "Code" }, { label: "Status" },
                { label: "Rate", align: "center" }, { label: "Refs", align: "center" },
                { label: "Pending", align: "right" }, { label: "Paid", align: "right" }, { label: "", align: "right" },
              ]} minWidth={900}>
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/affiliates/${a.id}`} className="group block">
                        <span className="block text-[13px] font-semibold text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{a.name ?? "—"}</span>
                        <span className="block text-[11px] text-slate-400 truncate">{a.email ?? ""} · {a.origin}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">{a.code}</td>
                    <td className="px-4 py-2.5"><AdminStatusChip tone={statusTone(a.status)} dot>{a.status === "none" ? "Not enrolled" : a.status}</AdminStatusChip></td>
                    <td className="px-4 py-2.5 text-center text-[12px] text-slate-600">{Math.round(a.commissionRate * 100)}%</td>
                    <td className="px-4 py-2.5 text-center text-[12px] text-slate-600">{a.referrals}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-amber-600 tabular-nums">{formatPence(a.pendingPence)}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-emerald-600 tabular-nums">{formatPence(a.paidPence)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <AdminActionMenu actions={[
                        { label: "View affiliate", href: `/admin/affiliates/${a.id}` },
                        { label: "Workspace", href: `/admin/workspaces/${a.id}` },
                      ]} />
                    </td>
                  </tr>
                ))}
              </AdminTable>
              <div className="px-4 py-2.5 border-t border-[#EEF3FB] text-[12px] text-slate-500">
                Showing {rows.length} of {allRows.length} affiliate{allRows.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </AdminCard>

        {/* Right rail */}
        <div className="space-y-4">
          <AdminSectionCard title="Top performers" icon={Award}>
            {topPerformers.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-2">No affiliates yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {topPerformers.map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/affiliates/${a.id}`} className="flex items-center justify-between gap-2 group">
                      <span className="text-[13px] font-medium text-[#0B1B3F] group-hover:text-[#2563EB] truncate">{a.name ?? a.code}</span>
                      <span className="text-[12px] text-slate-500 shrink-0">{a.referrals} refs <ChevronRight className="inline w-3.5 h-3.5 text-slate-300" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Payout schedule" icon={CalendarClock}>
            <dl className="space-y-2.5 text-[13px]">
              <RailRow label="Pending" value={formatPence(kpis.pendingPayoutPence)} tone="amber" />
              <RailRow label="Cleared" value={formatPence(kpis.clearedPence)} tone="violet" />
              <RailRow label="Paid total" value={formatPence(kpis.paidPence)} tone="emerald" />
            </dl>
            <p className="mt-3 text-[11px] text-slate-400">Cleared balances become payable after the 30-day cooling-off window. Payouts are feature-flagged.</p>
          </AdminSectionCard>

          <AdminSectionCard title="Compliance & KYC" icon={ShieldCheck}>
            <p className="text-[13px] text-slate-500">Affiliate KYC and payout-method verification are required before any payout is released.</p>
            <Link href="/admin/id-verification" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
              Verification queue <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </AdminSectionCard>
        </div>
      </div>
    </div>
  )
}

function RailRow({ label, value, tone }: { label: string; value: string; tone: "amber" | "violet" | "emerald" }) {
  const c = tone === "amber" ? "text-amber-600" : tone === "violet" ? "text-violet-600" : "text-emerald-600"
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-semibold tabular-nums ${c}`}>{value}</dd>
    </div>
  )
}

function tabHref(sp: { q?: string; status?: string }, status: string | undefined): string {
  const params = new URLSearchParams()
  if (sp.q) params.set("q", sp.q)
  if (status) params.set("status", status)
  const qs = params.toString()
  return qs ? `/admin/affiliates?${qs}` : "/admin/affiliates"
}
