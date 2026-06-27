"use client"
import { useSectionLink } from "@/components/sections/SectionBasePath"

import { useState } from "react"
import Link from "next/link"
import { Plus, RotateCcw, Lock, FileText, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useJournalEntries, useLedgerRole } from "@/lib/accounting/hooks"
import { reverseJournalEntry, type DB } from "@/lib/accounting/ledger"
import { formatPence } from "@/lib/accounting"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"

type JournalEntry = ReturnType<typeof useJournalEntries>["data"][number]

function StatusChip({ e }: { e: JournalEntry }) {
  if (e.reversed_by) return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">Reversed</span>
  if (e.source_type === "reversal") return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700">Reversal</span>
  if (e.posted) return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">Posted</span>
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Draft</span>
}

export default function JournalPage() {
  const sectionLink = useSectionLink()
  const { workspace } = useWorkspace()
  const { data: entries, loading, refetch } = useJournalEntries()
  const { canPost } = useLedgerRole()
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 3500) }

  async function reverse(entryId: string) {
    if (!workspace?.id) return
    setBusy(entryId)
    try {
      const supabase = createClient() as unknown as DB
      const { data: auth } = await createClient().auth.getUser()
      await reverseJournalEntry(supabase, workspace.id, entryId, { createdBy: auth.user?.id })
      showToast("Entry reversed")
      await refetch()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not reverse entry")
    } finally {
      setBusy(null)
    }
  }

  const cardMapping: MobileCardMapping<JournalEntry> = {
    getKey: (e) => e.id,
    title: (e) => e.memo ?? `Entry #${e.entry_no}`,
    subtitle: (e) => `#${e.entry_no} · ${e.date}`,
    badge: (e) => <StatusChip e={e} />,
    fields: [
      { label: "Source", render: (e) => <span className="capitalize">{(e.source_type ?? "manual").replace(/_/g, " ")}</span> },
      { label: "Amount", render: (e) => <span className="font-semibold tabular-nums">{formatPence(e.total_pence)}</span> },
    ],
    actions: (e) =>
      canPost && e.posted && !e.reversed_by && e.source_type !== "reversal" ? (
        <button
          onClick={() => reverse(e.id)}
          disabled={busy === e.id}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-red-600 disabled:opacity-50 min-h-[44px] px-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> {busy === e.id ? "Reversing…" : "Reverse"}
        </button>
      ) : null,
  }

  return (
    <div className="space-y-6">
      <MobileTopBar
        title="Journal Entries"
        subtitle="General Ledger"
        primaryAction={canPost ? { label: "New journal entry", icon: Plus, href: sectionLink("/property-manager/accounting/ledger/journal/new") } : undefined}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="hidden md:flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Journal Entries</h3>
          <p className="text-sm text-slate-500">{entries.length} entries · posted entries are immutable and corrected by reversal.</p>
        </div>
        {canPost ? (
          <Button variant="primary" size="sm" asChild leftIcon={<Plus className="w-3.5 h-3.5" />}>
            <Link href={sectionLink("/property-manager/accounting/ledger/journal/new")}>New Journal Entry</Link>
          </Button>
        ) : (
          <span className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Read-only access</span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading journal…</div>
        ) : entries.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No journal entries yet</p>
            <p className="text-xs text-slate-500 max-w-sm">Post your first balanced entry to start the ledger.</p>
            {canPost && (
              <Button variant="primary" size="sm" asChild leftIcon={<Plus className="w-3.5 h-3.5" />}>
                <Link href={sectionLink("/property-manager/accounting/ledger/journal/new")}>New Journal Entry</Link>
              </Button>
            )}
          </div>
        ) : (
          <ResponsiveTable rows={entries} mobile={cardMapping} className="p-3">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-20">No.</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-32">Date</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Memo</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Source</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Amount</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">Status</th>
                <th className="px-4 py-2.5 w-28" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3"><span className="font-mono text-[13px] font-semibold text-slate-700">#{e.entry_no}</span></td>
                  <td className="px-4 py-3 text-[13px] text-slate-600">{e.date}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-900">{e.memo ?? "—"}</td>
                  <td className="px-4 py-3"><span className="text-[11px] text-slate-500 capitalize">{(e.source_type ?? "manual").replace(/_/g, " ")}</span></td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-slate-900">{formatPence(e.total_pence)}</td>
                  <td className="px-4 py-3">
                    {e.reversed_by ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">Reversed</span>
                    ) : e.source_type === "reversal" ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700">Reversal</span>
                    ) : e.posted ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">Posted</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canPost && e.posted && !e.reversed_by && e.source_type !== "reversal" && (
                      <button
                        onClick={() => reverse(e.id)}
                        disabled={busy === e.id}
                        className={cn("inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-red-600 disabled:opacity-50")}
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> {busy === e.id ? "Reversing…" : "Reverse"}
                      </button>
                    )}
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
