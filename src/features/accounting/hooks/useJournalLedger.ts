"use client"
import { useState, useEffect, useCallback } from "react"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  fetchAccounts,
  fetchJournalEntries,
  type JournalEntryRow,
  type LedgerAccount,
} from "../ledger"

export interface JournalLedgerEntry {
  id: string
  date: string
  reference: string
  account: string
  counterAccount: string
  description: string
  debit: number | null
  credit: number | null
  property: string
  contact: string
  status: "Posted" | "Pending" | "Reversed"
}

/**
 * Live journal ledger. Returns the raw entries (with nested lines) for posting/
 * reversal flows, the chart of accounts, plus a flattened per-line view for the
 * table. 42P01-safe → empty arrays when tables aren't provisioned.
 */
export function useJournalLedger() {
  const { workspace } = useWorkspace()
  const [entries, setEntries] = useState<JournalEntryRow[]>([])
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!workspace?.id) {
      setEntries([])
      setAccounts([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [accts, ents] = await Promise.all([
        fetchAccounts(workspace.id),
        fetchJournalEntries(workspace.id),
      ])
      setAccounts(accts)
      setEntries(ents)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load journal")
      setEntries([])
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [workspace?.id])

  useEffect(() => {
    refetch()
  }, [refetch])

  // Flattened per-line rows for the ledger table.
  const accountLabel = useCallback(
    (id: string) => {
      const a = accounts.find((x) => x.id === id)
      return a ? `${a.code} ${a.name}` : "—"
    },
    [accounts]
  )

  const rows: JournalLedgerEntry[] = entries.flatMap((e) => {
    const debitLines = e.lines.filter((l) => l.debit > 0)
    const creditLines = e.lines.filter((l) => l.credit > 0)
    const counter = creditLines[0] ?? debitLines[0]
    return e.lines.map((l) => ({
      id: l.id,
      date: e.entry_date,
      reference: e.entry_number ?? e.id.slice(0, 8),
      account: accountLabel(l.account_id),
      counterAccount:
        counter && counter.account_id !== l.account_id ? accountLabel(counter.account_id) : "—",
      description: l.description ?? e.description,
      debit: l.debit > 0 ? l.debit : null,
      credit: l.credit > 0 ? l.credit : null,
      property: "—",
      contact: "—",
      status: e.is_reversed ? "Reversed" : e.is_posted ? "Posted" : "Pending",
    }))
  })

  return { entries, accounts, rows, loading, error, refetch }
}
