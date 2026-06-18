import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Store, PoundSterling, TrendingUp, Tag, Gavel, Wallet, ArrowRight,
  ShieldCheck, Receipt, Percent, Building2,
} from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { getMarketplaceOverview, listTransactions, listPayouts, listDisputesForAdmin } from "@/components/admin-marketplace/data"
import { getMarketplaceTrend, fmtPence } from "@/lib/admin/pages/batch2"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminCard,
  AdminSectionCard,
  AdminChartCard,
  AdminStatusChip,
  AdminBanner,
  AdminNotConfigured,
  type AdminKpi,
} from "@/components/admin/ui"

export const dynamic = "force-dynamic"

/** Inline SVG area/line chart for the GMV trend (server-renderable, no deps). */
function GmvLineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const w = 560
  const h = 180
  const pad = { top: 12, right: 12, bottom: 26, left: 12 }
  const max = Math.max(1, ...data.map((d) => d.value))
  const innerW = w - pad.left - pad.right
  const innerH = h - pad.top - pad.bottom
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW
  const points = data.map((d, i) => {
    const x = pad.left + i * stepX
    const y = pad.top + innerH - (d.value / max) * innerH
    return { x, y, ...d }
  })
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const area = `${line} L${points[points.length - 1].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="GMV trend over the last 6 months">
      <defs>
        <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#gmvFill)" />
      <path d={line} fill="none" stroke="#2563EB" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#2563EB" />
          <text x={p.x} y={h - 8} textAnchor="middle" className="fill-slate-400" fontSize="10">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

export default async function MarketplaceOverviewPage() {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const [o, trend, recentTxns, payouts, disputes] = await Promise.all([
    getMarketplaceOverview(),
    getMarketplaceTrend(),
    listTransactions({ limit: 6 }),
    listPayouts({ limit: 6 }),
    listDisputesForAdmin({ limit: 6 }),
  ])

  const kpis: AdminKpi[] = [
    { label: "GMV (gross)", value: fmtPence(o.gmvPence), icon: PoundSterling, tone: "blue", sub: `${o.totalTransactions ?? 0} transactions`, href: "/admin/marketplace/transactions" },
    { label: "Platform revenue", value: fmtPence(o.platformRevenuePence), icon: TrendingUp, tone: "emerald", sub: "sum of platform fees" },
    { label: "Active listings", value: o.activeListings === null ? "—" : o.activeListings.toLocaleString("en-GB"), icon: Tag, tone: "violet" },
    { label: "Open disputes", value: o.openDisputes === null ? "—" : o.openDisputes.toLocaleString("en-GB"), icon: Gavel, tone: "red", href: "/admin/marketplace/disputes" },
    { label: "Pending payouts", value: o.pendingPayouts === null ? "—" : o.pendingPayouts.toLocaleString("en-GB"), icon: Wallet, tone: "amber", sub: fmtPence(o.pendingPayoutPence), href: "/admin/marketplace/payouts" },
    { label: "Conversion", value: trend.conversionPct === null ? "—" : `${trend.conversionPct}%`, icon: Percent, tone: "sky", sub: "captured / total" },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Store}
        title="Marketplace oversight"
        subtitle="Live cross-workspace commerce overview. All amounts are summed directly from real transaction and payout rows — integer pence, no estimation."
      />

      <AdminKpiStrip kpis={kpis} cols={6} />

      {!o.available ? (
        <AdminNotConfigured
          title="Marketplace not provisioned"
          description="The marketplace_transactions table has not been created yet. GMV, revenue and payout oversight populate here once commerce flows through the platform."
        />
      ) : (
        <>
          <AdminBanner tone="slate" icon={ShieldCheck} title="Honest figures.">
            Numbers come straight from <code className="font-mono">marketplace_transactions</code> and <code className="font-mono">payouts</code> (integer pence). Dispute resolution is an explicit, audited admin action — never automatic.
          </AdminBanner>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <AdminChartCard title="GMV trend — last 6 months" icon={TrendingUp} className="lg:col-span-2">
              <GmvLineChart data={trend.available ? trend.gmvByMonth : []} />
            </AdminChartCard>

            <AdminSectionCard title="Top sellers by GMV" icon={Building2}>
              {trend.topSellers.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-2">No seller activity yet.</p>
              ) : (
                <ol className="space-y-3">
                  {trend.topSellers.map((s, i) => (
                    <li key={s.workspaceId} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-[#EFF4FF] text-[#2563EB] text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <Link href={`/admin/workspaces/${s.workspaceId}`} className="text-[12.5px] font-medium text-slate-700 hover:text-[#2563EB] truncate">
                          {s.name ?? "Workspace"}
                        </Link>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-700 shrink-0">{fmtPence(s.grossPence)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </AdminSectionCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <AdminSectionCard title="Recent transactions" icon={Receipt} viewAllHref="/admin/marketplace/transactions">
              {recentTxns.rows.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-2">No transactions yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {recentTxns.rows.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-slate-700 truncate">
                          {t.buyerWorkspaceName ?? "Buyer"} → {t.sellerWorkspaceName ?? "Seller"}
                        </p>
                        <p className="text-[11px] text-slate-400 capitalize">{(t.transactionType ?? "—").replace(/_/g, " ")}</p>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-700 shrink-0">{fmtPence(t.grossPence, t.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSectionCard>

            <AdminSectionCard title="Payout pipeline" icon={Wallet} viewAllHref="/admin/marketplace/payouts">
              {payouts.rows.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-2">No payouts yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {payouts.rows.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-slate-700 truncate">{p.workspaceName ?? "Workspace"}</p>
                        <AdminStatusChip tone={p.status === "paid" ? "emerald" : p.status === "failed" ? "red" : "amber"} className="capitalize mt-0.5">{p.status}</AdminStatusChip>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-700 shrink-0">{fmtPence(p.amountPence, p.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSectionCard>

            <AdminSectionCard title="Dispute summary" icon={Gavel} viewAllHref="/admin/marketplace/disputes">
              {disputes.rows.length === 0 ? (
                <p className="text-[13px] text-slate-400 py-2">No open disputes.</p>
              ) : (
                <ul className="space-y-2.5">
                  {disputes.rows.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-slate-700 truncate">{d.reason ?? "Dispute"}</p>
                        <p className="text-[11px] text-slate-400 truncate">{d.raisedByWorkspaceName ?? "—"}</p>
                      </div>
                      <AdminStatusChip tone={d.status === "open" ? "red" : "amber"} className="capitalize shrink-0">{d.status.replace(/_/g, " ")}</AdminStatusChip>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSectionCard>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/admin/marketplace/transactions", icon: PoundSterling, label: "Transactions", desc: "Cross-workspace monitor" },
              { href: "/admin/marketplace/moderation", icon: ShieldCheck, label: "Moderation", desc: "Listing approval queue" },
              { href: "/admin/marketplace/disputes", icon: Gavel, label: "Disputes", desc: "Resolve the queue" },
              { href: "/admin/marketplace/payouts", icon: Wallet, label: "Payouts", desc: "Platform-wide monitor" },
            ].map((l) => {
              const Icon = l.icon
              return (
                <Link key={l.href} href={l.href}>
                  <AdminCard className="hover:border-[#C8DBF5] hover:shadow-md transition-all h-full group">
                    <div className="flex items-start justify-between">
                      <span className="w-9 h-9 rounded-xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mb-3"><Icon className="w-[18px] h-[18px]" /></span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] transition-colors" />
                    </div>
                    <p className="text-[14px] font-semibold text-[#0B1B3F]">{l.label}</p>
                    <p className="text-[11.5px] text-slate-400">{l.desc}</p>
                  </AdminCard>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
