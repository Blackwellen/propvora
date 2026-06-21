import {
  PoundSterling, TrendingUp, TrendingDown, Wallet, AlertTriangle, Download, FileText,
  ArrowDownLeft, ArrowUpRight,
} from "lucide-react"
import {
  PortalCard, PortalPageHeader, PortalSectionCard, PortalKpiStrip, StatusChip,
  PortalEmptyState, PortalButtonLink, type PortalKpi,
} from "@/components/portals/portal-ui"
import { formatMoney, formatDate } from "@/lib/portal/format"

interface Transaction {
  id: string
  direction: string | null
  amount: number | null
  currency: string | null
  description: string | null
  category: string | null
  created_at: string | null
}

interface OverdueAlert {
  tenancyId: string
  propertyLabel: string
}

interface LandlordPortalStatementsTabProps {
  kpis: PortalKpi[]
  transactions: Transaction[]
  overdueAlerts: OverdueAlert[]
  monthly: [string, { in: number; out: number; order: string }][]
  maxBar: number
  base: string
}

export function LandlordPortalStatementsTab({
  kpis,
  transactions,
  overdueAlerts,
  monthly,
  maxBar,
  base,
}: LandlordPortalStatementsTabProps) {
  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Financials"
        subtitle="Income, expenditure and net performance across your portfolio."
        backHref={base}
        actions={
          <>
            <PortalButtonLink href="#" icon={Download}>
              Export CSV
            </PortalButtonLink>
            <PortalButtonLink href={`${base}/documents`} variant="primary" icon={FileText}>
              Download statement
            </PortalButtonLink>
          </>
        }
      />
      <PortalKpiStrip kpis={kpis} cols={6} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <PortalSectionCard title="Income vs expenditure" icon={TrendingUp}>
            {monthly.length === 0 ? (
              <PortalEmptyState icon={TrendingUp} title="No data yet" />
            ) : (
              <div className="space-y-2.5">
                {monthly.map(([m, v]) => (
                  <div key={m} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-16 shrink-0">{m}</span>
                    <div className="flex-1 space-y-1">
                      <div className="h-3 rounded-full bg-emerald-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(v.in / maxBar) * 100}%` }}
                        />
                      </div>
                      <div className="h-3 rounded-full bg-rose-100 overflow-hidden">
                        <div
                          className="h-full bg-rose-400 rounded-full"
                          style={{ width: `${(v.out / maxBar) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#071B4D] w-20 text-right shrink-0">
                      {formatMoney(v.in - v.out)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Expenditure
                  </span>
                </div>
              </div>
            )}
          </PortalSectionCard>

          <PortalCard className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#EEF3FB]">
              <h2 className="text-sm font-semibold text-[#071B4D]">Transaction ledger</h2>
            </div>
            {transactions.length === 0 ? (
              <PortalEmptyState icon={Wallet} title="No transactions" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-[#EEF3FB] bg-[#FAFCFF]">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Direction</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5FB]">
                    {transactions.slice(0, 30).map((t) => {
                      const inc = t.direction === "in"
                      return (
                        <tr key={t.id} className="hover:bg-[#FAFCFF]">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {formatDate(t.created_at)}
                          </td>
                          <td className="px-4 py-3 font-medium text-[#071B4D] truncate max-w-[200px]">
                            {t.description ?? (inc ? "Rent received" : "Expense")}
                          </td>
                          <td className="px-4 py-3 text-slate-500 capitalize">
                            {t.category?.replace(/_/g, " ") ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusChip tone={inc ? "emerald" : "slate"}>
                              {inc ? (
                                <>
                                  <ArrowDownLeft className="w-3 h-3 inline" /> In
                                </>
                              ) : (
                                <>
                                  <ArrowUpRight className="w-3 h-3 inline" /> Out
                                </>
                              )}
                            </StatusChip>
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${inc ? "text-emerald-600" : "text-slate-900"}`}
                          >
                            {inc ? "+" : "−"}
                            {formatMoney(t.amount, t.currency ?? "GBP")}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </PortalCard>
        </div>

        <div className="space-y-4">
          <PortalSectionCard title="Arrears watchlist" icon={AlertTriangle}>
            {overdueAlerts.length === 0 ? (
              <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> No arrears
              </p>
            ) : (
              <ul className="space-y-2">
                {overdueAlerts.map((a) => (
                  <li
                    key={a.tenancyId}
                    className="flex items-center justify-between gap-2 rounded-xl bg-red-50/60 border border-red-100 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-[#071B4D] truncate">
                      {a.propertyLabel}
                    </span>
                    <StatusChip tone="red">Overdue</StatusChip>
                  </li>
                ))}
              </ul>
            )}
          </PortalSectionCard>
          <PortalSectionCard
            title="Downloadable statements"
            icon={FileText}
            viewAllHref={`${base}/documents`}
          >
            <PortalButtonLink
              href={`${base}/documents`}
              variant="ghost"
              icon={Download}
              className="w-full justify-center"
            >
              View statements
            </PortalButtonLink>
          </PortalSectionCard>
        </div>
      </div>
    </div>
  )
}
