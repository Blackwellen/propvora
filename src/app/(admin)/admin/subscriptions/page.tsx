import React from "react"
import Link from "next/link"
import {
  CreditCard, Building2, Activity, AlertTriangle, TrendingUp, ChevronRight,
  CalendarClock, Banknote, XCircle, PlugZap,
} from "lucide-react"
import {
  AdminPageHeader, AdminKpiStrip, AdminCard, AdminSectionCard, AdminBanner,
  AdminTable, AdminStatusChip, AdminSearchInput, AdminEmptyState, AdminNotConfigured,
  AdminTabs, type AdminKpi, type AdminTab, type AdminTone,
} from "@/components/admin/ui"
import { listSubscriptions } from "@/lib/admin/data"
import { getSubscriptionKpis } from "@/lib/admin/pages/batch1"

export const dynamic = "force-dynamic"

interface PageProps { searchParams: Promise<{ q?: string; status?: string }> }

function statusTone(status: string): AdminTone {
  if (status === "active") return "emerald"
  if (status === "trialing") return "amber"
  if (status === "past_due") return "red"
  if (status === "canceled" || status === "cancelled") return "slate"
  return "slate"
}
function fmtPence(n: number | null): string {
  if (n === null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n / 100)
}
function shortDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = (sp.q ?? "").toLowerCase().trim()
  const statusFilter = sp.status ?? "all"

  const [{ available, rows: allRows }, kpis] = await Promise.all([listSubscriptions(500), getSubscriptionKpis()])

  const rows = allRows.filter((s) => {
    if (q && !(`${s.workspaceName} ${s.plan} ${s.stripeSubscriptionId ?? ""}`.toLowerCase().includes(q))) return false
    if (statusFilter !== "all" && s.status !== statusFilter) return false
    return true
  })

  const mrr = kpis.mrrPence
  const arr = mrr == null ? null : mrr * 12

  const kpiCards: AdminKpi[] = [
    { label: "Subscriptions", value: kpis.total.toLocaleString("en-GB"), icon: CreditCard, tone: "blue" },
    { label: "Active", value: kpis.active.toLocaleString("en-GB"), icon: Activity, tone: "emerald" },
    { label: "Past due", value: kpis.pastDue.toLocaleString("en-GB"), icon: AlertTriangle, tone: "red" },
    { label: "MRR", value: fmtPence(mrr), icon: Banknote, tone: "emerald", sub: mrr == null ? "billing not provisioned" : "from active subs" },
    { label: "ARR", value: fmtPence(arr), icon: TrendingUp, tone: "violet", sub: arr == null ? "billing not provisioned" : "MRR × 12" },
    { label: "Cancelled", value: kpis.canceled.toLocaleString("en-GB"), icon: XCircle, tone: "slate" },
  ]

  const statusTabs: AdminTab[] = [
    { key: "all", label: "All subscriptions", href: tabHref(sp, undefined) },
    { key: "active", label: "Active", href: tabHref(sp, "active") },
    { key: "trialing", label: "Trialing", href: tabHref(sp, "trialing") },
    { key: "past_due", label: "Past due", href: tabHref(sp, "past_due") },
    { key: "canceled", label: "Cancelled", href: tabHref(sp, "canceled") },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={CreditCard}
        title="Subscriptions"
        subtitle="Live billing records from the subscriptions table. Monetary totals are shown only when real amounts are present."
      />

      {(!kpis.stripeLinked || mrr == null) && (
        <AdminBanner tone="amber" icon={CreditCard} title="Revenue metrics are billing-integration dependent.">
          MRR / ARR are derived from Stripe. Until the Stripe integration is live and <code className="font-mono">subscriptions.amount_pence</code> /
          <code className="font-mono"> stripe_subscription_id</code> are populated, monetary totals are not fabricated and show as “—”.
        </AdminBanner>
      )}

      {!available ? (
        <AdminNotConfigured
          title="Subscriptions table not provisioned"
          description="The subscriptions table is not present in this database yet. Subscription records and billing metrics will appear here once Stripe billing is wired and customers begin checking out."
        />
      ) : (
        <>
          <AdminKpiStrip kpis={kpiCards} cols={6} />

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
            <AdminCard padded={false}>
              <div className="p-4 border-b border-[#EEF3FB] flex flex-wrap items-center gap-3">
                <AdminSearchInput placeholder="Search workspace, plan, Stripe ID…" className="w-full sm:w-72" />
                <AdminTabs tabs={statusTabs} activeKey={statusFilter} className="sm:ml-auto" />
              </div>

              {rows.length === 0 ? (
                <AdminEmptyState icon={CreditCard} title="No subscriptions match" description={allRows.length === 0 ? "Subscription records appear here once customers start billing via Stripe." : "Try clearing your search or filter."} />
              ) : (
                <>
                  <AdminTable head={[
                    { label: "Workspace" }, { label: "Plan" }, { label: "Status" },
                    { label: "Renews" }, { label: "Stripe subscription" },
                  ]} minWidth={760}>
                    {rows.map((s) => (
                      <tr key={s.id} className="hover:bg-[#FAFCFF]">
                        <td className="px-4 py-2.5">
                          <Link href={`/admin/workspaces/${s.workspaceId}`} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0B1B3F] hover:text-[#2563EB]">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />{s.workspaceName}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5"><AdminStatusChip tone="blue">{s.plan}</AdminStatusChip></td>
                        <td className="px-4 py-2.5"><AdminStatusChip tone={statusTone(s.status)} dot>{s.status.replace("_", " ")}</AdminStatusChip></td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-400 whitespace-nowrap">{shortDate(s.periodEnd)}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">{s.stripeSubscriptionId ?? "—"}</td>
                      </tr>
                    ))}
                  </AdminTable>
                  <div className="px-4 py-2.5 border-t border-[#EEF3FB] text-[12px] text-slate-500">
                    Showing {rows.length} of {allRows.length} subscription{allRows.length === 1 ? "" : "s"}
                  </div>
                </>
              )}
            </AdminCard>

            {/* Right rail */}
            <div className="space-y-4">
              <AdminSectionCard title="Stripe sync" icon={PlugZap}>
                <ul className="space-y-2.5 text-[13px]">
                  <Health label="Stripe linked" ok={kpis.stripeLinked} pendingLabel="Not wired" />
                  <Health label="Amounts populated" ok={mrr != null} pendingLabel="No amounts" />
                </ul>
                <Link href="/admin/stripe-events" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
                  Stripe events <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </AdminSectionCard>

              <AdminSectionCard title="Plan distribution" icon={TrendingUp}>
                {kpis.planMix.length === 0 ? (
                  <p className="text-[12px] text-slate-400 py-2">No subscriptions yet.</p>
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
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </AdminSectionCard>

              <AdminSectionCard title="Billing health" icon={CalendarClock}>
                <dl className="space-y-2.5 text-[13px]">
                  <RailRow label="Active" value={kpis.active.toLocaleString("en-GB")} />
                  <RailRow label="Trialing" value={kpis.trialing.toLocaleString("en-GB")} />
                  <RailRow label="Past due" value={kpis.pastDue.toLocaleString("en-GB")} />
                  <RailRow label="Cancelled" value={kpis.canceled.toLocaleString("en-GB")} />
                </dl>
              </AdminSectionCard>
            </div>
          </div>
        </>
      )}
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
function Health({ label, ok, pendingLabel }: { label: string; ok: boolean; pendingLabel: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <AdminStatusChip tone={ok ? "emerald" : "amber"} dot>{ok ? "Yes" : pendingLabel}</AdminStatusChip>
    </li>
  )
}

function tabHref(sp: { q?: string; status?: string }, status: string | undefined): string {
  const params = new URLSearchParams()
  if (sp.q) params.set("q", sp.q)
  if (status) params.set("status", status)
  const qs = params.toString()
  return qs ? `/admin/subscriptions?${qs}` : "/admin/subscriptions"
}
