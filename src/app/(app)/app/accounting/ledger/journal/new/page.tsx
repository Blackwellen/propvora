"use client"

import { useMemo, useState } from "react"
import { useSectionRouter, useSectionLink } from "@/components/sections/SectionBasePath"
import { Plus, Trash2, ArrowLeft, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useLedgerAccounts, useLedgerRole } from "@/lib/accounting/hooks"
import { postJournalEntry, checkBalance, type DB } from "@/lib/accounting/ledger"
import { parsePoundsToPence, formatPence } from "@/lib/accounting/money"
import type { DraftLine } from "@/lib/accounting/types"
import MobileTopBar from "@/components/mobile/MobileTopBar"

interface EditableLine {
  id: string
  account_id: string
  side: "debit" | "credit"
  amount: string // pounds string as typed
  memo: string
}

function blankLine(): EditableLine {
  return { id: crypto.randomUUID(), account_id: "", side: "debit", amount: "", memo: "" }
}

export default function NewJournalEntryPage() {
  const router = useSectionRouter()
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()
  const { data: accounts } = useLedgerAccounts()
  const { canPost, loading: roleLoading } = useLedgerRole()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [memo, setMemo] = useState("")
  const [lines, setLines] = useState<EditableLine[]>([blankLine(), blankLine()])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const draftLines: DraftLine[] = useMemo(
    () =>
      lines.map((l) => {
        const pence = parsePoundsToPence(l.amount)
        return {
          account_id: l.account_id,
          debit_pence: l.side === "debit" ? pence : 0,
          credit_pence: l.side === "credit" ? pence : 0,
          memo: l.memo || null,
        }
      }),
    [lines]
  )

  const balance = useMemo(() => checkBalance(draftLines), [draftLines])
  const canSave = balance.balanced && balance.lineCount >= 2 && lines.every((l) => !l.amount || l.account_id)

  function update(id: string, patch: Partial<EditableLine>) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }
  function addLine() { setLines((ls) => [...ls, blankLine()]) }
  function removeLine(id: string) { setLines((ls) => (ls.length <= 2 ? ls : ls.filter((l) => l.id !== id))) }

  async function post() {
    if (!workspace?.id || !canSave) return
    setPosting(true); setError(null)
    try {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      await postJournalEntry(supabase as unknown as DB, {
        workspaceId: workspace.id,
        date,
        memo: memo || null,
        sourceType: "manual",
        createdBy: auth.user?.id ?? null,
        lines: draftLines.filter((l) => l.account_id && (l.debit_pence > 0 || l.credit_pence > 0)),
      })
      router.push("/property-manager/accounting/ledger/journal")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post entry")
      setPosting(false)
    }
  }

  if (!roleLoading && !canPost) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 flex flex-col items-center gap-3 text-center">
        <Lock className="w-6 h-6 text-slate-400" />
        <p className="text-sm font-semibold text-slate-700">Posting is restricted</p>
        <p className="text-xs text-slate-500 max-w-sm">Only finance-capable roles (owner, admin, manager, accountant) can post journal entries.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/property-manager/accounting/ledger/journal")}>Back to Journal</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <MobileTopBar title="New Journal Entry" subtitle="General Ledger" showBack backHref={sectionLink("/property-manager/accounting/ledger/journal")} />

      <button onClick={() => router.back()} className="hidden md:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 space-y-4">
        <h3 className="text-base font-semibold text-slate-900">New Journal Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="h-9 px-3 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30" />
          </label>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Memo</span>
            <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What is this entry for?"
              className="h-9 px-3 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30" />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Lines</h3>
            <p className="text-xs text-slate-500 mt-0.5">Debits must equal credits before you can post.</p>
          </div>
          <button onClick={addLine} className="h-8 px-3 rounded-lg bg-[var(--brand)] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[var(--brand-strong)]">
            <Plus className="w-3.5 h-3.5" /> Add Line
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Account</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Side</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-36">Amount (£)</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Memo</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-[#E2E8F0] hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <select value={l.account_id} onChange={(e) => update(l.id, { account_id: e.target.value })}
                      className="w-full h-9 px-2 rounded-lg border border-[#E2E8F0] text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[var(--brand)] min-w-[200px]">
                      <option value="">Select account…</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => update(l.id, { side: l.side === "debit" ? "credit" : "debit" })}
                      className={cn("px-3 py-1 rounded-full text-[11px] font-semibold w-full",
                        l.side === "debit" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-600 hover:bg-red-100")}>
                      {l.side === "debit" ? "Debit" : "Credit"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <input inputMode="decimal" value={l.amount} onChange={(e) => update(l.id, { amount: e.target.value })} placeholder="0.00"
                      className="w-full h-9 px-2 rounded-lg border border-[#E2E8F0] text-xs text-right text-slate-900 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]" />
                  </td>
                  <td className="px-4 py-2.5">
                    <input value={l.memo} onChange={(e) => update(l.id, { memo: e.target.value })} placeholder="Optional…"
                      className="w-full h-9 px-2 rounded-lg border border-[#E2E8F0] text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]" />
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => removeLine(l.id)} disabled={lines.length <= 2}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live balance bar */}
        <div className="px-5 py-4 border-t border-[#E2E8F0] bg-slate-50/50 flex flex-wrap items-center gap-6 sm:gap-8">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total Debits</span>
            <span className="text-base font-bold text-emerald-600">{formatPence(balance.totalDebit)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total Credits</span>
            <span className="text-base font-bold text-red-600">{formatPence(balance.totalCredit)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Balance</span>
            <span className={cn("text-base font-bold", balance.balanced ? "text-emerald-600" : "text-red-500")}>
              {balance.balanced ? "✓ Balanced" : `${formatPence(Math.abs(balance.difference))} out`}
            </span>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/property-manager/accounting/ledger/journal")}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={post} loading={posting} disabled={!canSave}>
          Post Entry
        </Button>
      </div>
      {!canSave && (
        <p className="text-right text-xs text-slate-500">
          {balance.lineCount < 2 ? "Add at least two lines with amounts." : !balance.balanced ? "Debits must equal credits to post." : "Every line with an amount needs an account."}
        </p>
      )}
    </div>
  )
}
