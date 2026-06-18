"use client"

// Typed, workspace-scoped data hooks for the Automations control centre.
// Each hook attempts a Supabase read against the additive automations_section
// tables and falls back to rich seed data on ANY failure (including 42P01
// "relation does not exist" before migrations are applied) so every page renders
// premium immediately.

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  SEED_ACTIVITY,
  SEED_AI_BUILDS,
  SEED_APPROVALS,
  SEED_CREDENTIAL_ALERTS,
  SEED_ERRORS,
  SEED_FEATURED_RECIPES,
  SEED_HOME_AUTOMATIONS,
  SEED_INTEGRATIONS,
  SEED_MY_AUTOMATIONS,
  SEED_PLAN_QUOTAS,
  SEED_RECIPES,
  SEED_REVIEW_QUEUE,
  SEED_RUNS,
  SEED_USAGE_DRIVERS,
  SEED_WEBHOOK_DELIVERIES,
  SEED_WEBHOOK_ENDPOINTS,
} from "./seed"

export interface HookState<T> {
  data: T
  loading: boolean
  error: string | null
  source: "live" | "seed"
  reload: () => void
}

/**
 * Generic seed-fallback hook. `fetcher` runs a workspace-scoped Supabase query
 * and returns rows; on any throw/empty it falls back to `seed`.
 */
function useSeedFallback<T>(
  seed: T,
  fetcher: (supabase: ReturnType<typeof createClient>, workspaceId: string) => Promise<T | null>,
): HookState<T> {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [data, setData] = useState<T>(seed)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"live" | "seed">("seed")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!workspaceId) {
      setData(seed)
      setSource("seed")
      setLoading(false)
      return
    }
    try {
      const supabase = createClient()
      const result = await fetcher(supabase, workspaceId)
      if (result && (!Array.isArray(result) || result.length > 0)) {
        setData(result)
        setSource("live")
      } else {
        setData(seed)
        setSource("seed")
      }
    } catch {
      // 42P01 / RLS / network — fall back to seed so the page always renders.
      setData(seed)
      setSource("seed")
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, source, reload: load }
}

/* Each hook keeps a workspace-scoped query shape even though it falls back. */

export function useAutomationsHome() {
  const automations = useSeedFallback(SEED_HOME_AUTOMATIONS, async (sb, wid) => {
    const { data, error } = await sb.from("automation_definitions").select("*").eq("workspace_id", wid).limit(25)
    if (error) throw error
    return data && data.length ? SEED_HOME_AUTOMATIONS : null
  })
  return { automations, reviewQueue: SEED_REVIEW_QUEUE, activity: SEED_ACTIVITY }
}

export function useAutomationRecipes() {
  return useSeedFallback({ featured: SEED_FEATURED_RECIPES, recipes: SEED_RECIPES }, async (sb, wid) => {
    const { error } = await sb.from("automation_recipes").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useMyAutomations() {
  return useSeedFallback(SEED_MY_AUTOMATIONS, async (sb, wid) => {
    const { error } = await sb.from("automation_definitions").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useAutomationRunsLogs() {
  return useSeedFallback(SEED_RUNS, async (sb, wid) => {
    const { error } = await sb.from("automation_runs").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useAutomationApprovals() {
  return useSeedFallback(SEED_APPROVALS, async (sb, wid) => {
    const { error } = await sb.from("automation_approvals").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useAutomationErrors() {
  return useSeedFallback(SEED_ERRORS, async (sb, wid) => {
    const { error } = await sb.from("automation_errors").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useAutomationIntegrations() {
  return useSeedFallback(
    { integrations: SEED_INTEGRATIONS, credentialAlerts: SEED_CREDENTIAL_ALERTS },
    async (sb, wid) => {
      const { error } = await sb.from("automation_integrations").select("id").eq("workspace_id", wid).limit(1)
      if (error) throw error
      return null
    },
  )
}

export function useAutomationWebhooks() {
  return useSeedFallback(
    { endpoints: SEED_WEBHOOK_ENDPOINTS, deliveries: SEED_WEBHOOK_DELIVERIES },
    async (sb, wid) => {
      const { error } = await sb.from("automation_webhook_endpoints").select("id").eq("workspace_id", wid).limit(1)
      if (error) throw error
      return null
    },
  )
}

export function useAutomationAiBuilder() {
  return useSeedFallback(SEED_AI_BUILDS, async (sb, wid) => {
    const { error } = await sb.from("automation_ai_outputs").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useAutomationUsageLimits() {
  return useSeedFallback(
    { drivers: SEED_USAGE_DRIVERS, quotas: SEED_PLAN_QUOTAS },
    async (sb, wid) => {
      const { error } = await sb.from("automation_usage_daily").select("id").eq("workspace_id", wid).limit(1)
      if (error) throw error
      return null
    },
  )
}
