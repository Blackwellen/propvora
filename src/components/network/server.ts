import "server-only"
import { createClient } from "@/lib/supabase/server"
import { resolveWorkspaceContext } from "@/lib/context/workspace-context"
import type { WorkspaceType } from "@/lib/context/context-types"
import {
  recomputePartnerGraph,
  listPartners,
  getWorkspaceActivity,
  type PartnerListResult,
  type ActivityResult,
  type ActivityModule,
} from "@/lib/network"

/* ──────────────────────────────────────────────────────────────────────────
   PARTNER NETWORK section — server access + tolerant data loaders.

   The network/activity views are CROSS-CUTTING: every workspace can see its OWN
   partner graph and its OWN activity feed (there is nothing to upsell — it
   simply surfaces what the workspace already has across modules). Access is
   therefore gated only on an authenticated, resolved workspace; the data itself
   is RLS- and explicitly-scoped to the workspace as a party.
─────────────────────────────────────────────────────────────────────────── */

export interface NetworkAccess {
  workspaceId: string | null
  workspaceType: WorkspaceType
  defaultCountry: string
  /** Authenticated + has a resolvable workspace. */
  canView: boolean
}

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

export async function getNetworkAccess(): Promise<NetworkAccess> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      workspaceId: null,
      workspaceType: "operator",
      defaultCountry: "GB",
      canView: false,
    }
  }

  const workspaceId = await resolveActiveWorkspaceId(supabase, user.id)
  const ctx = await resolveWorkspaceContext(supabase, workspaceId)

  return {
    workspaceId,
    workspaceType: ctx.type,
    defaultCountry: ctx.businessCountryCode,
    canView: Boolean(workspaceId),
  }
}

/** Recompute (best-effort) then list the partner graph for the overview page. */
export async function loadPartnerNetwork(
  workspaceId: string
): Promise<PartnerListResult> {
  const supabase = await createClient()
  // Best-effort refresh of the cached graph; tolerant of cold modules.
  await recomputePartnerGraph(supabase, workspaceId)
  return listPartners(supabase, workspaceId)
}

/** Load the unified cross-module activity feed for the activity page. */
export async function loadActivityFeed(
  workspaceId: string,
  options?: { modules?: ActivityModule[]; limit?: number }
): Promise<ActivityResult> {
  const supabase = await createClient()
  return getWorkspaceActivity(supabase, workspaceId, {
    modules: options?.modules,
    limit: options?.limit ?? 80,
  })
}
