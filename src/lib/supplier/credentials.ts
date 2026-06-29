/**
 * Supplier trade credentials — data layer.
 *
 * Persists the trade/competency credentials a supplier holds (Gas Safe number,
 * NICEIC registration, RGI, Meister, etc.) into `supplier_credentials`. The
 * required credential per work type + jurisdiction comes from the trade-certs
 * engine (`src/lib/work/trade-certs.ts`); this layer is the read/write side that
 * was previously missing (the table + RLS existed but nothing wrote to it).
 *
 * RLS: `supplier_credentials` has an ALL policy `is_workspace_member(workspace_id)`,
 * so all access is workspace-scoped at the database. We additionally scope every
 * query by `workspace_id` and the API route checks supplier-workspace membership.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export interface SupplierCredentialRow {
  id: string
  workspace_id: string
  supplier_id: string | null
  credential_type: string
  jurisdiction: string | null
  reference: string | null
  verified_at: string | null
  expires_at: string | null
  document_path: string | null
  created_at: string
}

export interface SupplierCredentialInput {
  credential_type: string
  jurisdiction?: string | null
  reference?: string | null
  expires_at?: string | null
  document_path?: string | null
  supplier_id?: string | null
}

/** List a workspace's supplier credentials, newest first. */
export async function listSupplierCredentials(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierCredentialRow[]> {
  const { data, error } = await supabase
    .from("supplier_credentials")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as SupplierCredentialRow[]
}

/** Add a credential. `credential_type` is required; empty optional fields are
 *  stored as null (never empty strings). */
export async function addSupplierCredential(
  supabase: SupabaseClient,
  workspaceId: string,
  input: SupplierCredentialInput
): Promise<SupplierCredentialRow> {
  const credentialType = (input.credential_type ?? "").trim()
  if (!credentialType) throw new Error("credential_type is required")

  const { data, error } = await supabase
    .from("supplier_credentials")
    .insert({
      workspace_id: workspaceId,
      credential_type: credentialType,
      jurisdiction: input.jurisdiction?.trim() || null,
      reference: input.reference?.trim() || null,
      expires_at: input.expires_at || null,
      document_path: input.document_path || null,
      supplier_id: input.supplier_id || null,
    })
    .select("*")
    .single()
  if (error) throw error
  return data as SupplierCredentialRow
}

/** Delete a credential (workspace-scoped). */
export async function deleteSupplierCredential(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("supplier_credentials")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId)
  if (error) throw error
}

/** Lifecycle status of a credential from its expiry date (display helper). */
export function credentialStatus(row: Pick<SupplierCredentialRow, "expires_at" | "verified_at">, now = Date.now()):
  | "expired"
  | "expiring"
  | "verified"
  | "unverified" {
  if (row.expires_at) {
    const exp = new Date(`${row.expires_at}T00:00:00.000Z`).getTime()
    if (!Number.isNaN(exp)) {
      if (exp < now) return "expired"
      if (exp - now < 1000 * 60 * 60 * 24 * 30) return "expiring"
    }
  }
  return row.verified_at ? "verified" : "unverified"
}
