"use server"

import { createClient } from "@/lib/supabase/server"
import { recordAudit } from "@/lib/audit/log"
import { revalidatePath } from "next/cache"

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Postgres "relation does not exist" — table not migrated yet. */
function isMissingTable(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "42P01"
}

interface AuthedContext {
  userId: string
  workspaceId: string
  role: string | null
  isOwner: boolean
}

/**
 * Resolves the current user + their active workspace + their role in it.
 * Throws if not authenticated or no active workspace.
 */
async function resolveContext(): Promise<AuthedContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated.")

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()

  let workspaceId = profile?.current_workspace_id as string | undefined

  // Fallback to first membership
  if (!workspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    workspaceId = membership?.workspace_id as string | undefined
  }

  if (!workspaceId) throw new Error("No active workspace.")

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()

  const role = (member?.role as string | null) ?? null
  return { userId: user.id, workspaceId, role, isOwner: role === "owner" }
}

/**
 * Writes an audit log entry. Best-effort — never throws.
 *
 * Routes through the canonical `recordAudit` helper so the row lands in the
 * real `audit_logs` columns (`metadata`, not a non-existent `detail` column).
 * Keep metadata small and non-sensitive — never pass secrets/tokens.
 */
async function writeAudit(
  workspaceId: string,
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {},
  resourceType?: string,
  resourceId?: string
): Promise<void> {
  const supabase = await createClient()
  await recordAudit(supabase, {
    workspaceId,
    userId,
    action,
    metadata,
    resourceType: resourceType ?? null,
    resourceId: resourceId ?? null,
  })
}

/* ------------------------------------------------------------------ */
/* Workspace settings (portal + AI gating, etc.)                        */
/* ------------------------------------------------------------------ */

export interface WorkspaceSettingsResult {
  settings: Record<string, unknown> | null
  /** True when the settings table does not exist yet. */
  unavailable: boolean
}

/**
 * The `workspace_settings` table stores feature config inside typed jsonb
 * "bucket" columns (ai, chat, mail, calendar, …) rather than one column per
 * flag. Settings pages work with FLAT key/value maps, so reads merge the
 * relevant buckets up to the top level and writes are nested back into a bucket.
 */
const SETTINGS_BUCKETS = [
  "ai",
  "chat",
  "mail",
  "calendar",
  "team",
  "money",
  "suppliers",
  "compliance",
  "documents",
  "insights",
] as const

export type SettingsBucket = (typeof SETTINGS_BUCKETS)[number]

/**
 * Reads the workspace_settings row for the active workspace and flattens its
 * jsonb buckets into a single top-level key/value map.
 * 42P01-safe: returns { unavailable: true } when the table is missing.
 */
