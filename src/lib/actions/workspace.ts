"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { randomUUID } from "node:crypto"
import { DEFAULT_DURATION_MONTHS } from "@/lib/affiliate/levels"
import { type ActionResult, ok, fail, fromSupabaseError } from "@/lib/actions/utils/actionResult"

export interface CreateWorkspaceInput {
  name: string
  businessType: string
  operationInterests: string[]
  /** The user's primary operation profile (one of the 13 enum values). */
  primaryOperationProfile?: string
  demoDataVariant?: string
  /** Optional team invites to create (email + role). */
  teamInvites?: { email: string; role: string }[]
  /**
   * Workspace type — stored in `workspaces.type`. Defaults to operator behaviour
   * when omitted. Pass "supplier" for supplier onboarding.
   */
  workspaceType?: string
  /** Supplier-specific metadata stored in `workspaces.metadata` (JSON). */
  supplierMeta?: Record<string, unknown>
  /** ISO 3166-1 alpha-2 country code captured during onboarding. Drives locale defaults. */
  countryCode?: string
  /** BCP-47 locale override (derived from countryCode if not supplied). */
  defaultLocale?: string
  /** ISO 4217 currency override (derived from countryCode if not supplied). */
  defaultCurrency?: string
  /** IANA timezone override (derived from countryCode if not supplied). */
  defaultTimezone?: string
  /** Date format string override (derived from countryCode if not supplied). */
  defaultDateFormat?: string
}

export interface CreateWorkspaceResult {
  workspaceId: string
  slug: string
}

/**
 * Creates a new workspace for the authenticated user and sets them as owner.
 * Optionally seeds demo data if a variant is provided.
 */
