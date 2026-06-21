"use client"

import { use, useEffect, useState } from "react"
import { useSectionRouter, useSectionLink } from "@/components/sections/SectionBasePath"
import { ArrowLeft, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { AccountingKpiCard } from "@/features/accounting/components"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { formatPence, toCsv, downloadCsv, isMissingTable } from "@/lib/accounting"
import type { LedgerAccount } from "@/lib/accounting/types"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

interface LedgerRow {
  line_id: string
  entry_id: string
  entry_no: number
  date: string
  memo: string | null
  debit_pence: number
  credit_pence: number
  running_pence: number
}

const TYPE_LABEL: Record<string, string> = {
  asset: "Assets", liability: "Liabilities", equity: "Equity", income: "Income", expense: "Expenses",
}

export default function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params)
  const router = useSectionRouter()
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()
  const [account, setAccount] = useState<LedgerAccount | null>(null)
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!workspace?.id) return
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: acc } = await supabase
          .from("ledger_accounts").select("*")
          .eq("id", accountId).eq("workspace_id", workspace.id).maybeSingle()
        const { data: lines, error } = await supabase
          .from("ledger_journal_lines")
          .select("id, debit_pence, credit_pence, memo, entry_id, ledger_journal_entries!inner(entry_no, date, memo, posted, workspace_id)")
          .eq("workspace_id", workspace.id)
          .eq("account_id", accountId)
          .eq("ledger_journal_entries.posted", true)
        if (error && !isMissingTable(error)) throw error
        if (!active) return
        const a = (acc as LedgerAccount) ?? null
        setAccount(a)
        const normal = a?.normal_side ?? "debit"
        const sorted = ((lines as unknown[]) ?? []).map((r) => {
          const row = r as { id: string; debit_pence: number; credit_pence: number; memo: string | null; entry_id: string; ledger_journal_entries: { entry_no: number; date: string; memo: string | null } }
          return {
            line_id: row.id, entry_id: row.entry_id,
            entry_no: row.ledger_journal_entries.entry_no,
            date: row.ledger_journal_entries.date,
            memo: row.memo ?? row.ledger_journal_entries.memo,
            debit_pence: row.debit_pence, credit_pence: row.credit_pence, running_pence: 0,
          }
        }).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : x.entry_no - y.entry_no))
        let running = 0
        for (const r of sorted) {
          running += normal === "debit" ? r.debit_pence - r.credit_pence : r.credit_pence - r.debit_pence
          r.running_pence = running
        }
        setRows(sorted)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [workspace?.id, accountId])

  const totalDebit = rows.reduce((s, r) => s + r.debit_pence, 0)
  const totalCredit = rows.reduce((s, r) => s + r.credit_pence, 0)
  const balance = rows.length ? rows[rows.length - 1].running_pence : 0

  function exportCsv() {
    const csv = toCsv(
      ["Entry", "Date", "Memo", "Debit", "Credit", "Running Balance"],
      rows.map((r) => [`#${r.entry_no}`, r.date, r.memo, formatPence(r.debit_pence), formatPence(r.credit_pence), formatPence(r.running_pence)])
    )
    downloadCsv(`account-${account?.code ?? accountId}-ledger.csv`, csv)
  }

  const cardMapping: MobileCardMapping<LedgerRow> = {
    getKey: (r) => r.line_id,
    title: (r) => r.memo ?? `Entry #${r.entry_no}`,
    subtitle: (r) => `#${r.entry_no} · ${r.date}`,
    fields: [
      { label: "Debit", render: (r) => <span className="tabular-nums">{r.debit_pence ? formatPence(r.debit_pence) : "—"}</span> },
      { label: "Credit", render: (r) => <span className="tabular-nums">{r.credit_pence ? formatPence(r.credit_pence) : "—"}</span> },
      {
        label: "Running Balance",
        render: (r) => <span className={cn("font-bold tabular-nums", r.running_pence < 0 ? "text-red-600" : "text-slate-900")}>{formatPence(r.running_pence)}</span>,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <MobileTopBar
        title={account ? account.name : "Account"}
        subtitle={account ? account.code : undefined}
        showBack
        backHref={sectionLink("/property-manager/accounting/ledger/chart")}
        overflowActions={rows.length > 0 ? [{ label: "Export CSV", icon: Download, onClick: exportCsv }] : undefined}
      />

      <button onClick={() => router.push("/property-manager/accounting/ledger/chart")} className="hidden md:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to Chart of Accounts
      </button>

      {account && (
        <div className="hidden md:flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-slate-500">{account.code}</span>
              <h2 className="text-xl font-bold text-slate-900">{account.name}</h2>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 capitalize">
              {TYPE_LABEL[account.type] ?? account.type} · {account.normal_side}-normal
            </p>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={exportCsv} disabled={rows.length === 0}>
            Export
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AccountingKpiCard label="Total Debits" value={formatPence(totalDebit)} subtitle={`${rows.length} lines`} />
        <AccountingKpiCard label="Total Credits" value={formatPence(totalCredit)} subtitle={`${rows.length} lines`} />
        <AccountingKpiCard label="Closing Balance" value={formatPence(balance)} subtitle="Natural orientation" />
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading ledger…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No posted lines for this account yet.</div>
        ) : (
          <ResponsiveTable rows={rows} mobile={cardMapping} className="p-3">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-20">Entry</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-32">Date</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Memo</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-32">Debit</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-32">Credit</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.line_id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3"><span className="font-mono text-[13px] font-semibold text-slate-700">#{r.entry_no}</span></td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">{r.date}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-900">{r.memo ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-900">{r.debit_pence ? formatPence(r.debit_pence) : "—"}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-900">{r.credit_pence ? formatPence(r.credit_pence) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("text-[13px] font-bold", r.running_pence < 0 ? "text-red-600" : "text-slate-900")}>{formatPence(r.running_pence)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </ResponsiveTable>
        )}
      </div>
    </div>
  )
}
