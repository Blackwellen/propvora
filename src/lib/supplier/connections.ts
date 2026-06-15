// ============================================================================
// Supplier ↔ Operator CONNECTIONS data layer (P3).
//
// An operator workspace and a supplier workspace form a `supplier_connections`
// row. The operator invites; the supplier accepts; either side may pause/end.
//
// Backbone decision: the P0 foundation's `supplier_workspace_members` is
// MEMBERSHIP-ONLY (links users → a supplier workspace) and carries no status,
// so it cannot represent the operator↔supplier link. This module owns the
// dedicated `supplier_connections` table instead.
//
// All functions are workspace-scoped with RLS as the real boundary, and are
// 42P01/PGRST205-tolerant: a missing table returns an empty/neutral result
// rather than throwing. Membership of the correct SIDE is enforced by the API
// layer before calling write helpers here.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

/** Postgres / PostgREST codes meaning "table not provisioned yet". */
export const NOT_PROVISIONED = new Set(["42P01", "PGRST205"])

/** Connection lifecycle (mirrors the DB CHECK). */
export type ConnectionStatus = "invited" | "active" | "paused" | "ended"

export interface SupplierConnection {
  id: string
  operator_workspace_id: string
  supplier_workspace_id: string
  status: ConnectionStatus
  invited_by: string | null
  created_at: string
  updated_at: string
}

function isMissingTable(err: { code?: string } | null | undefined): boolean {
  return Boolean(err?.code && NOT_PROVISIONED.has(err.code))
}

/**
 * List connections for a workspace acting as EITHER side.
 * `side` selects whether `workspaceId` is the operator or the supplier.
 * RLS additionally guarantees the caller can only read rows touching a
 * workspace they belong to.
 */
export async function listConnections(
  supabase: SupabaseClient,
  workspaceId: string,
  side: "operator" | "supplier"
): Promise<SupplierConnection[]> {
  const column =
    side === "operator" ? "operator_workspace_id" : "supplier_workspace_id"
  const { data, error } = await supabase
    .from("supplier_connections")
    .select("*")
    .eq(column, workspaceId)
    .order("created_at", { ascending: false })

  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return (data as SupplierConnection[]) ?? []
}

/**
 * Operator invites a supplier workspace. Idempotent against the UNIQUE
 * (operator, supplier) constraint: if the pair already exists the existing row
 * is returned (re-inviting an `ended`/`paused` pair re-activates the invite).
 * The API gates this with `gateSupplierWorkspace` + operator membership.
 */
export async function inviteSupplier(
  supabase: SupabaseClient,
  params: {
    operatorWorkspaceId: string
    supplierWorkspaceId: string
    invitedBy: string
  }
): Promise<SupplierConnection> {
  const { operatorWorkspaceId, supplierWorkspaceId, invitedBy } = params

  // Re-activate an existing pair rather than violate the UNIQUE constraint.
  const { data: existing, error: existingErr } = await supabase
    .from("supplier_connections")
    .select("*")
    .eq("operator_workspace_id", operatorWorkspaceId)
    .eq("supplier_workspace_id", supplierWorkspaceId)
    .maybeSingle()
  if (existingErr && !isMissingTable(existingErr)) throw existingErr

  if (existing) {
    const row = existing as SupplierConnection
    if (row.status === "active" || row.status === "invited") return row
    const { data: updated, error: updErr } = await supabase
      .from("supplier_connections")
      .update({ status: "invited", invited_by: invitedBy })
      .eq("id", row.id)
      .select("*")
      .single()
    if (updErr) throw updErr
    return updated as SupplierConnection
  }

  const { data, error } = await supabase
    .from("supplier_connections")
    .insert({
      operator_workspace_id: operatorWorkspaceId,
      supplier_workspace_id: supplierWorkspaceId,
      status: "invited",
      invited_by: invitedBy,
    })
    .select("*")
    .single()
  if (error) throw error
  return data as SupplierConnection
}

/**
 * Supplier accepts an invite (invited → active). The API verifies the caller is
 * a member of the SUPPLIER workspace before calling this.
 */
export async function acceptConnection(
  supabase: SupabaseClient,
  connectionId: string
): Promise<SupplierConnection | null> {
  const { data, error } = await supabase
    .from("supplier_connections")
    .update({ status: "active" })
    .eq("id", connectionId)
    .eq("status", "invited")
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return (data as SupplierConnection) ?? null
}

/**
 * Set a connection's status (active ↔ paused, or → ended). Either side may
 * pause/end; the API verifies the caller belongs to one of the two workspaces.
 */
export async function setConnectionStatus(
  supabase: SupabaseClient,
  connectionId: string,
  status: ConnectionStatus
): Promise<SupplierConnection | null> {
  const { data, error } = await supabase
    .from("supplier_connections")
    .update({ status })
    .eq("id", connectionId)
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return (data as SupplierConnection) ?? null
}

/** End a connection (→ ended). Convenience wrapper over setConnectionStatus. */
export function endConnection(
  supabase: SupabaseClient,
  connectionId: string
): Promise<SupplierConnection | null> {
  return setConnectionStatus(supabase, connectionId, "ended")
}

/** Load a single connection by id (RLS-scoped). */
export async function getConnection(
  supabase: SupabaseClient,
  connectionId: string
): Promise<SupplierConnection | null> {
  const { data, error } = await supabase
    .from("supplier_connections")
    .select("*")
    .eq("id", connectionId)
    .maybeSingle()
  if (error) {
    if (isMissingTable(error)) return null
    throw error
  }
  return (data as SupplierConnection) ?? null
}
