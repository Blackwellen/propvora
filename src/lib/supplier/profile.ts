import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier WORKSPACE profile data layer (P3).
//
// Backed by `supplier_workspace_profiles` (workspace_id PK; one profile per
// supplier-type workspace). All helpers are workspace-scoped and 42P01/42703-
// tolerant: a missing table / column resolves to a safe empty/no-op result
// rather than throwing, so the UI degrades gracefully before/after migration.
//
// Auth + isolation are enforced by RLS (is_supplier_workspace_member). The
// caller passes an authenticated SupabaseClient (server or browser).
// ============================================================================

export type SupplierStatus = "draft" | "active" | "paused"

export interface SupplierProfile {
  workspace_id: string
  display_name: string | null
  bio: string | null
  trades: string[]
  years_experience: number | null
  insurance_verified: boolean
  public_liability_cover_pence: number | null
  service_radius_km: number | null
  base_location: string | null
  latitude: number | null
  longitude: number | null
  response_time_hours: number | null
  accepts_emergency: boolean
  status: SupplierStatus
  created_at: string
  updated_at: string
}

/** Fields a caller may set on a profile (workspace_id is supplied separately). */
export type SupplierProfileInput = Partial<
  Omit<SupplierProfile, "workspace_id" | "created_at" | "updated_at">
>

const PROFILE_COLS =
  "workspace_id, display_name, bio, trades, years_experience, insurance_verified, " +
  "public_liability_cover_pence, service_radius_km, base_location, latitude, longitude, " +
  "response_time_hours, accepts_emergency, status, created_at, updated_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

/** True for schema-shape errors we tolerate (missing table / column). */
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703"
}

/**
 * Fetch the supplier profile for a workspace, or null when none exists yet (or
 * on a tolerated schema error).
 */
export async function getSupplierProfile(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierProfile | null> {
  if (!workspaceId) return null
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_profiles")
      .select(PROFILE_COLS)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierProfile | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/**
 * Create or update the supplier profile for a workspace. Returns the persisted
 * row, or null on a tolerated schema error.
 */
export async function upsertSupplierProfile(
  supabase: SupabaseClient,
  workspaceId: string,
  input: SupplierProfileInput
): Promise<SupplierProfile | null> {
  if (!workspaceId) return null
  const row = { workspace_id: workspaceId, ...input }
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_profiles")
      .upsert(row, { onConflict: "workspace_id" })
      .select(PROFILE_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierProfile | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Set the publish status (draft/active/paused) for a supplier workspace. */
export async function setSupplierStatus(
  supabase: SupabaseClient,
  workspaceId: string,
  status: SupplierStatus
): Promise<SupplierProfile | null> {
  return upsertSupplierProfile(supabase, workspaceId, { status })
}