export async function createWorkspace(
  data: CreateWorkspaceInput
): Promise<ActionResult<CreateWorkspaceResult>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return fail("Not authenticated. Please sign in and try again.", "UNAUTHENTICATED")
  }

  // Build a URL-safe slug from the workspace name
  const slug = data.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) + "-" + Math.random().toString(36).slice(2, 7)

  // 1. Insert the workspace
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({
      name: data.name.trim(),
      slug,
      ...(data.workspaceType ? { type: data.workspaceType } : {}),
      business_type: data.businessType || null,
      operation_interests: data.operationInterests,
      primary_operation_profile:
        data.primaryOperationProfile || data.operationInterests[0] || null,
      owner_user_id: user.id,
      // plan is the plan_tier enum {starter,operator,scale,pro_agency,enterprise};
      // a free trial is represented by plan='starter' + plan_status='trialing'.
      plan: "starter",
      plan_status: "trialing",
      onboarding_completed: true,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      // supplierMeta stored separately (no metadata column in live schema)
    })
    .select("id, slug")
    .single()

  if (wsError) {
    // Handle unique constraint violation on slug
    if (wsError.code === "23505") {
      return fail("A workspace with this name already exists. Please choose a different name.", "23505")
    }
    return fromSupabaseError(wsError)
  }

  // 2. Add the creator as the workspace owner.
  // workspace_members uses accepted_at (not joined_at) and status='active' for
  // an already-accepted owner seat.
  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
    invited_by: user.id,
    accepted_at: new Date().toISOString(),
    status: "active",
  })

  if (memberError) {
    // Workspace was created — log but don't surface to user
    console.error("[createWorkspace] Failed to insert workspace member:", memberError)
  }

  // 3. Update the user's profile: set current workspace + mark onboarding complete
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        current_workspace_id: workspace.id,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (profileError) {
    console.error("[createWorkspace] Failed to update profile:", profileError)
  }

  // 4. Create default workspace settings (42P01-safe — table may not exist yet).
  try {
    const { error: settingsError } = await supabase
      .from("workspace_settings")
      .insert({
        workspace_id: workspace.id,
        default_currency: data.defaultCurrency ?? "GBP",
        default_timezone: data.defaultTimezone ?? "Europe/London",
        default_date_format: data.defaultDateFormat ?? "DD/MM/YYYY",
        default_locale: data.defaultLocale ?? "en-GB",
      })
    if (settingsError && settingsError.code !== "23505" && settingsError.code !== "42P01") {
      console.error("[createWorkspace] workspace_settings insert:", settingsError)
    }
  } catch (e) {
    console.error("[createWorkspace] workspace_settings failed:", e)
  }

  // 5. Mark onboarding complete in user_preferences (first-run flag).
  try {
    await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          metadata: { onboarding_complete: true, onboarded_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
  } catch (e) {
    console.error("[createWorkspace] user_preferences failed:", e)
  }

  // 6. Create any pending team invitations (42P01-safe).
  if (data.teamInvites && data.teamInvites.length > 0) {
    const validRoles = ["admin", "member", "viewer", "finance"]
    const rows = data.teamInvites
      .map((inv) => ({
        email: (inv.email ?? "").trim().toLowerCase(),
        role: validRoles.includes(inv.role) ? inv.role : "member",
      }))
      .filter((inv) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email))
      .map((inv) => ({
        workspace_id: workspace.id,
        email: inv.email,
        role: inv.role,
        token: `${randomUUID()}${randomUUID()}`.replace(/-/g, ""),
        invited_by: user.id,
        status: "pending",
      }))
    if (rows.length > 0) {
      try {
        await supabase.from("workspace_invitations").insert(rows)
      } catch (e) {
        console.error("[createWorkspace] invitations failed:", e)
      }
    }
  }

  // 7. Audit log entry for workspace creation (42P01-safe).
  try {
    await supabase.from("audit_logs").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      action: "workspace.created",
      resource_type: "workspace",
      resource_id: workspace.id,
      new_data: {
        name: data.name.trim(),
        business_type: data.businessType || null,
        operation_interests: data.operationInterests,
      },
    })
  } catch (e) {
    console.error("[createWorkspace] audit_logs failed:", e)
  }

  // 7b. Affiliate referral attribution (42P01-safe). If the visitor arrived via
  // ?ref=CODE (captured into the propvora_ref cookie), link this new workspace to
  // the referring affiliate — unless it's a self-referral. Commission is computed
  // at first payment (billing webhooks, Wave B); here we only record the link.
  try {
    const jar = await cookies()
    const refCode = jar.get("propvora_ref")?.value?.trim()
    if (refCode) {
      const { data: aff } = await supabase
        .from("affiliates")
        .select("workspace_id, enrolled, approved")
        .eq("referral_code", refCode)
        .maybeSingle()
      if (aff?.enrolled && aff.approved && aff.workspace_id !== workspace.id) {
        // Self-referral guard: skip if the referrer's workspace belongs to this user.
        const { data: selfMember } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("workspace_id", aff.workspace_id)
          .eq("user_id", user.id)
          .maybeSingle()
        if (!selfMember) {
          await supabase.from("affiliate_referrals").insert({
            affiliate_workspace_id: aff.workspace_id,
            referred_workspace_id: workspace.id,
            status: "pending",
            recurring_months_remaining: DEFAULT_DURATION_MONTHS,
          })
        }
      }
      // Clear the cookie either way so it isn't reused.
      jar.delete("propvora_ref")
    }
  } catch (e) {
    console.error("[createWorkspace] referral attribution failed:", e)
  }

  // 8. Seed demo data if requested — via the consolidated, type-aware SQL seeder
  //    (single source of truth, same action as Settings → Demo data).
  if (data.demoDataVariant) {
    const { error: seedError } = await supabase.rpc("seed_full_demo_workspace", {
      p_workspace_id: workspace.id as string,
      p_user_id: user.id,
    })
    if (seedError) {
      // Non-fatal — workspace is created regardless of demo seeding.
      console.error("[createWorkspace] Demo seed failed:", seedError.message)
    }
  }

  revalidatePath("/property-manager")

  return ok({
    workspaceId: workspace.id as string,
    slug: workspace.slug as string,
  })
}

