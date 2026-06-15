"use client"
// Client hooks for the canonical ledger. All reads are RLS-scoped via the
// browser supabase client. Missing tables (42P01) resolve to empty state so
// the UI is honest rather than fabricating balances.

import { useCallback, useEffect, useState } from "react"
import { useWorkspace } from "@/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import {
  computeTrialBalance,
  isMissingTable,
  type DB,
} from "./ledger"
import { canPostLedger } from "./permissions"
import type {
  JournalEntry,
  LedgerAccount,
  TrialBalance,
} from "./types"

/** The current user's role in the active workspace + derived finance capability. */
export function useLedgerRole() {
  const { workspace } = useWorkspace()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!workspace?.id) {
        setRole(null)
        setLoading(false)
        return
      }
      try {
        const supabase = createClient()
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) {
          if (active) { setRole(null); setLoading(false) }
          return
        }
        const { data } = await supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", workspace.id)
          .eq("user_id", auth.user.id)
          .maybeSingle()
        if (active) {
          setRole((data?.role as string) ?? null)
          setLoading(false)
        }
      } catch {
        if (active) { setRole(null); setLoading(false) }
      }
    })()
    return () => { active = false }
  }, [workspace?.id])

  return { role, canPost: canPostLedger(role), loading }
}

/** Live chart of accounts for the active workspace. */
export function useLedgerAccounts() {
  const { workspace } = useWorkspace()
  const [data, setData] = useState<LedgerAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!workspace?.id) { setData([]); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const { data: rows, error: err } = await supabase
        .from("ledger_accounts")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("code", { ascending: true })
      if (err) {
        if (isMissingTable(err)) { setData([]); return }
        throw err
      }
      setData((rows as LedgerAccount[]) ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [workspace?.id])

  useEffect(() => { refetch() }, [refetch])
  return { data, loading, error, refetch }
}

export interface JournalEntryWithMeta extends JournalEntry {
  line_count: number
  total_pence: number
}

/** Live journal entries (newest first) with per-entry totals. */
export function useJournalEntries() {
  const { workspace } = useWorkspace()
  const [data, setData] = useState<JournalEntryWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!workspace?.id) { setData([]); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const { data: entries, error: err } = await supabase
        .from("ledger_journal_entries")
        .select("*, ledger_journal_lines(debit_pence)")
        .eq("workspace_id", workspace.id)
        .order("entry_no", { ascending: false })
      if (err) {
        if (isMissingTable(err)) { setData([]); return }
        throw err
      }
      const rows = ((entries as unknown[]) ?? []).map((r) => {
        const e = r as JournalEntry & { ledger_journal_lines: { debit_pence: number }[] }
        const lines = e.ledger_journal_lines ?? []
        return {
          ...e,
          line_count: lines.length,
          total_pence: lines.reduce((s, l) => s + (l.debit_pence || 0), 0),
        } as JournalEntryWithMeta
      })
      setData(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load journal")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [workspace?.id])

  useEffect(() => { refetch() }, [refetch])
  return { data, loading, error, refetch }
}

/** Live trial balance computed from posted lines. */
export function useTrialBalance(upToDate?: string) {
  const { workspace } = useWorkspace()
  const [data, setData] = useState<TrialBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!workspace?.id) { setData(null); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const supabase = createClient() as unknown as DB
      const tb = await computeTrialBalance(supabase, workspace.id, upToDate)
      setData(tb)
    } catch (e) {
      if (isMissingTable(e)) { setData({ rows: [], total_debit_pence: 0, total_credit_pence: 0, balanced: true }); }
      else setError(e instanceof Error ? e.message : "Failed to compute trial balance")
    } finally {
      setLoading(false)
    }
  }, [workspace?.id, upToDate])

  useEffect(() => { refetch() }, [refetch])
  return { data, loading, error, refetch }
}
