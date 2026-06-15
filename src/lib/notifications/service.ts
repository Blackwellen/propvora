"use client"

// ────────────────────────────────────────────────────────────────────────────
// Notification creation service
//
// Workspace-scoped, RLS-safe writes into the live `notifications` table.
// Live columns (introspected 2026-06-15):
//   workspace_id, user_id, kind, title, body, severity (enum),
//   link, href, entity_type, entity_id, metadata (jsonb), read, read_at, …
//
// RLS allows a workspace member to INSERT a notification for any member of a
// workspace they belong to (policy `notifications_workspace_insert`), so we can
// notify teammates — not just ourselves. No service role is ever used here.
// ────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/client"
import { resolveEntityHref, type EntityType } from "./routes"

export type NotificationSeverity = "info" | "success" | "warning" | "danger"

export interface CreateNotificationInput {
  workspaceId: string
  userId: string
  title: string
  body?: string | null
  /** Free-form event key, e.g. "task.assigned", "compliance.overdue". */
  kind: string
  severity?: NotificationSeverity
  resourceType?: EntityType | string | null
  resourceId?: string | null
  /** Explicit link override; otherwise derived from resourceType/resourceId. */
  href?: string | null
  /** Extra structured context (also used for idempotency dedupe keys). */
  metadata?: Record<string, unknown>
}

export interface CreateNotificationResult {
  ok: boolean
  id?: string
  error?: string
}

/**
 * Create a single workspace-scoped notification. RLS-safe; silently no-ops
 * (returns ok:false) on permission/missing-table errors so emitters never
 * break the primary mutation they hang off.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  const { workspaceId, userId, title } = input
  if (!workspaceId || !userId || !title) {
    return { ok: false, error: "workspaceId, userId and title are required" }
  }

  const href =
    input.href ?? resolveEntityHref(input.resourceType, input.resourceId) ?? null

  const row = {
    workspace_id: workspaceId,
    user_id: userId,
    kind: input.kind,
    title,
    body: input.body ?? null,
    severity: input.severity ?? "info",
    entity_type: input.resourceType ?? null,
    entity_id: input.resourceId ?? null,
    link: href,
    href,
    metadata: input.metadata ?? {},
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("notifications")
      .insert(row)
      .select("id")
      .single()
    if (error) {
      if (error.code === "42P01") return { ok: false, error: "notifications table missing" }
      return { ok: false, error: error.message }
    }
    return { ok: true, id: (data as { id: string }).id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Fan-out helper: create the same notification for multiple recipients
 * (e.g. all watchers on a task). De-duplicates user ids and skips empties.
 */
export async function createNotificationForUsers(
  userIds: Array<string | null | undefined>,
  input: Omit<CreateNotificationInput, "userId">,
): Promise<CreateNotificationResult[]> {
  const unique = Array.from(new Set(userIds.filter((u): u is string => !!u)))
  return Promise.all(unique.map((userId) => createNotification({ ...input, userId })))
}

// ────────────────────────────────────────────────────────────────────────────
// Idempotency
//
// Emitters fire from React mutations that can re-run (StrictMode double-invoke,
// retries, re-renders). We guard with a short-lived in-memory key set so the
// *same logical event* (e.g. "task X assigned to user Y") only fires once per
// session window. This is a UX safeguard, not a DB constraint.
// ────────────────────────────────────────────────────────────────────────────

const recentlyFired = new Map<string, number>()
const DEDUPE_WINDOW_MS = 60_000

/** Returns true if this key was fired within the dedupe window (and refreshes it). */
export function alreadyFired(key: string): boolean {
  const now = Date.now()
  // opportunistic cleanup
  if (recentlyFired.size > 200) {
    for (const [k, t] of recentlyFired) {
      if (now - t > DEDUPE_WINDOW_MS) recentlyFired.delete(k)
    }
  }
  const last = recentlyFired.get(key)
  recentlyFired.set(key, now)
  return last !== undefined && now - last < DEDUPE_WINDOW_MS
}