/**
 * Updates the current user's active workspace.
 */
export async function switchWorkspace(workspaceId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return fail("Not authenticated.", "UNAUTHENTICATED")
  }

  // Verify user is a member of this workspace
  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (memberError || !member) {
    return fail("You do not have access to this workspace.", "FORBIDDEN")
  }

  const { error } = await supabase
    .from("profiles")
    .update({ current_workspace_id: workspaceId, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) {
    return fromSupabaseError(error)
  }

  revalidatePath("/property-manager")
  return ok()
}

/** Home route (and shell route-group) for each persona/workspace type. */
const PERSONA_HOME: Record<"customer" | "operator" | "supplier", string> = {
  customer: "/user",
  operator: "/property-manager",
  supplier: "/supplier",
}

/**
 * Cross-persona navigation for a single account that holds several memberships
 * (same email, different workspace types). Finds the caller's workspace of the
 * requested `type`, makes it the active workspace, and returns the home route of
 * that persona's shell. Returns `null` when the account has no workspace of that
 * type — callers use that to omit the link entirely (no greyed-out dead ends).
 *
 * This is what powers the avatar-dropdown "Go to customer site / property
 * manager / supplier" shortcuts. Customer is deliberately absent from the
 * operator/supplier workspace switcher, so it needs this explicit door (and the
 * customer shell has no switcher at all, so it needs the reverse doors too).
 */
