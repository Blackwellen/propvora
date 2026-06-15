import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier WORKSPACE services catalogue data layer (P3).
//
// Backed by `supplier_workspace_services`. Workspace-scoped and 42P01/42703-
// tolerant (missing table → [] / no-op). RLS enforces isolation.
// ============================================================================

export type PricingModel = "hourly" | "fixed" | "quote_required"

export interface SupplierService {
  id: string
  workspace_id: string
  name: string
  category: string | null
  description: string | null
  pricing_model: PricingModel
  rate_pence: number | null
  callout_fee_pence: number | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierServiceInput {
  name: string
  category?: string | null
  description?: string | null
  pricing_model?: PricingModel
  rate_pence?: number | null
  callout_fee_pence?: number | null
  active?: boolean
}

const SERVICE_COLS =
  "id, workspace_id, name, category, description, pricing_model, rate_pence, " +
  "callout_fee_pence, active, created_at, updated_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703"
}

/**
 * List a supplier workspace's services. By default returns active services
 * only; pass `{ includeInactive: true }` to include deactivated ones.
 */
export async function listServices(
  supabase: SupabaseClient,
  workspaceId: string,
  opts: { includeInactive?: boolean } = {}
): Promise<SupplierService[]> {
  if (!workspaceId) return []
  try {
    const base = supabase
      .from("supplier_workspace_services")
      .select(SERVICE_COLS)
      .eq("workspace_id", workspaceId)
    const filtered = opts.includeInactive ? base : base.eq("active", true)
    const { data, error } = await filtered.order("created_at", { ascending: true })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as SupplierService[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Create a new service for a supplier workspace. */
export async function createService(
  supabase: SupabaseClient,
  workspaceId: string,
  input: SupplierServiceInput
): Promise<SupplierService | null> {
  if (!workspaceId) return null
  const row = {
    workspace_id: workspaceId,
    pricing_model: "quote_required" as PricingModel,
    active: true,
    ...input,
  }
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_services")
      .insert(row)
      .select(SERVICE_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierService | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Update an existing service (scoped to the workspace for safety). */
export async function updateService(
  supabase: SupabaseClient,
  workspaceId: string,
  serviceId: string,
  patch: Partial<SupplierServiceInput>
): Promise<SupplierService | null> {
  if (!workspaceId || !serviceId) return null
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_services")
      .update(patch)
      .eq("id", serviceId)
      .eq("workspace_id", workspaceId)
      .select(SERVICE_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierService | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Soft-deactivate a service (sets active=false). */
export async function deactivateService(
  supabase: SupabaseClient,
  workspaceId: string,
  serviceId: string
): Promise<SupplierService | null> {
  return updateService(supabase, workspaceId, serviceId, { active: false })
}
