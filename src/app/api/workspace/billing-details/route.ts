import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface BillingDetailsPayload {
  billingName: string
  billingEmail: string
  vatNumber: string
  address: string
  city: string
  postcode: string
  country: string
}

/**
 * GET /api/workspace/billing-details
 * Returns the stored billing details from workspaces.settings.billing_details
 * for the caller's active workspace. Uses anon client — RLS ensures the user
 * can only read their own workspace.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Resolve active workspace
  const workspaceId = await resolveWorkspaceId(supabase, user.id)
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 })
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", workspaceId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const settings = (workspace?.settings ?? {}) as Record<string, unknown>
  const billingDetails = (settings.billing_details ?? null) as BillingDetailsPayload | null

  return NextResponse.json({ billingDetails })
}

/**
 * PATCH /api/workspace/billing-details
 * Merges billing details into workspaces.settings.billing_details.
 * RLS policy "Owner updates workspace" restricts writes to the workspace owner.
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Partial<BillingDetailsPayload>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Resolve active workspace
  const workspaceId = await resolveWorkspaceId(supabase, user.id)
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 })
  }

  // Fetch existing settings so we can merge (preserve other settings keys)
  const { data: existing, error: fetchError } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", workspaceId)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const existingSettings = (existing?.settings ?? {}) as Record<string, unknown>
  const updatedSettings = {
    ...existingSettings,
    billing_details: {
      billingName: body.billingName ?? "",
      billingEmail: body.billingEmail ?? "",
      vatNumber: body.vatNumber ?? "",
      address: body.address ?? "",
      city: body.city ?? "",
      postcode: body.postcode ?? "",
      country: body.country ?? "United Kingdom",
    } satisfies BillingDetailsPayload,
  }

  const { error: updateError } = await supabase
    .from("workspaces")
    .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
    .eq("id", workspaceId)

  if (updateError) {
    // RLS block manifests as a generic update error (no rows affected or
    // permission denied). Surface a useful message.
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function resolveWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", userId)
      .maybeSingle()

    if (profile?.current_workspace_id) return profile.current_workspace_id as string

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle()

    return (membership?.workspace_id as string | null) ?? null
  } catch {
    return null
  }
}