export async function switchToPersona(
  type: "customer" | "operator" | "supplier"
): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces!inner(type)")
    .eq("user_id", user.id)
    .eq("workspaces.type", type)
    .limit(1)
    .maybeSingle()

  const workspaceId = (data as { workspace_id?: string } | null)?.workspace_id
  if (!workspaceId) return null

  await supabase
    .from("profiles")
    .update({ current_workspace_id: workspaceId, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  return PERSONA_HOME[type]
}

/**
 * Which persona workspaces does the caller belong to (same account, by type)?
 * Used to decide which cross-persona avatar links to render.
 */
export async function getPersonaMemberships(): Promise<{
  customer: boolean
  operator: boolean
  supplier: boolean
}> {
  const result = { customer: false, operator: false, supplier: false }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return result

  const { data } = await supabase
    .from("workspace_members")
    .select("workspaces!inner(type)")
    .eq("user_id", user.id)
    .limit(50)

  for (const row of data ?? []) {
    const t = (row as { workspaces?: { type?: string } | null }).workspaces?.type
    if (t === "customer" || t === "operator" || t === "supplier") result[t] = true
  }
  return result
}

/**
 * One-shot customer workspace bootstrap — called from the auth callback when
 * a user registers with intent=customer. Creates a customer-type workspace with
 * no wizard steps, sets it as the active workspace, and returns the workspace id.
 *
 * Safe to call multiple times: if the user already has a workspace it's a no-op.
 */
export async function bootstrapCustomerWorkspace(): Promise<ActionResult<{ workspaceId: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return fail("Not authenticated.", "UNAUTHENTICATED")

  // ── Persona-aware no-op ────────────────────────────────────────────────────
  // A single account can be operator AND/OR supplier AND/OR customer (same
  // email, different memberships). So we only no-op when this user ALREADY has a
  // CUSTOMER-type workspace — never because they happen to own an operator or
  // supplier workspace. This is what lets a property manager / supplier also log
  // in "as a customer" with the very same email.
  const { data: existingCustomer } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces!inner(type)")
    .eq("user_id", user.id)
    .eq("workspaces.type", "customer")
    .limit(1)
    .maybeSingle()

  if (existingCustomer?.workspace_id) {
    // Make sure the dedicated membership row the (customer) layout gates on
    // exists, then we're done — idempotent.
    await ensureCustomerMembershipRow(supabase, existingCustomer.workspace_id, user.id)
    return ok({ workspaceId: existingCustomer.workspace_id })
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.email?.split("@")[0] ?? "My Account")

  const slug =
    displayName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) +
    "-" +
    Math.random().toString(36).slice(2, 7)

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({
      name: displayName,
      slug,
      type: "customer",
      owner_user_id: user.id,
      plan: "starter",
      plan_status: "trialing",
      onboarding_completed: true,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single()

  if (wsError) return fromSupabaseError(wsError)

  // Owner row in workspace_members (idempotent — a bootstrap trigger may also
  // add it). This grants is_workspace_member(), which the customer RLS admits.
  await supabase
    .from("workspace_members")
    .upsert(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
        invited_by: user.id,
        accepted_at: new Date().toISOString(),
        status: "active",
      },
      { onConflict: "workspace_id,user_id", ignoreDuplicates: true }
    )

  // Dedicated customer-membership row — the (customer) route group gates on this.
  await ensureCustomerMembershipRow(supabase, workspace.id, user.id)

  // Only adopt this as the user's active workspace if they don't already have
  // one — never steal an operator/supplier user's current workspace.
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()
  if (!profile?.current_workspace_id) {
    await supabase
      .from("profiles")
      .update({ current_workspace_id: workspace.id })
      .eq("id", user.id)
  }

  revalidatePath("/customer")

  return ok({ workspaceId: workspace.id })
}

/** Idempotently ensure the customer_workspace_members row the (customer) layout
 *  gate reads. Tolerant: a missing table (pre-migration) never throws. */
async function ensureCustomerMembershipRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<void> {
  try {
    await supabase
      .from("customer_workspace_members")
      .upsert(
        { workspace_id: workspaceId, user_id: userId, role: "owner" },
        { onConflict: "workspace_id,user_id", ignoreDuplicates: true }
      )
  } catch {
    // table absent in this environment — non-fatal
  }
}

/** Personas a user can log into. Customer is a buyer/guest identity that never
 *  appears in the operator workspace switcher. */
export type LoginPersona = "customer" | "operator" | "supplier"

/**
 * Resolve where a freshly-authenticated user should land for the persona they
 * chose on the login screen. One account can hold several personas (same email);
 * the choice is a DESTINATION, not a separate credential.
 *
 *   - customer  → ensure a customer workspace exists (bootstrap if needed) → /user
 *   - supplier  → /supplier if they have a supplier workspace, else the supplier
 *                 onboarding wizard
 *   - operator  → /property-manager if they have an operator workspace, else the
 *                 operator onboarding wizard
 *
 * Tolerant by design: any lookup failure falls back to a safe default for the
 * chosen persona so login never dead-ends.
 */
export async function resolveLoginDestination(
  persona: LoginPersona
): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return "/login"

  if (persona === "customer") {
    try {
      await bootstrapCustomerWorkspace()
    } catch {
      // Non-fatal — they can still reach the marketplace; /user gate will guide.
    }
    return "/user"
  }

  // Which workspace TYPES does this account already belong to?
  const types = new Set<string>()
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspaces!inner(type)")
      .eq("user_id", user.id)
      .limit(50)
    for (const row of data ?? []) {
      const t = (row as { workspaces?: { type?: string } | null }).workspaces?.type
      if (t) types.add(t)
    }
  } catch {
    // fall through to onboarding defaults
  }

  if (persona === "supplier") {
    if (types.has("supplier")) return "/supplier"
    // Also admit the dedicated supplier-membership table (tolerant).
    try {
      const { data } = await supabase
        .from("supplier_workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
      if (data?.workspace_id) return "/supplier"
    } catch {
      /* table absent — fall through */
    }
    return "/onboarding/supplier"
  }

  // operator
  if (types.has("operator")) return "/property-manager"
  return "/onboarding"
}
