import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getEntitlements } from "@/lib/billing/entitlements"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/entitlements
 *
 * Returns the caller's current-workspace entitlements as SAFE client flags:
 * the plan tier, coarse numeric limits, and boolean feature flags only. No
 * secrets, no price IDs, no internal usage figures. Used by useEntitlements to
 * show/hide upgrade prompts (cosmetic — the server gates are the real
 * enforcement).
 *
 * Limits that are unbounded server-side (Infinity) are serialised as `null`
 * to keep the JSON valid and mean "unlimited" on the client.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  // Resolve the user's current workspace (first membership — mirrors useWorkspace).
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  const workspaceId = (membership?.workspace_id as string | undefined) ?? ""
  const ent = await getEntitlements(supabase, workspaceId)

  const cap = (n: number) => (Number.isFinite(n) ? n : null)

  return NextResponse.json({
    tier: ent.tier,
    limits: {
      properties: cap(ent.limits.properties),
      teamSeats: cap(ent.limits.teamSeats),
      storageBytes: cap(ent.limits.storageBytes),
    },
    features: ent.features,
  })
}
