"use client"
import { useState, useEffect, useCallback } from "react"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  fetchAccounts,
  fetchJournalEntries,
  computeBalances,
  type LedgerAccount,
} from "../ledger"

export interface AccountOverviewRow {
  id: string
  code: string
  name: string
  account_type: "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses"
  subcategory: string
  opening_balance: number
  current_balance: number
  property_scope: string
  status: "Active" | "Inactive"
  currency: string
}

/**
 * Live chart of accounts with current balances computed from the posted ledger
 * (journal_lines). 42P01-safe: missing tables resolve to an empty list so the
 * UI shows an honest empty state rather than fabricated balances.
 */
export function useAccountsOverview() {
  const { workspace } = useWorkspace()
  const [data, setData] = useState<AccountOverviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!workspace?.id) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [accounts, entries] = await Promise.all([
        fetchAccounts(workspace.id),
        fetchJournalEntries(workspace.id),
      ])
      const balances = computeBalances(accounts, entries)
      setData(
        accounts.map((a: LedgerAccount) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          account_type: a.account_type,
          subcategory: a.subcategory ?? "",
          opening_balance: a.opening_balance,
          current_balance: balances.get(a.id)?.balance ?? a.opening_balance,
          property_scope: a.property_scope ?? "",
          status: a.status,
          currency: a.currency,
        }))
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load accounts")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [workspace?.id])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
