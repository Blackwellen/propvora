"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  ChevronRight,
  Download,
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { AccountingKpiCard } from "@/features/accounting/components"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  fetchAccounts,
  fetchJournalEntries,
  buildTrialBalance,
  buildProfitAndLoss,
  buildBalanceSheet,
  fmtGBP,
  toCsv,
  downloadCsv,
  type LedgerAccount,
  type JournalEntryRow,
} from "@/features/accounting/ledger"

type ReportTab = "Trial Balance" | "Profit & Loss" | "Balance Sheet"
const TABS: ReportTab[] = ["Trial Balance", "Profit & Loss", "Balance Sheet"]

export default function ReportsPage() {
  const { workspace } = useWorkspace()
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [entries, setEntries] = useState<JournalEntryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ReportTab>("Trial Balance")
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  useEffect(() => {
    if (!workspace?.id) { setAccounts([]); setEntries([]); setLoading(false); return }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [a, e] = await Promise.all([fetchAccounts(workspace.id), fetchJournalEntries(workspace.id)])
        if (cancelled) return
        setAccounts(a); setEntries(e)
      } catch {
        if (!cancelled) { setAccounts([]); setEntries([]) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [workspace?.id])

  const trial = useMemo(() => buildTrialBalance(accounts, entries), [accounts, entries])
  const pl = useMemo(() => buildProfitAndLoss(accounts, entries), [accounts, entries])
  const bs = useMemo(() => buildBalanceSheet(accounts, entries), [accounts, entries])

  const hasData = accounts.length > 0
  const today = new Date().toISOString().slice(0, 10)

  function exportCurrent() {
    if (!hasData) { showToast("No ledger data to export"); return }
    if (tab === "Trial Balance") {
      const csv = toCsv(
        ["Code", "Account", "Type", "Debit", "Credit"],
        [
          ...trial.rows.map((r) => [r.account.code, r.account.name, r.account.account_type, r.debit.toFixed(2), r.credit.toFixed(2)]),
          ["", "TOTAL", "", trial.totalDebit.toFixed(2), trial.totalCredit.toFixed(2)],
        ]
      )
      downloadCsv(`trial-balance-${today}.csv`, csv)
    } else if (tab === "Profit & Loss") {
      const csv = toCsv(
        ["Section", "Account", "Amount"],
        [
          ...pl.income.rows.map((r) => ["Income", r.account.name, r.amount.toFixed(2)]),
          ["Income", "Total Income", pl.income.total.toFixed(2)],
          ...pl.expenses.rows.map((r) => ["Expenses", r.account.name, r.amount.toFixed(2)]),
          ["Expenses", "Total Expenses", pl.expenses.total.toFixed(2)],
          ["", "Net Profit", pl.netProfit.toFixed(2)],
        ]
      )
      downloadCsv(`profit-and-loss-${today}.csv`, csv)
    } else {
      const csv = toCsv(
        ["Section", "Account", "Amount"],
        [
          ...bs.assets.rows.map((r) => ["Assets", r.account.name, r.amount.toFixed(2)]),
          ["Assets", "Total Assets", bs.assets.total.toFixed(2)],
          ...bs.liabilities.rows.map((r) => ["Liabilities", r.account.name, r.amount.toFixed(2)]),
          ["Liabilities", "Total Liabilities", bs.liabilities.total.toFixed(2)],
          ...bs.equity.rows.map((r) => ["Equity", r.account.name, r.amount.toFixed(2)]),
          ["Equity", "Retained Profit (period)", pl.netProfit.toFixed(2)],
          ["Equity", "Total Equity", (bs.equity.total + pl.netProfit).toFixed(2)],
        ]
      )
      downloadCsv(`balance-sheet-${today}.csv`, csv)
    }
    showToast(`${tab} exported`)
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Accounting</span>
            <ChevronRight className="w-3 h-3" />
            <span>Financial Reports</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" size="md">07 · Financial Reports</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
          </div>
          <p className="text-sm text-slate-500">Trial Balance, P&amp;L and Balance Sheet — computed live from posted journal lines.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={exportCurrent} disabled={!hasData}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />} onClick={() => window.print()} disabled={!hasData}>
            Print
          </Button>
        </div>
      </div>

      {/* KPI Row — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AccountingKpiCard label="Total Income" value={fmtGBP(pl.income.total)} subtitle="Period to date" />
        <AccountingKpiCard label="Total Expenses" value={fmtGBP(pl.expenses.total)} subtitle="Period to date" />
        <AccountingKpiCard label="Net Profit" value={fmtGBP(pl.netProfit)} subtitle="Income − Expenses" trendUp={pl.netProfit >= 0} trend={pl.netProfit >= 0 ? "Profit" : "Loss"} />
        <AccountingKpiCard label="Trial Balance" value={Math.abs(trial.totalDebit - trial.totalCredit) < 0.01 ? "Balanced" : "Out of balance"} subtitle={`Dr ${fmtGBP(trial.totalDebit)} / Cr ${fmtGBP(trial.totalCredit)}`} trendNeutral />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-[#E2E8F0] shadow-sm px-2 py-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              tab === t ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Report body */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{tab}</h3>
            <p className="text-xs text-slate-400 mt-0.5">As at {today} · GBP · computed from the ledger</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Computing report from ledger…</div>
        ) : !hasData ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Scale className="w-5 h-5 text-[#2563EB]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No ledger data yet</p>
            <p className="text-xs text-slate-400 max-w-md">
              Reports are derived entirely from your chart of accounts and posted journal lines.
              Create accounts and post entries to generate a live Trial Balance, P&amp;L and Balance Sheet.
            </p>
          </div>
        ) : tab === "Trial Balance" ? (
          <TrialBalanceTable data={trial} />
        ) : tab === "Profit & Loss" ? (
          <PLTable data={pl} />
        ) : (
          <BalanceSheetTable data={bs} netProfit={pl.netProfit} />
        )}
      </div>
    </div>
  )
}

