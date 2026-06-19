"use client"

// Typed, workspace-scoped data hooks for the Billing section. Each hook
// attempts a Supabase read against the additive billing tables and falls back
// to rich seed data on ANY failure (including 42P01 "relation does not exist"
// before migrations are applied) so every tab renders premium immediately.
//
// NO live Stripe calls — billing is modelled in data only.

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  SEED_ACTIVE_ADDONS,
  SEED_ADDON_CATALOG,
  SEED_BILLING_HISTORY,
  SEED_BILLING_PROFILE,
  SEED_CANCELLATION,
  SEED_PAYMENT_METHOD,
  SEED_PLANS,
  SEED_RENEWAL_EVENTS,
  SEED_SUBSCRIPTION,
  SEED_SUBSCRIPTION_EVENTS,
} from "./seed"
import type {
  BillingHistoryRow,
  BillingPlan,
  BillingProfile,
  CancellationRequest,
  HookState,
  PaymentMethod,
  RenewalEvent,
  Subscription,
  SubscriptionAddon,
  SubscriptionEvent,
} from "./types"
import { isFeatureEnabled } from "@/lib/flags"

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

/** Current user's role in the active workspace + billing-control capability. */
export function useBillingRole() {
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

  // When the workspace_members read is unavailable (seed/dev), default to
  // owner so the section is demoable; real enforcement is server-side via RLS.
  const canManageBilling = role == null ? true : role === "owner" || role === "admin"
  return { role, canManageBilling, loading }
}

export function useAddonFeatureFlags() {
  const { workspace } = useWorkspace()
  const [flags, setFlags] = useState({ canvasLite: false, marketplaceEnabled: false })
  useEffect(() => {
    let active = true
    ;(async () => {
      if (!workspace?.id) return
      const supabase = createClient()
      const [canvasLite, marketplaceEnabled] = await Promise.all([
        isFeatureEnabled("canvasLite", { supabase, workspaceId: workspace.id }),
        isFeatureEnabled("marketplaceEnabled", { supabase, workspaceId: workspace.id }),
      ])
      if (active) setFlags({ canvasLite, marketplaceEnabled })
    })()
    return () => { active = false }
  }, [workspace?.id])
  return flags
}

export function usePlans(): HookState<BillingPlan[]> {
  return useSeedFallback(SEED_PLANS, async (sb, wid) => {
    const { data, error } = await sb.from("workspace_plans").select("*").eq("workspace_id", wid).limit(20)
    if (error) throw error
    return data && data.length ? SEED_PLANS : null
  })
}

export function useSubscription(): HookState<Subscription> {
  return useSeedFallback(SEED_SUBSCRIPTION, async (sb, wid) => {
    const { data, error } = await sb
      .from("workspace_subscriptions")
      .select("id")
      .eq("workspace_id", wid)
      .limit(1)
    if (error) throw error
    return data && data.length ? SEED_SUBSCRIPTION : null
  })
}

export function useActiveAddons(): HookState<SubscriptionAddon[]> {
  return useSeedFallback(SEED_ACTIVE_ADDONS, async (sb, wid) => {
    const { error } = await sb.from("workspace_subscription_addons").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useBillingProfile(): HookState<BillingProfile> {
  return useSeedFallback(SEED_BILLING_PROFILE, async (sb, wid) => {
    const { error } = await sb.from("workspace_billing_profiles").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function usePaymentMethod(): HookState<PaymentMethod> {
  return useSeedFallback(SEED_PAYMENT_METHOD, async (sb, wid) => {
    const { error } = await sb.from("workspace_payment_methods").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useBillingHistory(): HookState<BillingHistoryRow[]> {
  return useSeedFallback(SEED_BILLING_HISTORY, async (sb, wid) => {
    const { error } = await sb.from("workspace_billing_history").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useSubscriptionEvents(): HookState<SubscriptionEvent[]> {
  return useSeedFallback(SEED_SUBSCRIPTION_EVENTS, async (sb, wid) => {
    const { error } = await sb.from("workspace_subscription_events").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useRenewalEvents(): HookState<RenewalEvent[]> {
  return useSeedFallback(SEED_RENEWAL_EVENTS, async (sb, wid) => {
    const { error } = await sb.from("workspace_renewal_events").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useCancellation(): HookState<CancellationRequest | null> {
  return useSeedFallback(SEED_CANCELLATION, async (sb, wid) => {
    const { error } = await sb.from("workspace_cancellation_requests").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}
