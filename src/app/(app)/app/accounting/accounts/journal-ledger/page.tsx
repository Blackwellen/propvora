"use client"
import { useSectionLink } from "@/components/sections/SectionBasePath"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Download,
  Plus,
  FileText,
  AlertTriangle,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Copy,
  CheckCircle2,
  X,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { AccountingKpiCard } from "@/features/accounting/components"
import { useJournalLedger } from "@/features/accounting/hooks"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  postJournalEntry,
  reverseJournalEntry,
  fmtGBP,
  toCsv,
  downloadCsv,
  type JournalEntryRow,
  type LedgerAccount,
  type DraftLine,
} from "@/features/accounting/ledger"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(n: number | null): string {
  if (n === null) return "—"
  return fmtGBP(n)
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Posted":
      return "bg-[#ECFDF5] text-[#059669]"
    case "Pending":
      return "bg-[#FFFBEB] text-[#d97706]"
    case "Reversed":
      return "bg-slate-100 text-slate-500"
    default:
      return "bg-slate-100 text-slate-600"
  }
}

// ─── New Journal Entry modal (balanced double-entry posting) ──────────────────

interface DraftRow {
  id: string
  account_id: string
  side: "debit" | "credit"
  amount: string
  description: string
}

function newRow(): DraftRow {
  return { id: crypto.randomUUID(), account_id: "", side: "debit", amount: "", description: "" }
}

