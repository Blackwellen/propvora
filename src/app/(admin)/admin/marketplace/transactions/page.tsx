import React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, PoundSterling, TrendingUp, Wallet, Receipt, Layers } from "lucide-react"
import { getAdminIdentity } from "@/lib/admin/guard"
import { listTransactions, fmtPence, shortId } from "@/components/admin-marketplace/data"
import { TransactionStatusBadge } from "@/components/admin-marketplace/badges"
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminCard,
  AdminTable,
  AdminTabs,
  AdminStatusChip,
  AdminEmptyState,
  AdminNotConfigured,
  AdminSectionCard,
  type AdminKpi,
  type AdminTab,
} from "@/components/admin/ui"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "authorized", label: "Authorized" },
  { key: "captured", label: "Captured" },
  { key: "released", label: "Released" },
  { key: "disputed", label: "Disputed" },
  { key: "refunded", label: "Refunded" },
  { key: "cancelled", label: "Cancelled" },
]

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "—"
}

export default async function MarketplaceTransactionsPage({ searchParams }: PageProps) {
  const identity = await getAdminIdentity()
  if (!identity) redirect("/admin-login")

  const sp = await searchParams
  const status = sp.status ?? "all"
  const { available, rows } = await listTransactions({ status: status === "all" ? undefined : status })

  const grossTotal = rows.reduce((a, r) => a + r.grossPence, 0)
  const feeTotal = rows.reduce((a, r) => a + r.platformFeePence, 0)
  const providerTotal = rows.reduce((a, r) => a + r.providerFeePence, 0)
  const payoutTotal = rows.reduce((a, r) => a + r.sellerPayoutPence, 0)

  const kpis: AdminKpi[] = [
    { label: "Gross volume", value: fmtPence(grossTotal), icon: PoundSterling, tone: "blue", sub: `${rows.length} transactions` },
    { label: "Platform fees", value: fmtPence(feeTotal), icon: TrendingUp, tone: "emerald" },
    { label: "Provider fees", value: fmtPence(providerTotal), icon: Layers, tone: "violet" },
    { label: "Seller payouts", value: fmtPence(payoutTotal), icon: Wallet, tone: "amber" },
  ]

  // Summary by transaction type (real, from the loaded rows).
  const byType: Record<string, { count: number; gross: number }> = {}
  for (const r of rows) {
    const t = r.transactionType ?? "other"
    if (!byType[t]) byType[t] = { count: 0, gross: 0 }
    byType[t].count++
    byType[t].gross += r.grossPence
  }
  const typeSummary = Object.entries(byType).sort((a, b) => b[1].gross - a[1].gross)
  const disputed = rows.filter((r) => r.status === "disputed").slice(0, 6)

  const base = (s: string) => (s === "all" ? "/admin/marketplace/transactions" : `/admin/marketplace/transactions?status=${s}`)
  const tabs: AdminTab[] = STATUS_TABS.map((t) => ({ key: t.key, label: t.label, href: base(t.key) }))

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Receipt}
        title="Transaction monitor"
        subtitle="Read-only cross-workspace transaction monitor showing the buyer → seller flow and full fee breakdown. All money is integer pence."
        breadcrumb={[
          { label: "Marketplace", href: "/admin/marketplace" },
          { label: "Transactions" },
        ]}
      />

      <AdminKpiStrip kpis={kpis} cols={4} />

      <AdminTabs tabs={tabs} activeKey={status} />

      <AdminCard padded={false}>
        {!available ? (
          <div className="p-5">
            <AdminNotConfigured
              title="Marketplace not provisioned"
              description="The marketplace_transactions table has not been created yet. Transactions appear here as commerce flows through the platform."
            />
          </div>
        ) : rows.length === 0 ? (
          <AdminEmptyState
            icon={PoundSterling}
            title="No transactions match"
            description="No transactions match the selected status. Transactions appear here as commerce flows through the marketplace."
          />
        ) : (
          <AdminTable
            minWidth={980}
            head={[
              { label: "Txn" },
              { label: "Buyer → Seller" },
              { label: "Type" },
              { label: "Gross", align: "right" },
              { label: "Platform fee", align: "right" },
              { label: "Provider fee", align: "right" },
              { label: "Seller payout", align: "right" },
              { label: "Status" },
              { label: "Date", align: "right" },
            ]}
          >
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-[#FAFCFF]">
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{shortId(t.id)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[12.5px]">
                    <Link href={t.buyerWorkspaceId ? `/admin/workspaces/${t.buyerWorkspaceId}` : "#"} className="font-medium text-slate-700 hover:text-[#2563EB] truncate max-w-[130px]">
                      {t.buyerWorkspaceName ?? shortId(t.buyerWorkspaceId)}
                    </Link>
                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                    <Link href={t.sellerWorkspaceId ? `/admin/workspaces/${t.sellerWorkspaceId}` : "#"} className="font-medium text-slate-700 hover:text-[#2563EB] truncate max-w-[130px]">
                      {t.sellerWorkspaceName ?? shortId(t.sellerWorkspaceId)}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px] text-slate-500 capitalize whitespace-nowrap">{(t.transactionType ?? "—").replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-[#0B1B3F] whitespace-nowrap">{fmtPence(t.grossPence, t.currency)}</td>
                <td className="px-4 py-3 text-right text-[12px] text-[#2563EB] whitespace-nowrap">{fmtPence(t.platformFeePence, t.currency)}</td>
                <td className="px-4 py-3 text-right text-[12px] text-slate-500 whitespace-nowrap">{fmtPence(t.providerFeePence, t.currency)}</td>
                <td className="px-4 py-3 text-right text-[12px] text-slate-700 whitespace-nowrap">{fmtPence(t.sellerPayoutPence, t.currency)}</td>
                <td className="px-4 py-3"><TransactionStatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-right text-[12px] text-slate-400 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminCard>

      {available && rows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AdminSectionCard title="Summary by type" icon={Layers}>
            <ul className="space-y-3">
              {typeSummary.map(([type, v]) => {
                const pct = grossTotal ? Math.round((v.gross / grossTotal) * 100) : 0
                return (
                  <li key={type}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1">
                      <span className="font-medium text-slate-600 capitalize">{type.replace(/_/g, " ")}</span>
                      <span className="text-slate-400">{v.count} · {fmtPence(v.gross)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </AdminSectionCard>

          <AdminSectionCard title="Disputed transactions" icon={Wallet} viewAllHref="/admin/marketplace/disputes">
            {disputed.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-2">No disputed transactions in this view.</p>
            ) : (
              <ul className="space-y-2.5">
                {disputed.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-slate-700 truncate">{t.buyerWorkspaceName ?? "Buyer"} → {t.sellerWorkspaceName ?? "Seller"}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{shortId(t.id)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] font-semibold text-slate-700">{fmtPence(t.grossPence, t.currency)}</span>
                      <AdminStatusChip tone="red">Disputed</AdminStatusChip>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>
        </div>
      )}
    </div>
  )
}