// ─── Trial Balance ────────────────────────────────────────────────────────────

function TrialBalanceTable({ data }: { data: ReturnType<typeof buildTrialBalance> }) {
  const balanced = Math.abs(data.totalDebit - data.totalCredit) < 0.01
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-[#E2E8F0]">
            <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-20">Code</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Account</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Type</th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">Debit</th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">Credit</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.length === 0 ? (
            <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No non-zero balances yet.</td></tr>
          ) : (
            data.rows.map((r) => (
              <tr key={r.account.id} className="border-b border-[#E2E8F0] hover:bg-slate-50/50">
                <td className="px-5 py-3 font-mono text-[13px] text-slate-700">{r.account.code}</td>
                <td className="px-4 py-3 text-[13px] text-slate-900">{r.account.name}</td>
                <td className="px-4 py-3 text-[12px] text-slate-500">{r.account.account_type}</td>
                <td className="px-4 py-3 text-right text-[13px] font-medium text-slate-900">{r.debit > 0 ? fmtGBP(r.debit) : "—"}</td>
                <td className="px-4 py-3 text-right text-[13px] font-medium text-slate-900">{r.credit > 0 ? fmtGBP(r.credit) : "—"}</td>
              </tr>
            ))
          )}
          <tr className="bg-slate-50 border-t-2 border-[#E2E8F0]">
            <td colSpan={3} className="px-5 py-3 text-[13px] font-bold text-slate-900">TOTAL</td>
            <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900">{fmtGBP(data.totalDebit)}</td>
            <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900">{fmtGBP(data.totalCredit)}</td>
          </tr>
        </tbody>
      </table>
      <div className={cn("px-5 py-3 flex items-center gap-2 text-xs font-medium", balanced ? "text-emerald-600" : "text-red-600")}>
        {balanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        {balanced ? "Debits equal credits — the ledger is in balance." : `Out of balance by ${fmtGBP(Math.abs(data.totalDebit - data.totalCredit))}.`}
      </div>
    </div>
  )
}

// ─── P&L ──────────────────────────────────────────────────────────────────────