function NewEntryModal({
  accounts,
  onClose,
  onPost,
}: {
  accounts: LedgerAccount[]
  onClose: () => void
  onPost: (input: { entry_date: string; description: string; lines: DraftLine[] }) => Promise<{ ok: boolean; error?: string }>
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState("")
  const [rows, setRows] = useState<DraftRow[]>([newRow(), newRow()])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalDebit = rows.reduce((s, r) => s + (r.side === "debit" ? parseFloat(r.amount) || 0 : 0), 0)
  const totalCredit = rows.reduce((s, r) => s + (r.side === "credit" ? parseFloat(r.amount) || 0 : 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0

  function update(id: string, patch: Partial<DraftRow>) {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function remove(id: string) {
    setRows((p) => (p.length > 2 ? p.filter((r) => r.id !== id) : p))
  }

  async function submit() {
    setError(null)
    if (!description.trim()) { setError("Add a description for this entry."); return }
    const lines: DraftLine[] = rows
      .filter((r) => r.account_id && (parseFloat(r.amount) || 0) > 0)
      .map((r) => ({
        account_id: r.account_id,
        debit: r.side === "debit" ? parseFloat(r.amount) || 0 : 0,
        credit: r.side === "credit" ? parseFloat(r.amount) || 0 : 0,
        description: r.description || undefined,
      }))
    setPosting(true)
    const res = await onPost({ entry_date: date, description: description.trim(), lines })
    setPosting(false)
    if (!res.ok) { setError(res.error ?? "Could not post entry"); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">New Journal Entry</h2>
            <p className="text-xs text-slate-500 mt-0.5">Debits must equal credits before the entry can be posted.</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {accounts.length === 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                No accounts found. Create accounts in your chart of accounts before posting journal entries.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Entry Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Rent received — Unit 12"
                className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
              />
            </div>
          </div>

          {/* Lines */}
          <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase">Account</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase">Line description</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase w-24">Side</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold text-slate-500 uppercase w-28">Amount</th>
                  <th className="px-2 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#E2E8F0] last:border-0">
                    <td className="px-3 py-2">
                      <select
                        value={r.account_id}
                        onChange={(e) => update(r.id, { account_id: e.target.value })}
                        className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[var(--brand)] min-w-[160px]"
                      >
                        <option value="">Select account…</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.code} {a.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.description}
                        onChange={(e) => update(r.id, { description: e.target.value })}
                        placeholder="Optional…"
                        className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => update(r.id, { side: r.side === "debit" ? "credit" : "debit" })}
                        className={cn(
                          "px-3 py-1 rounded-full text-[11px] font-semibold transition-colors w-full",
                          r.side === "debit" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100"
                        )}
                      >
                        {r.side === "debit" ? "Debit" : "Credit"}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.amount}
                        onChange={(e) => update(r.id, { amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] text-xs text-right text-slate-900 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => remove(r.id)}
                        disabled={rows.length <= 2}
                        aria-label="Remove line"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="px-3 py-2 border-t border-[#E2E8F0]">
              <button onClick={() => setRows((p) => [...p, newRow()])} className="text-xs font-medium text-[var(--brand)] hover:underline">
                + Add line
              </button>
            </div>
          </div>

          {/* Balance status */}
          <div className="flex items-center gap-6 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Total Debits</p>
              <p className="text-sm font-bold text-emerald-600">{fmtGBP(totalDebit)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Total Credits</p>
              <p className="text-sm font-bold text-red-600">{fmtGBP(totalCredit)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Balance</p>
              <p className={cn("text-sm font-bold", balanced ? "text-emerald-600" : "text-red-500")}>
                {balanced ? "✓ Balanced" : `${fmtGBP(Math.abs(totalDebit - totalCredit))} out`}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
          <p className="text-xs text-slate-500">Posted entries are immutable — correct via reversal.</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={submit} disabled={!balanced || posting || accounts.length === 0}>
              {posting ? "Posting…" : "Post Entry"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JournalLedgerPage() {
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()
  const { entries, accounts, rows, loading, refetch } = useJournalLedger()
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(m: string) { setToastMsg(m); setTimeout(() => setToastMsg(null), 3500) }

  // Filtered flat rows.
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !r.description.toLowerCase().includes(q) &&
          !r.reference.toLowerCase().includes(q) &&
          !r.account.toLowerCase().includes(q)
        ) return false
      }
      if (dateFrom && r.date < dateFrom) return false
      if (dateTo && r.date > dateTo) return false
      return true
    })
  }, [rows, search, dateFrom, dateTo])

  // Live KPIs from posted ledger lines.
  const kpis = useMemo(() => {
    const posted = entries.filter((e) => e.is_posted && !e.is_reversed)
    let debit = 0, credit = 0
    for (const e of posted) for (const l of e.lines) { debit += l.debit; credit += l.credit }
    return {
      entryCount: entries.length,
      postedCount: posted.length,
      reversedCount: entries.filter((e) => e.is_reversed).length,
      debit,
      credit,
      net: debit - credit,
    }
  }, [entries])

  async function handlePost(input: { entry_date: string; description: string; lines: DraftLine[] }) {
    if (!workspace?.id) return { ok: false, error: "No active workspace." }
    const res = await postJournalEntry(workspace.id, input)
    if (res.ok) {
      showToast("Journal entry posted")
      refetch()
    }
    return res
  }

  async function handleReverse(entry: JournalEntryRow) {
    if (!workspace?.id) return
    const res = await reverseJournalEntry(workspace.id, entry)
    if (res.ok) { showToast("Entry reversed"); refetch() }
    else showToast(res.error ?? "Could not reverse")
  }

  function exportCsv() {
    if (filtered.length === 0) { showToast("Nothing to export"); return }
    const csv = toCsv(
      ["Date", "Reference", "Account", "Counter Account", "Description", "Debit", "Credit", "Status"],
      filtered.map((r) => [
        r.date, r.reference, r.account, r.counterAccount, r.description,
        r.debit != null ? r.debit.toFixed(2) : "",
        r.credit != null ? r.credit.toFixed(2) : "",
        r.status,
      ])
    )
    downloadCsv(`journal-ledger-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    showToast("Journal exported")
  }

  // Map a flat row back to its entry for reversal.
  const entryByLineId = useMemo(() => {
    const m = new Map<string, JournalEntryRow>()
    for (const e of entries) for (const l of e.lines) m.set(l.id, e)
    return m
  }, [entries])

  type LedgerLineRow = typeof rows[number]
  const cardMapping: MobileCardMapping<LedgerLineRow> = {
    getKey: (r) => r.id,
    title: (r) => r.description,
    subtitle: (r) => `${r.reference} · ${r.date}`,
    badge: (r) => <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", statusBadgeClass(r.status))}>{r.status}</span>,
    fields: [
      { label: "Account", render: (r) => r.account },
      { label: "Counter Account", render: (r) => r.counterAccount },
      { label: "Debit", render: (r) => r.debit !== null ? <span className="font-semibold tabular-nums">{fmtAmount(r.debit)}</span> : "—" },
      { label: "Credit", render: (r) => r.credit !== null ? <span className="font-semibold tabular-nums">{fmtAmount(r.credit)}</span> : "—" },
    ],
    actions: (r) => {
      const fullEntry = entryByLineId.get(r.id)
      return (
        <ConfirmDialog
          title="Reverse this entry?"
          description="Posted entries are immutable. A balanced reversing entry will be created, leaving an audit trail."
          confirmLabel="Reverse"
          confirmVariant="primary"
          onConfirm={async () => { if (fullEntry) await handleReverse(fullEntry) }}
        >
          {(open) => (
            <ActionMenu
              items={[
                { label: "Copy Reference", icon: Copy, onClick: () => { navigator.clipboard?.writeText(r.reference); showToast("Reference copied") } },
                { label: "View Account", icon: Eye, onClick: () => showToast(r.account) },
                ...(fullEntry && fullEntry.is_posted && !fullEntry.is_reversed
                  ? [{ label: "Reverse Entry", icon: RotateCcw, onClick: open }]
                  : []),
              ]}
            />
          )}
        </ConfirmDialog>
      )
    },
  }

  const mobileEmpty = (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-10 flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center">
        <FileText className="w-5 h-5 text-[var(--brand)]" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{rows.length === 0 ? "No journal entries yet" : "No entries match your filters"}</p>
      <p className="text-xs text-slate-500 max-w-sm">
        {rows.length === 0
          ? "Post your first balanced double-entry transaction to start building the ledger."
          : "Adjust your date range or search to see entries."}
      </p>
      {rows.length === 0 && (
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNew(true)}>
          Post First Entry
        </Button>
      )}
    </div>
  )

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {showNew && (
        <NewEntryModal accounts={accounts} onClose={() => setShowNew(false)} onPost={handlePost} />
      )}

      <MobileTopBar
        title="Journal Ledger"
        subtitle="Accounting"
        primaryAction={{ label: "New journal entry", icon: Plus, onClick: () => setShowNew(true) }}
        overflowActions={filtered.length > 0 ? [{ label: "Export CSV", icon: Download, onClick: exportCsv }] : undefined}
      />

      {/* Page Header */}
      <div className="hidden md:flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Accounting</span>
            <ChevronRight className="w-3 h-3" />
            <span>Journal Ledger</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" size="md">Journal Ledger</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Journal Ledger</h1>
          </div>
          <p className="text-sm text-slate-500">
            Double-entry journal — every entry is balanced (debits = credits) and posted entries are immutable.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={exportCsv} disabled={filtered.length === 0}>
            Export
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNew(true)}>
            New Journal Entry
          </Button>
        </div>
      </div>

      {/* KPI Row — live */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <AccountingKpiCard label="Entries" value={String(kpis.entryCount)} subtitle={`${kpis.postedCount} posted`} icon={<FileText className="w-5 h-5" />} iconBg="bg-[var(--brand-soft)]" iconColor="text-[var(--brand)]" />
        <AccountingKpiCard label="Total Debits" value={fmtGBP(kpis.debit)} subtitle="Posted ledger" icon={<ArrowDownLeft className="w-5 h-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <AccountingKpiCard label="Total Credits" value={fmtGBP(kpis.credit)} subtitle="Posted ledger" icon={<ArrowUpRight className="w-5 h-5" />} iconBg="bg-[var(--brand-soft)]" iconColor="text-[var(--brand)]" />
        <AccountingKpiCard label="Net Movement" value={fmtGBP(kpis.net)} subtitle="Debits − Credits" icon={<Activity className="w-5 h-5" />} iconBg="bg-violet-50" iconColor="text-violet-600" />
        <AccountingKpiCard label="Reversed" value={String(kpis.reversedCount)} subtitle="Reversal entries" icon={<AlertTriangle className="w-5 h-5" />} iconBg="bg-amber-50" iconColor="text-amber-500" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30" />
            <span className="text-slate-500 text-sm">–</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30" />
          </div>
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries, references, accounts…"
              className="w-full h-9 pl-3 pr-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setDateFrom(""); setDateTo("") }}>
            Reset
          </Button>
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <ResponsiveTable
          rows={loading ? [] : filtered}
          mobile={cardMapping}
          emptyState={loading ? <div className="p-10 text-center text-slate-400 text-sm">Loading journal…</div> : mobileEmpty}
          className="p-3"
        >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Reference</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Account</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Counter Account</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Debit</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Credit</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-24">Status</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">Loading journal…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[var(--brand)]" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {rows.length === 0 ? "No journal entries yet" : "No entries match your filters"}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {rows.length === 0
                          ? "Post your first balanced double-entry transaction to start building the ledger. Trial balance and reports compute from these lines."
                          : "Adjust your date range or search to see entries."}
                      </p>
                      {rows.length === 0 && (
                        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowNew(true)}>
                          Post First Entry
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((entry, idx) => {
                  const fullEntry = entryByLineId.get(entry.id)
                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        "border-b border-[#E2E8F0] hover:bg-slate-50/50 transition-colors",
                        idx === filtered.length - 1 && "border-0"
                      )}
                    >
                      <td className="px-4 py-3.5 text-[13px] text-slate-600 whitespace-nowrap">{entry.date}</td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => { navigator.clipboard?.writeText(entry.reference); showToast(`Reference ${entry.reference} copied`) }}
                          className="text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] hover:underline transition-colors font-mono"
                        >
                          {entry.reference}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-700 whitespace-nowrap">{entry.account}</td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-500 whitespace-nowrap">{entry.counterAccount}</td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-700 max-w-[220px]"><span className="truncate block">{entry.description}</span></td>
                      <td className="px-4 py-3.5 text-right">
                        {entry.debit !== null ? <span className="text-[13px] font-semibold text-slate-900">{fmtAmount(entry.debit)}</span> : <span className="text-slate-300 text-[13px]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {entry.credit !== null ? <span className="text-[13px] font-semibold text-slate-900">{fmtAmount(entry.credit)}</span> : <span className="text-slate-300 text-[13px]">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", statusBadgeClass(entry.status))}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <ConfirmDialog
                          title="Reverse this entry?"
                          description="Posted entries are immutable. A balanced reversing entry will be created, leaving an audit trail."
                          confirmLabel="Reverse"
                          confirmVariant="primary"
                          onConfirm={async () => { if (fullEntry) await handleReverse(fullEntry) }}
                        >
                          {(open) => (
                            <ActionMenu
                              items={[
                                { label: "Copy Reference", icon: Copy, onClick: () => { navigator.clipboard?.writeText(entry.reference); showToast("Reference copied") } },
                                { label: "View Account", icon: Eye, onClick: () => showToast(entry.account) },
                                ...(fullEntry && fullEntry.is_posted && !fullEntry.is_reversed
                                  ? [{ label: "Reverse Entry", icon: RotateCcw, onClick: open }]
                                  : []),
                              ]}
                            />
                          )}
                        </ConfirmDialog>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        </ResponsiveTable>

        {filtered.length > 0 && (
          <div className="px-5 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs text-slate-500">Showing {filtered.length} of {rows.length} ledger lines</span>
            <Link href={sectionLink("/property-manager/accounting/reports")} className="text-xs font-medium text-[var(--brand)] hover:underline">
              View Trial Balance & Reports →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
