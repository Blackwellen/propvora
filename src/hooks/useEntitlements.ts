"use client"

import { useQuery } from "@tanstack/react-query"
import type { PlanTier } from "@/lib/billing/plans"
import type { FeatureFlags } from "@/lib/billing/entitlements"

/**
 * Client view of the current workspace's entitlements, fetched from
 * /api/entitlements. The server route is the source of truth; this hook only
 * powers cosmetic show/hide of upgrade prompts. Real enforcement is the
 * server-side gate on each protected action.
 *
 * `null` limit values mean "unlimited" (Infinity can't survive JSON).
 */
export interface ClientEntitlements {
  tier: PlanTier
  limits: {
    properties: number | null
    teamSeats: number | null
    storageBytes: number | null
  }
  features: FeatureFlags
}

async function fetchEntitlements(): Promise<ClientEntitlements> {
  const res = await fetch("/api/entitlements", { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to load entitlements (${res.status})`)
  return (await res.json()) as ClientEntitlements
}

export function useEntitlements() {
  const query = useQuery<ClientEntitlements>({
    queryKey: ["entitlements"],
    queryFn: fetchEntitlements,
    staleTime: 5 * 60 * 1000, // 5 minutes — plan changes are infrequent
  })
  return { data: query.data, isLoading: query.isLoading }
}

/** Convenience: is a single feature available on the current plan? */
export function useFeature(feature: keyof FeatureFlags): boolean {
  const { data } = useEntitlements()
  return data?.features[feature] ?? false
}
