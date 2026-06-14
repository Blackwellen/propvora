"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin/guard"
import { writeAudit } from "@/lib/admin/audit"

export interface ActionResult {
  ok: boolean
  error?: string
}

// ── Workspace lifecycle ────────────────────────────────────────────────────

async function setWorkspaceStatus(
  workspaceId: string,
  nextStatus: "active" | "suspended" | "canceled",
  action: string,
): Promise<ActionResult> {
  let admin
  try {
    const identity = await requireAdmin()
    admin = createAdminClient()

    const { data: before } = await admin
      .from("workspaces")
      .select("id, name, plan_status")
      .eq("id", workspaceId)
      .maybeSingle()
    if (!before) return { ok: false, error: "Workspace not found" }

    const { error } = await admin
      .from("workspaces")
      .update({ plan_status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", workspaceId)
    if (error) return { ok: false, error: error.message }

    await writeAudit({
      actorId: identity.userId,
      action,
      resourceType: "workspace",
      resourceId: workspaceId,
      workspaceId,
      before: { plan_status: before.plan_status },
      after: { plan_status: nextStatus },
    })

    revalidatePath(`/admin/workspaces/${workspaceId}`)
    revalidatePath("/admin/workspaces")
    revalidatePath("/admin")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

export async function suspendWorkspace(workspaceId: string): Promise<ActionResult> {
  return setWorkspaceStatus(workspaceId, "suspended", "workspace.suspended")
}

export async function restoreWorkspace(workspaceId: string): Promise<ActionResult> {
  return setWorkspaceStatus(workspaceId, "active", "workspace.restored")
}

export async function archiveWorkspace(workspaceId: string): Promise<ActionResult> {
  // Archive == cancel the plan (soft, reversible via restore). We do NOT delete
  // any customer data — destructive deletion is intentionally not implemented.
  return setWorkspaceStatus(workspaceId, "canceled", "workspace.archived")
}

// ── User lifecycle ──────────────────────────────────────────────────────────

async function setUserBan(
  userId: string,
  banned: boolean,
  action: string,
): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    if (userId === identity.userId) {
      return { ok: false, error: "You cannot suspend your own account." }
    }
    const admin = createAdminClient()

    // Suspension is enforced at the auth layer via a ban duration. This blocks
    // sign-in without deleting the user or any workspace data.
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: banned ? "876000h" : "none", // ~100 years vs lifted
    })
    if (error) return { ok: false, error: error.message }

    await writeAudit({
      actorId: identity.userId,
      action,
      resourceType: "user",
      resourceId: userId,
      after: { banned },
    })

    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin/users")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

export async function suspendUser(userId: string): Promise<ActionResult> {
  return setUserBan(userId, true, "user.suspended")
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  return setUserBan(userId, false, "user.reactivated")
}

// ── Feature flags ────────────────────────────────────────────────────────────

export async function setFeatureFlag(key: string, enabled: boolean): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from("platform_feature_flags")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("key", key)
    if (error) {
      // PostgREST returns PGRST205 (schema-cache miss) for a missing table over
      // the REST path; the raw 42P01 only appears on direct SQL.
      if (error.code === "42P01" || error.code === "PGRST205")
        return { ok: false, error: "Feature flags table not provisioned yet." }
      return { ok: false, error: error.message }
    }
    await writeAudit({
      actorId: identity.userId,
      action: "feature_flag.toggled",
      resourceType: "feature_flag",
      after: { key, enabled },
    })
    revalidatePath("/admin/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}

// ── Platform settings ────────────────────────────────────────────────────────

export async function savePlatformSetting(
  key: string,
  value: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from("platform_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205")
        return { ok: false, error: "Platform settings table not provisioned yet." }
      return { ok: false, error: error.message }
    }
    await writeAudit({
      actorId: identity.userId,
      action: "platform_settings.updated",
      resourceType: "platform_settings",
      after: { key },
    })
    revalidatePath("/admin/settings")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}
