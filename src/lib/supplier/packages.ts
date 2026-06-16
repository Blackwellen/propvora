import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier WORKSPACE packages data layer (P3 deep).
//
// Backed by `supplier_workspace_packages` (workspace_id-scoped, RLS via
// is_supplier_workspace_member). A package is a productised, fixed-scope
// offering the supplier publishes alongside their à-la-carte services.
//
// DISTINCT from the legacy contact-based `supplier_packages` (which requires a
// supplier_id referencing the operator's supplier directory and so cannot
// represent a first-class supplier workspace). Money is INTEGER PENCE.
// 42P01/42703-tolerant.
// ============================================================================

export interface SupplierPackage {
  id: string
  workspace_id: string
  name: string
  description: string | null
  price_pence: number | null
  currency: string
  duration_days: number | null
  inclusions: string[]
  exclusions: string[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierPackageInput {
  name: string
  description?: string | null
  price_pence?: number | null
  currency?: string
  duration_days?: number | null
  inclusions?: string[]
  exclusions?: string[]
  active?: boolean
}

const PKG_COLS =
  "id, workspace_id, name, description, price_pence, currency, duration_days, " +
  "inclusions, exclusions, active, created_at, updated_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703" || c === "PGRST205"
}

/** List a supplier workspace's packages (newest first). */
export async function listPackages(
  supabase: SupabaseClient,
  workspaceId: string,
  opts: { includeInactive?: boolean } = {}
): Promise<SupplierPackage[]> {
  if (!workspaceId) return []
  try {
    let q = supabase
      .from("supplier_workspace_packages")
      .select(PKG_COLS)
      .eq("workspace_id", workspaceId)
    if (!opts.includeInactive) q = q.eq("active", true)
    const { data, error } = await q.order("created_at", { ascending: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as SupplierPackage[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Create a package. */
export async function createPackage(
  supabase: SupabaseClient,
  workspaceId: string,
  input: SupplierPackageInput
): Promise<SupplierPackage | null> {
  if (!workspaceId) return null
  const row = {
    workspace_id: workspaceId,
    currency: input.currency ?? "GBP",
    active: input.active ?? true,
    inclusions: input.inclusions ?? [],
    exclusions: input.exclusions ?? [],
    name: input.name,
    description: input.description ?? null,
    price_pence: input.price_pence ?? null,
    duration_days: input.duration_days ?? null,
  }
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_packages")
      .insert(row)
      .select(PKG_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierPackage | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Update a package (workspace-scoped for safety). */
export async function updatePackage(
  supabase: SupabaseClient,
  workspaceId: string,
  packageId: string,
  patch: Partial<SupplierPackageInput>
): Promise<SupplierPackage | null> {
  if (!workspaceId || !packageId) return null
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_packages")
      .update(patch)
      .eq("id", packageId)
      .eq("workspace_id", workspaceId)
      .select(PKG_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as SupplierPackage | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/** Soft-deactivate a package. */
export async function deactivatePackage(
  supabase: SupabaseClient,
  workspaceId: string,
  packageId: string
): Promise<SupplierPackage | null> {
  return updatePackage(supabase, workspaceId, packageId, { active: false })
}
