"use client"

// Client data hooks for the Smart Rules section. Read-only via the cookie-scoped
// (RLS) browser client; all mutations go through server actions.

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { SmartRule, SmartRuleRun } from "@/lib/automation/types"

export interface RunWithRule extends SmartRuleRun {
  rule?: Pick<SmartRule, "id" | "name" | "trigger_type" | "action_type"> | null
  action?: { action_type: string; payload: Record<string, unknown>; status: string; result: Record<string, unknown> | null } | null
}

export function useRules(workspaceId: string | undefined) {
  const [rules, setRules] = useState<SmartRule[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) { setLoading(false); return }
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("smart_rules")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
      setRules((data as SmartRule[]) ?? [])
    } catch {
      // 42P01 / RLS — honest empty.
      setRules([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { void load() }, [load])
  return { rules, loading, reload: load }
}

export function useRuns(workspaceId: string | undefined) {
  const [runs, setRuns] = useState<RunWithRule[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) { setLoading(false); return }
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("smart_rule_runs")
        .select("*, rule:smart_rules(id, name, trigger_type, action_type), action:smart_rule_actions(action_type, payload, status, result)")
        .eq("workspace_id", workspaceId)
        .order("triggered_at", { ascending: false })
        .limit(200)
      const rows = (data as unknown as Array<RunWithRule & { action: RunWithRule["action"][] }>) ?? []
      setRuns(
        rows.map((r) => ({ ...r, action: Array.isArray(r.action) ? (r.action[0] ?? null) : r.action })) as RunWithRule[],
      )
    } catch {
      setRuns([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { void load() }, [load])
  return { runs, loading, reload: load }
}
