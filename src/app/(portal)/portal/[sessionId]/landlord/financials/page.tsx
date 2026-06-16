import Link from "next/link"
import { ArrowLeft, TrendingUp, TrendingDown, PoundSterling, Download } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { requirePortalSession } from "../../_guard"
import { getLandlordTransactions } from "@/lib/portal/data"
import { formatMoney, formatDate } from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// ---- CSV export helper (server-rendered download link) ----------------------
function buildCsvDataUri(transactions: Awaited<ReturnType<typeof getLandlordTransactions>>): string {
  const header = "Date,Description,Category,Direction,Amount (GBP),Status"
  const rows = transactions.map((t) => {
    const amount = (t.amount / 100).toFixed(2)
    return [
      formatDate(t.created_at),
      `"${(t.description ?? "").replace(/"/g, '""')}"`,
      t.category ?? "",
      t.direction,
      amount,
      t.status ?? "",
    ].join(",")
  })
  return `data:text/csv;charset=utf-8,${encodeURIComponent([header, ...rows].join("\n"))}`
}

function categoryLabel(cat: string | null): string {
  if (!cat) return "—"
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function LandlordFinancialsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`

  const transactions = await getLandlordTransactions(session)

  const income = transactions.filter((t) => t.direction === "in")
  const expenditure = transactions.filter((t) => t.direction === "out")
  const totalIncome = income.reduce((s, t) => s + (t.amount ?? 0), 0)
  const totalExpenditure = expenditure.reduce((s, t) => s + (t.amount ?? 0), 0)
  const netPL = totalIncome - totalExpenditure

  // Monthly P&L rollup
  const monthMap = new Map<string, { income: number; expenditure: number }>()
  for (const t of transactions) {
    const month = t.created_at.slice(0, 7)
    const existing = monthMap.get(month) ?? { income: 0, expenditure: 0 }
    if (t.direction === "in") existing.income += t.amount ?? 0
    else existing.expenditure += t.amount ?? 0
    monthMap.set(month, existing)
  }
  const monthlyPL = Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12)
    .map(([month, v]) => {
      const [year, mo] = month.split("-")
      const d = new Date(Number(year), Number(mo) - 1, 1)
      return {
        month: d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
        income: v.income,
        expenditure: v.expenditure,
        net: v.income - v.expenditure,
      }
    })

  const csvUri = buildCsvDataUri(transactions)

  return (
    <div className="space-y-6">
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Financials</h1>
          <p className="text-sm text-slate-500">Income and expenditure for your portfolio</p>
        </div>
        {transactions.length > 0 && (
          <a
            href={csvUri}
            download="financials-export.csv"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
        )}
      </div>

      {/* P&L summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-emerald-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-emerald-600">Total Income</p>
          </div>
          <p className="text-2xl font-bold text-[#059669]">{formatMoney(totalIncome)}</p>
          <p className="text-xs text-slate-400 mt-1">{income.length} transaction{income.length === 1 ? "" : "s"}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-[#dc2626]" />
            <p className="text-xs text-red-600">Total Expenditure</p>
          </div>
          <p className="text-2xl font-bold text-[#dc2626]">{formatMoney(totalExpenditure)}</p>
          <p className="text-xs text-slate-400 mt-1">{expenditure.length} transaction{expenditure.length === 1 ? "" : "s"}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${netPL >= 0 ? "bg-[#EFF6FF] border-blue-100" : "bg-[#FFFBEB] border-amber-100"}`}>
          <div className="flex items-center gap-2 mb-1">
            <PoundSterling className={`w-4 h-4 ${netPL >= 0 ? "text-[#2563EB]" : "text-[#d97706]"}`} />
            <p className={`text-xs ${netPL >= 0 ? "text-[#2563EB]" : "text-[#d97706]"}`}>Net P&amp;L</p>
          </div>
          <p className={`text-2xl font-bold ${netPL >= 0 ? "text-[#2563EB]" : "text-[#d97706]"}`}>
            {netPL >= 0 ? "+" : "−"}{formatMoney(Math.abs(netPL))}
          </p>
        </div>
      </div>

      {/* Monthly P&L table */}
      {monthlyPL.length > 0 && (
        <Card className="rounded-2xl border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Monthly P&amp;L</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Month", "Income", "Expenditure", "Net"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyPL.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-xs font-medium text-slate-700 whitespace-nowrap">{m.month}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-[#059669]">{formatMoney(m.income)}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-[#dc2626]">{formatMoney(m.expenditure)}</td>
                    <td className={`px-5 py-3 text-xs font-bold ${m.net >= 0 ? "text-[#2563EB]" : "text-[#d97706]"}`}>
                      {m.net >= 0 ? "+" : "−"}{formatMoney(Math.abs(m.net))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Transaction ledger */}
      <Card className="rounded-2xl border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">All transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <PoundSterling className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No transactions yet</h3>
            <p className="text-xs text-slate-400 mt-1">Financial transactions for your properties will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Date", "Description", "Category", "Direction", "Amount"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                    <td className="px-5 py-3 text-xs text-slate-700">{t.description ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{categoryLabel(t.category)}</td>
                    <td className="px-5 py-3">
                      {t.direction === "in"
                        ? <span className="inline-flex items-center gap-1 text-xs text-[#059669]"><TrendingUp className="w-3 h-3" /> Income</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-[#dc2626]"><TrendingDown className="w-3 h-3" /> Expense</span>
                      }
                    </td>
                    <td className={`px-5 py-3 text-xs font-semibold ${t.direction === "in" ? "text-[#059669]" : "text-[#dc2626]"}`}>
                      {t.direction === "out" ? "−" : "+"}{formatMoney(t.amount, t.currency ?? "GBP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
