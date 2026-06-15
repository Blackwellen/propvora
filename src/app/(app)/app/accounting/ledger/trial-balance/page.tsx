"use client"

import { useState } from "react"
import { Download, Scale, CheckCircle2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { AccountingKpiCard } from "@/features/accounting/components"
import { useTrialBalance } from "@/lib/accounting/hooks"
import { formatPence, toCsv, downloadCsv } from "@/lib/accounting"

const TYPE_LABEL: Record<string, string> = {
  asset: "Assets", liability: "Liabilities", equity: "Equity", income: "Income", expense: "Expenses",
}

export default function TrialBalancePage() {
  const [asOf, setAsOf] = useState<string>(new Date().toISOString().slice(0, 10))
  const { data: tb, loading } = useTrialBalance(asOf)

  function exportCsv() {
    if (!tb) return
    const csv = toCsv(
      ["Code", "Account", "Type", "Debit", "Credit"],
      tb.rows.map((r) => [r.code, r.name, TYPE_LABEL[r.type] ?? r.type, formatPence(r.net_debit_pence), formatPence(r.net_credit_pence)])
    )
    downloadCsv(`trial-balance-${asOf}.csv`, csv)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AccountingKpiCard label="Total Debits" value={formatPence(tb?.total_debit_pence ?? 0)} subtitle={`As of ${asOf}`} />
        <AccountingKpiCard label="Total Credits" value={formatPence(tb?.total_credit_pence ?? 0)} subtitle={`As of ${asOf}`} />
        <div className={cn("bg-white rounded-xl border shadow-sm p-5 flex items-center gap-3", tb?.balanced ? "border-emerald-200" : "border-red-200")}>
          {tb?.balanced ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <AlertTriangle className="w-8 h-8 text-red-500" />}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <p className={cn("text-lg font-bold", tb?.balanced ? "text-emerald-600" : "text-red-600")}>
              {tb?.balanced ? "In Balance" : "Out of Balance"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label htmlFor="tb-as-of" className="flex items-center gap-2 text-sm text-slate-600">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">As of</span>
          <input id="tb-as-of" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E2E8F0] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30" />
        </label>
        <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={exportCsv} disabled={!tb || tb.rows.length === 0}>
          Export
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Computing trial balance…</div>
        ) : !tb || tb.rows.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-center">
            <Scale className="w-6 h-6 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Nothing to report yet</p>
            <p className="text-xs text-slate-500 max-w-sm">Post some journal entries and they will appear here, summed from the ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-24">Code</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Account</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-32">Type</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-40">Debit</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-40">Credit</th>
              </tr>
            </thead>
            <tbody>
              {tb.rows.map((r) => (
                <tr key={r.account_id} className="border-b border-[#E2E8F0] hover:bg-slate-50/60">
                  <td className="px-5 py-3"><span className="font-mono text-[13px] font-semibold text-slate-700">{r.code}</span></td>
                  <td className="px-4 py-3 text-[13px] text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{TYPE_LABEL[r.type] ?? r.type}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-medium text-slate-900">{r.net_debit_pence ? formatPence(r.net_debit_pence) : "—"}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-medium text-slate-900">{r.net_credit_pence ? formatPence(r.net_credit_pence) : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                <td className="px-5 py-3" colSpan={3}><span className="text-[13px] text-slate-900">Totals</span></td>
                <td className="px-4 py-3 text-right text-[13px] text-slate-900">{formatPence(tb.total_debit_pence)}</td>
                <td className="px-4 py-3 text-right text-[13px] text-slate-900">{formatPence(tb.total_credit_pence)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