export async function getWorkspaceSettings(): Promise<WorkspaceSettingsResult> {
  try {
    const { workspaceId } = await resolveContext()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("workspace_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle()

    if (error) {
      if (isMissingTable(error)) return { settings: null, unavailable: true }
      return { settings: null, unavailable: false }
    }
    if (!data) return { settings: null, unavailable: false }

    // Flatten: top-level scalar columns first, then merge each jsonb bucket's
    // keys up so callers can read flat keys (e.g. `ai_enabled`, `email_from`).
    const row = data as Record<string, unknown>
    const flat: Record<string, unknown> = { ...row }
    for (const bucket of SETTINGS_BUCKETS) {
      const b = row[bucket]
      if (b && typeof b === "object" && !Array.isArray(b)) {
        Object.assign(flat, b as Record<string, unknown>)
      }
    }
    return { settings: flat, unavailable: false }
  } catch {
    return { settings: null, unavailable: false }
  }
}

export interface SaveSettingsResult {
  ok: boolean
  /** True when the settings table does not exist yet (honest flag). */
  unavailable: boolean
  error?: string
}

/**
 * Upserts a flat set of keys into one jsonb bucket on the workspace_settings
 * row, merging with any existing keys in that bucket. 42P01-safe. Audited.
 *
 * @param patch  Flat key/value map to persist.
 * @param bucket Target jsonb column (defaults to "ai").
 */
export async function saveWorkspaceSettings(
  patch: Record<string, unknown>,
  bucket: SettingsBucket = "ai"
): Promise<SaveSettingsResult> {
  let ctx: AuthedContext
  try {
    ctx = await resolveContext()
  } catch (e) {
    return { ok: false, unavailable: false, error: e instanceof Error ? e.message : "Unauthorised" }
  }

  const supabase = await createClient()

  // Merge with the existing bucket so partial saves don't clobber other keys.
  const { data: existing, error: readErr } = await supabase
    .from("workspace_settings")
    .select(bucket)
    .eq("workspace_id", ctx.workspaceId)
    .maybeSingle()

  if (readErr && isMissingTable(readErr)) return { ok: false, unavailable: true }

  const current =
    (existing as Record<string, unknown> | null)?.[bucket]
  const merged = {
    ...(current && typeof current === "object" && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {}),
    ...patch,
  }

  const { error } = await supabase
    .from("workspace_settings")
    .upsert(
      {
        workspace_id: ctx.workspaceId,
        [bucket]: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" }
    )

  if (error) {
    if (isMissingTable(error)) return { ok: false, unavailable: true }
    return { ok: false, unavailable: false, error: error.message }
  }

  await writeAudit(ctx.workspaceId, ctx.userId, "workspace_settings.updated", {
    bucket,
    keys: Object.keys(patch),
  })
  revalidatePath("/property-manager/workspace-settings")
  return { ok: true, unavailable: false }
}

/* ------------------------------------------------------------------ */
/* Menu Builder — sidebar module visibility + default landing page      */
/* ------------------------------------------------------------------ */

export interface NavConfigPatch {
  hiddenModules?: string[]
  defaultLanding?: string
}

/**
 * Persists Menu Builder config into the `workspaces.settings` jsonb under a
 * `nav` key, merging so i18n/other settings are preserved. Owner/admin only.
 * Consumed live by SideNavigation (hidden modules) + login redirect (landing).
 */
export async function saveWorkspaceNav(patch: NavConfigPatch): Promise<SaveSettingsResult> {
  let ctx: AuthedContext
  try {
    ctx = await resolveContext()
  } catch (e) {
    return { ok: false, unavailable: false, error: e instanceof Error ? e.message : "Unauthorised" }
  }
  if (!ctx.isOwner && ctx.role !== "admin") {
    return { ok: false, unavailable: false, error: "Only owners and admins can change the menu." }
  }

  const supabase = await createClient()
  const { data: ws } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", ctx.workspaceId)
    .maybeSingle()

  const current =
    (ws?.settings && typeof ws.settings === "object" && !Array.isArray(ws.settings)
      ? (ws.settings as Record<string, unknown>)
      : {})
  const currentNav =
    (current.nav && typeof current.nav === "object" && !Array.isArray(current.nav)
      ? (current.nav as Record<string, unknown>)
      : {})
  const nextSettings = { ...current, nav: { ...currentNav, ...patch } }

  const { error } = await supabase
    .from("workspaces")
    .update({ settings: nextSettings, updated_at: new Date().toISOString() })
    .eq("id", ctx.workspaceId)

  if (error) return { ok: false, unavailable: false, error: error.message }

  await writeAudit(ctx.workspaceId, ctx.userId, "workspace.nav_updated", { keys: Object.keys(patch) })
  revalidatePath("/property-manager")
  return { ok: true, unavailable: false }
}

/* ------------------------------------------------------------------ */
/* Per-user preferences / notification settings                         */
/* ------------------------------------------------------------------ */

export interface UserPrefsResult {
  prefs: Record<string, unknown> | null
  unavailable: boolean
}

/**
 * Resolves the signed-in user's id and their active workspace id without
 * throwing. user_preferences is uniquely keyed on (user_id, workspace_id)
 * with both columns NOT NULL, so every read/write needs the active workspace.
 */
async function resolveUserWorkspace(): Promise<{ userId: string; workspaceId: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()

  let workspaceId = (profile?.current_workspace_id as string | undefined) ?? undefined
  if (!workspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    workspaceId = membership?.workspace_id as string | undefined
  }
  if (!workspaceId) return null
  return { userId: user.id, workspaceId }
}

/**
 * Records a personal account security/activity event for the signed-in user.
 *
 * Sensitive auth actions (password change, email change, 2FA enable/disable)
 * happen client-side via Supabase Auth, which has no app-level audit hook. This
 * server action lets those flows leave an entry in `audit_logs` so they appear
 * in the user's Activity feed and satisfy the audit-trail requirement.
 *
 * The `audit_logs` INSERT policy requires a workspace_id the user belongs to, so
 * we resolve the active workspace first; with no workspace the event is skipped
 * (never throws). Metadata MUST stay non-sensitive — never pass passwords/codes.
 */
export async function recordAccountEvent(
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<{ ok: boolean }> {
  const ctx = await resolveUserWorkspace()
  if (!ctx) return { ok: false }
  // Allow-list of account actions so a client cannot write arbitrary audit rows.
  const ALLOWED = new Set([
    "account.password_changed",
    "account.email_change_requested",
    "account.mfa_enabled",
    "account.mfa_disabled",
  ])
  if (!ALLOWED.has(action)) return { ok: false }
  const supabase = await createClient()
  await recordAudit(supabase, {
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action,
    resourceType: "user",
    resourceId: ctx.userId,
    metadata,
  })
  return { ok: true }
}

/** Reads the current user's preferences for their active workspace. 42P01-safe. */
export async function getUserPreferences(): Promise<UserPrefsResult> {
  try {
    const ctx = await resolveUserWorkspace()
    if (!ctx) return { prefs: null, unavailable: false }
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", ctx.userId)
      .eq("workspace_id", ctx.workspaceId)
      .maybeSingle()

    if (error) {
      if (isMissingTable(error)) return { prefs: null, unavailable: true }
      return { prefs: null, unavailable: false }
    }
    return { prefs: (data as Record<string, unknown>) ?? null, unavailable: false }
  } catch {
    return { prefs: null, unavailable: false }
  }
}

/**
 * Upserts a partial set of keys onto the current user's preferences for their
 * active workspace. Keys on the (user_id, workspace_id) unique constraint.
 * 42P01-safe.
 */
export async function saveUserPreferences(
  patch: Record<string, unknown>
): Promise<SaveSettingsResult> {
  const ctx = await resolveUserWorkspace()
  if (!ctx) return { ok: false, unavailable: false, error: "Not authenticated." }
  const supabase = await createClient()

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: ctx.userId,
        workspace_id: ctx.workspaceId,
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,workspace_id" }
    )

  if (error) {
    if (isMissingTable(error)) return { ok: false, unavailable: true }
    return { ok: false, unavailable: false, error: error.message }
  }
  return { ok: true, unavailable: false }
}

/* ------------------------------------------------------------------ */
/* Team: change role / remove (cannot remove last owner)                */
/* ------------------------------------------------------------------ */

export interface TeamMutationResult {
  ok: boolean
  error?: string
}

async function ownerCount(workspaceId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("role", "owner")
  return count ?? 0
}

export async function changeMemberRole(
  memberId: string,
  newRole: string
): Promise<TeamMutationResult> {
  let ctx: AuthedContext
  try {
    ctx = await resolveContext()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorised" }
  }
  if (!ctx.isOwner && ctx.role !== "admin") {
    return { ok: false, error: "Only owners and admins can change roles." }
  }

  const supabase = await createClient()
  // Guard: cannot demote the last owner
  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspaceId)
    .maybeSingle()

  if (target?.role === "owner" && newRole !== "owner") {
    if ((await ownerCount(ctx.workspaceId)) <= 1) {
      return { ok: false, error: "Cannot demote the last owner. Transfer ownership first." }
    }
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspaceId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(ctx.workspaceId, ctx.userId, "team.role_changed", { memberId, newRole }, "workspace_member", memberId)
  revalidatePath("/property-manager/workspace-settings/team")
  return { ok: true }
}

export async function removeMember(memberId: string): Promise<TeamMutationResult> {
  let ctx: AuthedContext
  try {
    ctx = await resolveContext()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorised" }
  }
  if (!ctx.isOwner && ctx.role !== "admin") {
    return { ok: false, error: "Only owners and admins can remove members." }
  }

  const supabase = await createClient()
  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspaceId)
    .maybeSingle()

  if (target?.role === "owner" && (await ownerCount(ctx.workspaceId)) <= 1) {
    return { ok: false, error: "Cannot remove the last owner." }
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspaceId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(ctx.workspaceId, ctx.userId, "team.member_removed", { memberId }, "workspace_member", memberId)
  revalidatePath("/property-manager/workspace-settings/team")
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* Danger zone: leave / transfer / archive / delete                     */
/* ------------------------------------------------------------------ */

export interface DangerContext {
  workspaceId: string
  workspaceName: string
  role: string | null
  isOwner: boolean
  ownerCount: number
  memberCount: number
  /** Other members (excluding self) eligible to receive ownership. */
  otherMembers: { id: string; userId: string; name: string; role: string }[]
}

export async function getDangerContext(): Promise<DangerContext | null> {
  try {
    const ctx = await resolveContext()
    const supabase = await createClient()

    const { data: ws } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", ctx.workspaceId)
      .maybeSingle()

    const { data: members } = await supabase
      .from("workspace_members")
      .select("id, user_id, role, profiles(full_name, email)")
      .eq("workspace_id", ctx.workspaceId)

    const list = (members ?? []).map((m) => {
      const p = (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as
        | { full_name: string | null; email: string | null }
        | null
      return {
        id: m.id as string,
        userId: m.user_id as string,
        name: p?.full_name ?? p?.email ?? "Unknown",
        role: (m.role as string) ?? "member",
      }
    })

    return {
      workspaceId: ctx.workspaceId,
      workspaceName: (ws?.name as string) ?? "this workspace",
      role: ctx.role,
      isOwner: ctx.isOwner,
      ownerCount: list.filter((m) => m.role === "owner").length,
      memberCount: list.length,
      otherMembers: list.filter((m) => m.userId !== ctx.userId),
    }
  } catch {
    return null
  }
}

export interface DangerResult {
  ok: boolean
  error?: string
  /** Where the client should navigate after success. */
  redirect?: string
}

/** Leave the workspace. Sole owner is blocked. */
export async function leaveWorkspace(): Promise<DangerResult> {
  let ctx: AuthedContext
  try {
    ctx = await resolveContext()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorised" }
  }
  const supabase = await createClient()

  if (ctx.isOwner && (await ownerCount(ctx.workspaceId)) <= 1) {
    return {
      ok: false,
      error: "You are the sole owner. Transfer ownership or delete the workspace instead.",
    }
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", ctx.workspaceId)
    .eq("user_id", ctx.userId)

  if (error) return { ok: false, error: error.message }

  // Move user to another workspace they belong to, or clear it
  const { data: next } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", ctx.userId)
    .limit(1)
    .maybeSingle()

  await supabase
    .from("profiles")
    .update({ current_workspace_id: next?.workspace_id ?? null, updated_at: new Date().toISOString() })
    .eq("id", ctx.userId)

  await writeAudit(ctx.workspaceId, ctx.userId, "workspace.left", {}, "workspace", ctx.workspaceId)
  revalidatePath("/property-manager")
  return { ok: true, redirect: next?.workspace_id ? "/property-manager" : "/onboarding" }
}

/** Transfer ownership to another member, demoting self to admin. */
export async function transferOwnership(targetUserId: string): Promise<DangerResult> {
  let ctx: AuthedContext
  try {
    ctx = await resolveContext()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorised" }
  }
  if (!ctx.isOwner) return { ok: false, error: "Only an owner can transfer ownership." }

  const supabase = await createClient()

  // Promote target to owner
  const { error: promoteErr } = await supabase
    .from("workspace_members")
    .update({ role: "owner" })
    .eq("workspace_id", ctx.workspaceId)
    .eq("user_id", targetUserId)
  if (promoteErr) return { ok: false, error: promoteErr.message }

  // Demote self to admin
  await supabase
    .from("workspace_members")
    .update({ role: "admin" })
    .eq("workspace_id", ctx.workspaceId)
    .eq("user_id", ctx.userId)

  // Update workspaces.owner_id if the column exists (best-effort)
  await supabase
    .from("workspaces")
    .update({ owner_id: targetUserId })
    .eq("id", ctx.workspaceId)

  await writeAudit(ctx.workspaceId, ctx.userId, "workspace.ownership_transferred", { targetUserId }, "workspace", ctx.workspaceId)
  revalidatePath("/property-manager/workspace-settings")
  return { ok: true }
}

/** Soft-archive the workspace. Owner-only. */
export async function archiveWorkspace(): Promise<DangerResult> {
  let ctx: AuthedContext
  try {
    ctx = await resolveContext()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorised" }
  }
  if (!ctx.isOwner) return { ok: false, error: "Only an owner can archive the workspace." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("workspaces")
    .update({ archived_at: new Date().toISOString(), status: "archived" })
    .eq("id", ctx.workspaceId)

  if (error) {
    // Column may not exist — try a minimal status-only update
    const { error: fallbackErr } = await supabase
      .from("workspaces")
      .update({ status: "archived" })
      .eq("id", ctx.workspaceId)
    if (fallbackErr) return { ok: false, error: "Archiving is not available — the workspaces table has no archive column." }
  }

  await writeAudit(ctx.workspaceId, ctx.userId, "workspace.archived", {}, "workspace", ctx.workspaceId)
  revalidatePath("/property-manager")
  return { ok: true, redirect: "/property-manager" }
}

/** Soft-delete the workspace (owner-only, name confirmation checked client-side). */
export async function deleteWorkspace(confirmName: string): Promise<DangerResult> {
  let ctx: AuthedContext
  try {
    ctx = await resolveContext()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorised" }
  }
  if (!ctx.isOwner) return { ok: false, error: "Only an owner can delete the workspace." }

  const supabase = await createClient()
  const { data: ws } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", ctx.workspaceId)
    .maybeSingle()

  if (!ws || (ws.name as string) !== confirmName) {
    return { ok: false, error: "Workspace name does not match." }
  }

  // Prefer soft-delete (deleted_at). Fall back to status flag.
  const { error } = await supabase
    .from("workspaces")
    .update({ deleted_at: new Date().toISOString(), status: "deleted" })
    .eq("id", ctx.workspaceId)

  if (error) {
    const { error: fallbackErr } = await supabase
      .from("workspaces")
      .update({ status: "deleted" })
      .eq("id", ctx.workspaceId)
    if (fallbackErr) return { ok: false, error: "Delete failed. Please contact support." }
  }

  await writeAudit(ctx.workspaceId, ctx.userId, "workspace.deleted", { name: confirmName }, "workspace", ctx.workspaceId)
  revalidatePath("/property-manager")
  return { ok: true, redirect: "/onboarding" }
}

/* ------------------------------------------------------------------ */
/* Storage usage                                                        */
/* ------------------------------------------------------------------ */

export interface StorageUsageResult {
  ok: boolean
  error?: string
  /** Bytes consumed by non-deleted files in this workspace. */
  usedBytes: number
  /** Base quota from plan tier, in bytes. */
  baseQuotaBytes: number
  /** Extra bytes from purchased add-on packs (10 GB each). */
  addonQuotaBytes: number
  /** Total quota = base + addon. */
  totalQuotaBytes: number
  /** Purchased add-on quantity (number of 10 GB packs). */
  addonPacks: number
}

const STORAGE_BASE_BYTES: Record<string, number> = {
  starter:    2  * 1024 ** 3,
  operator:   5  * 1024 ** 3,
  scale:      15 * 1024 ** 3,
  pro_agency: 35 * 1024 ** 3,
  enterprise: 100 * 1024 ** 3,
}
const ADDON_PACK_BYTES = 10 * 1024 ** 3 // 10 GB per pack

/**
 * Returns real storage usage for the current workspace, factoring in plan tier
 * and any purchased extra-storage add-on packs.
 */
export async function getStorageUsage(): Promise<StorageUsageResult> {
  let ctx: AuthedContext
  try {
    ctx = await resolveContext()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorised", usedBytes: 0, baseQuotaBytes: 0, addonQuotaBytes: 0, totalQuotaBytes: 0, addonPacks: 0 }
  }

  const supabase = await createClient()

  // Resolve plan tier
  let tier = "starter"
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", ctx.workspaceId)
      .maybeSingle()
    if (ws?.plan && typeof ws.plan === "string") tier = ws.plan
  } catch { /* fail open */ }

  const baseQuotaBytes = STORAGE_BASE_BYTES[tier] ?? STORAGE_BASE_BYTES.starter

  // Sum file sizes (exclude deleted files)
  let usedBytes = 0
  try {
    const { data } = await supabase
      .from("files")
      .select("size_bytes")
      .eq("workspace_id", ctx.workspaceId)
      .neq("status", "deleted")
    if (Array.isArray(data)) {
      usedBytes = data.reduce((sum, r) => sum + Number((r as { size_bytes?: number }).size_bytes ?? 0), 0)
    }
  } catch { /* fail open — 0 used is a safe display default */ }

  // Count purchased extra-storage add-on packs
  let addonPacks = 0
  try {
    const { data } = await supabase
      .from("workspace_addons")
      .select("quantity")
      .eq("workspace_id", ctx.workspaceId)
      .eq("addon_key", "extra_storage")
      .eq("status", "active")
    if (Array.isArray(data)) {
      addonPacks = data.reduce((sum, r) => sum + Number((r as { quantity?: number }).quantity ?? 0), 0)
    }
  } catch { /* fail open */ }

  const addonQuotaBytes = addonPacks * ADDON_PACK_BYTES
  const totalQuotaBytes = baseQuotaBytes + addonQuotaBytes

  return { ok: true, usedBytes, baseQuotaBytes, addonQuotaBytes, totalQuotaBytes, addonPacks }
}