function PLTable({ data }: { data: ReturnType<typeof buildProfitAndLoss> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          <tr className="bg-blue-50/50 border-b border-[#E2E8F0]">
            <td className="px-5 py-2 text-[11px] font-bold text-[#2563EB] uppercase tracking-wide">Income</td>
            <td className="px-4 py-2" />
          </tr>
          {data.income.rows.length === 0 ? (
            <tr><td colSpan={2} className="px-5 py-3 text-[13px] text-slate-400">No income accounts.</td></tr>
          ) : data.income.rows.map((r) => (
            <tr key={r.account.id} className="border-b border-[#E2E8F0] hover:bg-slate-50/50">
              <td className="px-5 py-3 text-[13px] text-slate-700">{r.account.name}</td>
              <td className="px-4 py-3 text-right text-[13px] text-slate-900">{fmtGBP(r.amount)}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 border-b border-[#E2E8F0]">
            <td className="px-5 py-3 text-[13px] font-bold text-slate-900">Total Income</td>
            <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900">{fmtGBP(data.income.total)}</td>
          </tr>

          <tr className="bg-red-50/50 border-b border-[#E2E8F0]">
            <td className="px-5 py-2 text-[11px] font-bold text-[#EF4444] uppercase tracking-wide">Expenses</td>
            <td className="px-4 py-2" />
          </tr>
          {data.expenses.rows.length === 0 ? (
            <tr><td colSpan={2} className="px-5 py-3 text-[13px] text-slate-400">No expense accounts.</td></tr>
          ) : data.expenses.rows.map((r) => (
            <tr key={r.account.id} className="border-b border-[#E2E8F0] hover:bg-slate-50/50">
              <td className="px-5 py-3 text-[13px] text-slate-700">{r.account.name}</td>
              <td className="px-4 py-3 text-right text-[13px] text-slate-900">{fmtGBP(r.amount)}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 border-b border-[#E2E8F0]">
            <td className="px-5 py-3 text-[13px] font-bold text-slate-900">Total Expenses</td>
            <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900">{fmtGBP(data.expenses.total)}</td>
          </tr>

          <tr className="bg-emerald-50/50 border-t-2 border-[#E2E8F0]">
            <td className="px-5 py-3 text-[13px] font-bold text-slate-900">Net Profit</td>
            <td className={cn("px-4 py-3 text-right text-[13px] font-bold", data.netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>{fmtGBP(data.netProfit)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Balance Sheet ────────────────────────────────────────────────────────────

function BalanceSheetTable({ data, netProfit }: { data: ReturnType<typeof buildBalanceSheet>; netProfit: number }) {
  const Section = ({ title, color, rows, total }: { title: string; color: string; rows: { account: LedgerAccount; amount: number }[]; total: number }) => (
    <>
      <tr className="border-b border-[#E2E8F0]" style={{ backgroundColor: color + "0D" }}>
        <td className="px-5 py-2 text-[11px] font-bold uppercase tracking-wide" style={{ color }}>{title}</td>
        <td className="px-4 py-2" />
      </tr>
      {rows.length === 0 ? (
        <tr><td colSpan={2} className="px-5 py-3 text-[13px] text-slate-400">No {title.toLowerCase()} accounts.</td></tr>
      ) : rows.map((r) => (
        <tr key={r.account.id} className="border-b border-[#E2E8F0] hover:bg-slate-50/50">
          <td className="px-5 py-3 text-[13px] text-slate-700">{r.account.name}</td>
          <td className="px-4 py-3 text-right text-[13px] text-slate-900">{fmtGBP(r.amount)}</td>
        </tr>
      ))}
      <tr className="bg-slate-50 border-b border-[#E2E8F0]">
        <td className="px-5 py-3 text-[13px] font-bold text-slate-900">Total {title}</td>
        <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900">{fmtGBP(total)}</td>
      </tr>
    </>
  )

  const equityWithProfit = data.equity.total + netProfit
  const balances = Math.abs(data.assets.total - (data.liabilities.total + equityWithProfit)) < 0.01

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          <Section title="Assets" color="#2563EB" rows={data.assets.rows} total={data.assets.total} />
          <Section title="Liabilities" color="#EF4444" rows={data.liabilities.rows} total={data.liabilities.total} />
          <Section title="Equity" color="#7C3AED" rows={data.equity.rows} total={data.equity.total} />
          <tr className="border-b border-[#E2E8F0] hover:bg-slate-50/50">
            <td className="px-5 py-3 text-[13px] text-slate-700">Retained Profit (period)</td>
            <td className={cn("px-4 py-3 text-right text-[13px]", netProfit >= 0 ? "text-slate-900" : "text-red-600")}>{fmtGBP(netProfit)}</td>
          </tr>
          <tr className="bg-slate-50 border-t-2 border-[#E2E8F0]">
            <td className="px-5 py-3 text-[13px] font-bold text-slate-900">Liabilities + Equity</td>
            <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900">{fmtGBP(data.liabilities.total + equityWithProfit)}</td>
          </tr>
        </tbody>
      </table>
      <div className={cn("px-5 py-3 flex items-center gap-2 text-xs font-medium", balances ? "text-emerald-600" : "text-amber-600")}>
        {balances ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        {balances ? "Assets equal Liabilities + Equity." : "Assets do not yet equal Liabilities + Equity (post balancing entries)."}
      </div>
    </div>
  )
}
