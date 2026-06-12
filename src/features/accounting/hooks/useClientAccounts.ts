"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { isMissingTable } from "../ledger"

export interface ClientAccount {
  id: string
  initials: string
  color: string
  name: string
  code: string
  balance: number
  ringfenced: boolean
  health: "Excellent" | "Good" | "Fair" | "Needs Attention"
}

const PALETTE = ["#2563EB", "#10B981", "#7C3AED", "#F59E0B", "#EF4444", "#0EA5E9", "#DB2777"]

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Live client (landlord) money accounts — ringfenced balances. 42P01-safe →
 * empty list so the register shows an honest empty state.
 */
export function useClientAccounts() {
  const { workspace } = useWorkspace()
  const [data, setData] = useState<ClientAccount[]>([])
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
      const supabase = createClient()
      const { data: rows, error: err } = await supabase
        .from("accounting_client_accounts")
        .select("id, client_name, account_code, balance, ringfenced, health, created_at")
        .eq("workspace_id", workspace.id)
        .order("balance", { ascending: false })

      if (err) {
        if (isMissingTable(err)) {
          setData([])
          return
        }
        throw err
      }
      setData(
        (rows ?? []).map((r: Record<string, unknown>, i: number) => ({
          id: r.id as string,
          name: (r.client_name as string) ?? "Unnamed client",
          code: (r.account_code as string) ?? "—",
          balance: Number(r.balance ?? 0),
          ringfenced: r.ringfenced !== false,
          health: ((r.health as string) ?? "Good") as ClientAccount["health"],
          initials: initialsOf((r.client_name as string) ?? "C"),
          color: PALETTE[i % PALETTE.length],
        }))
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load client accounts")
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
