import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier NOTIFICATIONS data layer.
//
// Backed by `supplier_notifications` (workspace_id-scoped, RLS via
// is_supplier_workspace_member). Notifications are generated from real supplier
// events (new lead, job assigned/updated, invoice paid, payout, insurance
// expiring, dispute) and surfaced in the bell + the notification centre page.
// 42P01/42703/PGRST205-tolerant — a not-yet-provisioned table contributes [].
// ============================================================================

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "42703"])

function isMissing(err: { code?: string } | null | undefined): boolean {
  return Boolean(err?.code && NOT_PROVISIONED.has(err.code))
}

export type SupplierNotificationType =
  | "lead"
  | "job"
  | "quote"
  | "invoice"
  | "payout"
  | "review"
  | "verification"
  | "insurance"
  | "dispute"
  | "message"
  | "info"

export interface SupplierNotification {
  id: string
  workspace_id: string
  type: SupplierNotificationType
  title: string
  body: string | null
  href: string | null
  resource_type: string | null
  resource_id: string | null
  read_at: string | null
  created_at: string
}

export interface SupplierNotificationInput {
  type?: SupplierNotificationType
  title: string
  body?: string | null
  href?: string | null
  resource_type?: string | null
  resource_id?: string | null
}

/** List notifications for a workspace, newest first. */
export async function listNotifications(
  supabase: SupabaseClient,
  workspaceId: string,
  opts?: { unreadOnly?: boolean; limit?: number }
): Promise<SupplierNotification[]> {
  let query = supabase
    .from("supplier_notifications")
    .select("*")
    .eq("workspace_id", workspaceId)
  if (opts?.unreadOnly) query = query.is("read_at", null)
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50)
  if (error) {
    if (isMissing(error)) return []
    throw error
  }
  return (data as SupplierNotification[]) ?? []
}

/** Count unread notifications (cheap badge). */
export async function countUnread(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("supplier_notifications")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .is("read_at", null)
  if (error) {
    if (isMissing(error)) return 0
    throw error
  }
  return count ?? 0
}

/** Create a notification (used by event hooks + the proof harness). */
export async function createNotification(
  supabase: SupabaseClient,
  workspaceId: string,
  input: SupplierNotificationInput
): Promise<SupplierNotification | null> {
  const { data, error } = await supabase
    .from("supplier_notifications")
    .insert({
      workspace_id: workspaceId,
      type: input.type ?? "info",
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      resource_type: input.resource_type ?? null,
      resource_id: input.resource_id ?? null,
    })
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissing(error)) return null
    throw error
  }
  return (data as SupplierNotification) ?? null
}

/** Mark one notification read. */
export async function markRead(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("supplier_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .is("read_at", null)
  if (error && !isMissing(error)) throw error
  return !error
}

/** Mark every unread notification read for a workspace. */
export async function markAllRead(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("supplier_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .is("read_at", null)
  if (error && !isMissing(error)) throw error
  return !error
}
