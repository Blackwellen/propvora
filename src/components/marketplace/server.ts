import "server-only"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspaceContext } from "@/lib/context/workspace-context"
import { gateMarketplacePublishing, gateFeature } from "@/lib/billing/gates"
import { PLAN_DISPLAY } from "@/lib/billing/plans"
import type { WorkspaceType } from "@/lib/context/context-types"
import type { PlanTier } from "@/lib/billing/plans"

/* ──────────────────────────────────────────────────────────────────────────
   Server-side workspace + entitlement resolution for the marketplace pages.

   The marketplace surfaces resolve the ACTIVE workspace server-side (profile's
   current_workspace_id → first membership, mirroring useWorkspace/the API
   routes), then gate the UI on real entitlement via the billing gates — never
   a feature flag, never a client-only check. All reads are best-effort and
   degrade safely so a cold/migrating DB still renders a coherent page.
─────────────────────────────────────────────────────────────────────────── */

export interface MarketplaceAccess {
  /** Active workspace id, or null when unresolved (signed-out / no membership). */
  workspaceId: string | null
  /** Workspace type (operator/supplier/customer/platform_admin). */
  workspaceType: WorkspaceType
  /** Plan tier (operator workspaces) for upgrade-copy. */
  tier: PlanTier
  /** Human plan name for prompts. */
  planName: string
  /** Default country from the workspace context (pre-seeds filters). */
  defaultCountry: string
  /** Entitlement: may browse the marketplace? */
  canBrowse: boolean
  /** Entitlement: may publish listings? */
  canPublish: boolean
}

/** Resolve the user's active workspace id (server-side). */
async function resolveActiveWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", userId)
      .maybeSingle()
    const fromProfile = (profile?.current_workspace_id as string | undefined) ?? null
    if (fromProfile) return fromProfile

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    return (membership?.workspace_id as string | undefined) ?? null
  } catch {
    return null
  }
}

/**
 * Resolve marketplace access for the current request. Supplier workspaces can
 * always browse + publish (their marketplace presence is the point); operator
 * workspaces are gated by plan entitlement.
 */
export async function getMarketplaceAccess(): Promise<MarketplaceAccess> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      workspaceId: null,
      workspaceType: "operator",
      tier: "starter",
      planName: PLAN_DISPLAY.starter.name,
      defaultCountry: "GB",
      canBrowse: false,
      canPublish: false,
    }
  }

  const workspaceId = await resolveActiveWorkspaceId(supabase, user.id)
  const ctx = await resolveWorkspaceContext(supabase, workspaceId)

  // Supplier workspaces exist to be on the marketplace — always entitled.
  if (ctx.type === "supplier") {
    return {
      workspaceId,
      workspaceType: ctx.type,
      tier: "starter",
      planName: "Supplier",
      defaultCountry: ctx.businessCountryCode,
      canBrowse: true,
      canPublish: true,
    }
  }

  // Operator / customer / admin: gate on plan entitlement.
  const [browseGate, publishGate] = await Promise.all([
    workspaceId ? gateFeature(supabase, workspaceId, "marketplaceBrowsing") : Promise.resolve(null),
    workspaceId ? gateMarketplacePublishing(supabase, workspaceId) : Promise.resolve(null),
  ])

  const tier = (browseGate?.tier ?? publishGate?.tier ?? "starter") as PlanTier

  return {
    workspaceId,
    workspaceType: ctx.type,
    tier,
    planName: PLAN_DISPLAY[tier]?.name ?? "Starter",
    defaultCountry: ctx.businessCountryCode,
    canBrowse: browseGate?.allowed ?? false,
    canPublish: publishGate?.allowed ?? false,
  }
}
