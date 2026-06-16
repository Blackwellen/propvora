"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin/guard"
import { writeAudit } from "@/lib/admin/audit"

/**
 * Platform-admin WRITE layer (real persistence).
 *
 * Every export is a Server Action that:
 *   1. Re-verifies platform-admin identity server-side (requireAdmin — fail-closed).
 *   2. Performs the mutation via the service-role client (RLS-bypassing, server-only).
 *   3. Writes an audit_logs entry (writeAudit — never throws).
 *   4. Revalidates the affected admin paths.
 *
 * No service-role key ever reaches the client. Inputs are validated before use.
 */

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

const PLAN_TIERS = ["starter", "operator", "scale", "pro_agency", "enterprise"] as const
const MEMBER_ROLES = ["owner", "admin", "manager", "member", "accountant"] as const
const PLATFORM_ROLES = ["", "support", "admin"] as const

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "workspace"
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface CreateUserInput {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  platformRole?: "" | "support" | "admin"
  password?: string
  sendInvite?: boolean
}

/**
 * Create a real platform user via the Supabase Auth admin API, then enrich the
 * auto-created profile row. If `sendInvite` is set and no password is supplied,
 * an invite email is sent instead of setting a password.
 */
export async function createUser(input: CreateUserInput): Promise<ActionResult<{ id: string }>> {
  try {
    const identity = await requireAdmin()
    const email = input.email?.trim().toLowerCase()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { ok: false, error: "A valid email address is required." }
    }
    const admin = createAdminClient()

    const displayName = [input.firstName, input.lastName].filter(Boolean).join(" ").trim()
    const userMeta = {
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      display_name: displayName || null,
    }

    let userId: string
    if (input.sendInvite && !input.password) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: userMeta })
      if (error || !data?.user) return { ok: false, error: error?.message ?? "Could not invite user." }
      userId = data.user.id
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: input.password || undefined,
        email_confirm: true,
        user_metadata: userMeta,
      })
      if (error || !data?.user) return { ok: false, error: error?.message ?? "Could not create user." }
      userId = data.user.id
    }

    // Enrich the profile (the auth trigger creates a bare row).
    const profilePatch: Record<string, unknown> = {
      display_name: displayName || null,
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      phone: input.phone ?? null,
      updated_at: new Date().toISOString(),
    }
    if (input.platformRole) profilePatch.platform_role = input.platformRole
    try {
      await admin.from("profiles").update(profilePatch).eq("id", userId)
    } catch {
      /* profile trigger may lag — non-fatal, core auth user exists */
    }

    // Mirror an admin grant into platform_admins for the dedicated grant path.
    if (input.platformRole === "admin") {
      try {
        await admin.from("platform_admins").upsert(
          { user_id: userId, granted_reason: "Created as platform admin via console" },
          { onConflict: "user_id" },
        )
      } catch { /* table optional */ }
    }

    await writeAudit({
      actorId: identity.userId,
      action: "user.created",
      resourceType: "user",
      resourceId: userId,
      after: { email, platform_role: input.platformRole || "user", invited: !!input.sendInvite },
    })

    revalidatePath("/admin/users")
    revalidatePath("/admin")
    return { ok: true, data: { id: userId } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

export interface UpdateUserInput {
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const displayName = [input.firstName, input.lastName].filter(Boolean).join(" ").trim()
    const { error } = await admin
      .from("profiles")
      .update({
        first_name: input.firstName ?? null,
        last_name: input.lastName ?? null,
        display_name: displayName || null,
        phone: input.phone ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: "user.updated",
      resourceType: "user",
      resourceId: userId,
      after: { first_name: input.firstName, last_name: input.lastName, phone: input.phone },
    })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin/users")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

/** Assign / clear a platform role (support / admin / user). */
export async function setUserPlatformRole(
  userId: string,
  role: "" | "support" | "admin",
): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    if (!PLATFORM_ROLES.includes(role)) return { ok: false, error: "Invalid role." }
    if (userId === identity.userId && role !== "admin") {
      return { ok: false, error: "You cannot remove your own admin role." }
    }
    const admin = createAdminClient()

    const { data: before } = await admin.from("profiles").select("platform_role").eq("id", userId).maybeSingle()
    const { error } = await admin
      .from("profiles")
      .update({ platform_role: role || null, updated_at: new Date().toISOString() })
      .eq("id", userId)
    if (error) return { ok: false, error: error.message }

    // Keep the platform_admins grant table in sync with the admin role.
    try {
      if (role === "admin") {
        await admin.from("platform_admins").upsert(
          { user_id: userId, granted_reason: "Role assigned via console" },
          { onConflict: "user_id" },
        )
      } else {
        await admin.from("platform_admins").delete().eq("user_id", userId)
      }
    } catch { /* grant table optional */ }

    await writeAudit({
      actorId: identity.userId,
      action: "user.role_changed",
      resourceType: "user",
      resourceId: userId,
      before: { platform_role: (before?.platform_role as string) ?? null },
      after: { platform_role: role || null },
    })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin/users")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

/** Force a password-reset / recovery email for a user. */
export async function sendUserPasswordReset(userId: string, email: string): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    if (!email) return { ok: false, error: "No email on file for this user." }
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.generateLink({ type: "recovery", email })
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: "user.password_reset_sent",
      resourceType: "user",
      resourceId: userId,
      after: { email },
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

// ─── Workspaces ──────────────────────────────────────────────────────────────

export interface CreateWorkspaceInput {
  name: string
  ownerUserId: string
  plan?: (typeof PLAN_TIERS)[number]
  planStatus?: "active" | "trialing" | "suspended"
  businessType?: string | null
  defaultCurrency?: string | null
  dataRegion?: string | null
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<ActionResult<{ id: string }>> {
  try {
    const identity = await requireAdmin()
    const name = input.name?.trim()
    if (!name) return { ok: false, error: "Workspace name is required." }
    if (!input.ownerUserId) return { ok: false, error: "An owner must be selected." }
    const admin = createAdminClient()

    // Ensure a unique slug.
    const base = slugify(name)
    let slug = base
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await admin.from("workspaces").select("id").eq("slug", slug).maybeSingle()
      if (!clash) break
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
    }

    const plan = PLAN_TIERS.includes(input.plan as never) ? input.plan : "starter"
    const insert: Record<string, unknown> = {
      name,
      slug,
      owner_user_id: input.ownerUserId,
      plan,
      plan_status: input.planStatus ?? "active",
    }
    if (input.businessType) insert.business_type = input.businessType
    if (input.defaultCurrency) insert.default_currency = input.defaultCurrency
    if (input.dataRegion) insert.data_region = input.dataRegion

    const { data, error } = await admin.from("workspaces").insert(insert).select("id").single()
    if (error || !data) return { ok: false, error: error?.message ?? "Could not create workspace." }
    const workspaceId = data.id as string

    // Add the owner as an owner-role member (best-effort; ignore duplicates).
    try {
      await admin.from("workspace_members").insert({
        workspace_id: workspaceId,
        user_id: input.ownerUserId,
        role: "owner",
        status: "active",
        accepted_at: new Date().toISOString(),
      })
    } catch { /* membership trigger may already exist */ }

    await writeAudit({
      actorId: identity.userId,
      action: "workspace.created",
      resourceType: "workspace",
      resourceId: workspaceId,
      workspaceId,
      after: { name, plan, slug },
    })

    revalidatePath("/admin/workspaces")
    revalidatePath("/admin")
    return { ok: true, data: { id: workspaceId } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

export interface UpdateWorkspaceInput {
  name?: string
  plan?: (typeof PLAN_TIERS)[number]
  planStatus?: string
  defaultCurrency?: string | null
  supportEmail?: string | null
}

export async function updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.name !== undefined) patch.name = input.name.trim()
    if (input.plan && PLAN_TIERS.includes(input.plan)) patch.plan = input.plan
    if (input.planStatus) patch.plan_status = input.planStatus
    if (input.defaultCurrency !== undefined) patch.default_currency = input.defaultCurrency
    if (input.supportEmail !== undefined) patch.support_email = input.supportEmail

    const { data: before } = await admin
      .from("workspaces").select("name, plan, plan_status").eq("id", workspaceId).maybeSingle()
    const { error } = await admin.from("workspaces").update(patch).eq("id", workspaceId)
    if (error) return { ok: false, error: error.message }

    await writeAudit({
      actorId: identity.userId,
      action: "workspace.updated",
      resourceType: "workspace",
      resourceId: workspaceId,
      workspaceId,
      before: before ?? null,
      after: { name: patch.name, plan: patch.plan, plan_status: patch.plan_status },
    })
    revalidatePath(`/admin/workspaces/${workspaceId}`)
    revalidatePath("/admin/workspaces")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

/** Change a member's role within a workspace. */
export async function setMemberRole(
  workspaceId: string,
  userId: string,
  role: (typeof MEMBER_ROLES)[number],
): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    if (!MEMBER_ROLES.includes(role)) return { ok: false, error: "Invalid role." }
    const admin = createAdminClient()
    const { error } = await admin
      .from("workspace_members")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: "workspace.member_role_changed",
      resourceType: "workspace_member",
      resourceId: userId,
      workspaceId,
      after: { role },
    })
    revalidatePath(`/admin/workspaces/${workspaceId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

/** Remove a member from a workspace (cannot remove the owner). */
export async function removeMember(workspaceId: string, userId: string): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const { data: ws } = await admin.from("workspaces").select("owner_user_id").eq("id", workspaceId).maybeSingle()
    if (ws && ws.owner_user_id === userId) {
      return { ok: false, error: "Cannot remove the workspace owner. Reassign ownership first." }
    }
    const { error } = await admin
      .from("workspace_members").delete().eq("workspace_id", workspaceId).eq("user_id", userId)
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: "workspace.member_removed",
      resourceType: "workspace_member",
      resourceId: userId,
      workspaceId,
    })
    revalidatePath(`/admin/workspaces/${workspaceId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

// ─── Affiliates ──────────────────────────────────────────────────────────────

export interface CreateAffiliateInput {
  workspaceId: string
  payoutEmail?: string | null
  band?: string
  referralCode?: string | null
  origin?: string
  approve?: boolean
}

/** Enrol a workspace as an affiliate (create the affiliates row). */
export async function createAffiliate(input: CreateAffiliateInput): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    if (!input.workspaceId) return { ok: false, error: "A workspace is required." }
    const admin = createAdminClient()

    const code = (input.referralCode?.trim() || Math.random().toString(36).slice(2, 10)).toUpperCase()
    const row = {
      workspace_id: input.workspaceId,
      enrolled: true,
      approved: input.approve ?? true,
      origin: input.origin || "internal",
      band: input.band || "starter",
      payout_email: input.payoutEmail ?? null,
      referral_code: code,
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { error } = await admin.from("affiliates").upsert(row, { onConflict: "workspace_id" })
    if (error) return { ok: false, error: error.message }

    await writeAudit({
      actorId: identity.userId,
      action: "affiliate.created",
      resourceType: "affiliate",
      resourceId: input.workspaceId,
      workspaceId: input.workspaceId,
      after: { band: row.band, origin: row.origin, approved: row.approved },
    })
    revalidatePath("/admin/affiliates")
    revalidatePath(`/admin/affiliates/${input.workspaceId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

export interface UpdateAffiliateInput {
  band?: string
  payoutEmail?: string | null
  origin?: string
}

export async function updateAffiliate(workspaceId: string, input: UpdateAffiliateInput): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.band) patch.band = input.band
    if (input.payoutEmail !== undefined) patch.payout_email = input.payoutEmail
    if (input.origin) patch.origin = input.origin
    const { error } = await admin.from("affiliates").update(patch).eq("workspace_id", workspaceId)
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: "affiliate.updated",
      resourceType: "affiliate",
      resourceId: workspaceId,
      workspaceId,
      after: patch,
    })
    revalidatePath(`/admin/affiliates/${workspaceId}`)
    revalidatePath("/admin/affiliates")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

// ─── AI models (catalogue CRUD) ──────────────────────────────────────────────

export interface AiModelInput {
  providerId: string
  modelId: string
  label: string
  inputCostPencePer1k?: number
  outputCostPencePer1k?: number
  enabled?: boolean
}

export async function createAiModel(input: AiModelInput): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    if (!input.providerId || !input.modelId?.trim() || !input.label?.trim()) {
      return { ok: false, error: "Provider, model id and label are required." }
    }
    const admin = createAdminClient()
    const { error } = await admin.from("ai_models").insert({
      provider_id: input.providerId,
      model_id: input.modelId.trim(),
      label: input.label.trim(),
      input_cost_pence_per_1k: input.inputCostPencePer1k ?? 0,
      output_cost_pence_per_1k: input.outputCostPencePer1k ?? 0,
      enabled: input.enabled ?? true,
      is_default: false,
      sort_order: 100,
    })
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: "ai_model.created",
      resourceType: "ai_model",
      after: { model_id: input.modelId, label: input.label },
    })
    revalidatePath("/admin/ai-models")
    revalidatePath("/admin/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

export async function updateAiModel(
  modelId: string,
  input: { label?: string; inputCostPencePer1k?: number; outputCostPencePer1k?: number },
): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.label !== undefined) patch.label = input.label.trim()
    if (input.inputCostPencePer1k !== undefined) patch.input_cost_pence_per_1k = input.inputCostPencePer1k
    if (input.outputCostPencePer1k !== undefined) patch.output_cost_pence_per_1k = input.outputCostPencePer1k
    const { error } = await admin.from("ai_models").update(patch).eq("id", modelId)
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: "ai_model.updated",
      resourceType: "ai_model",
      resourceId: modelId,
      after: patch,
    })
    revalidatePath("/admin/ai-models")
    revalidatePath("/admin/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

export async function deleteAiModel(modelId: string): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const { data: m } = await admin.from("ai_models").select("is_default").eq("id", modelId).maybeSingle()
    if (m?.is_default) return { ok: false, error: "Cannot delete the default model. Set another default first." }
    const { error } = await admin.from("ai_models").delete().eq("id", modelId)
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: "ai_model.deleted",
      resourceType: "ai_model",
      resourceId: modelId,
    })
    revalidatePath("/admin/ai-models")
    revalidatePath("/admin/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

// ─── Maintenance mode ────────────────────────────────────────────────────────

export async function saveMaintenanceMode(input: {
  enabled: boolean
  message?: string
  allowAdmins?: boolean
}): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const value = {
      enabled: !!input.enabled,
      message: input.message ?? "",
      allow_admins: input.allowAdmins ?? true,
    }
    const { error } = await admin
      .from("platform_settings")
      .upsert(
        { key: "maintenance", value, updated_by: identity.userId, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      )
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205")
        return { ok: false, error: "platform_settings table not provisioned yet." }
      return { ok: false, error: error.message }
    }
    await writeAudit({
      actorId: identity.userId,
      action: "maintenance_mode.updated",
      resourceType: "platform_settings",
      after: value,
    })
    revalidatePath("/admin/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}
