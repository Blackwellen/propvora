"use client"

import { createClient } from "@/lib/supabase/client"

// ============================================================
// Portal income/rent — aligned to the LIVE schema.
//
// Rent and other income are stored in `money_transactions`
// (direction = 'in'). There is NO `income_records` / `money_income`
// table — portal pages previously queried those phantom tables and so
// rendered permanently empty even when real rent existed. This module
// is the single, schema-correct income data layer for all portals.
//
//   money_transactions (
//     id, workspace_id, direction, category, amount, currency,
//     occurred_on, property_id, tenancy_id, description, reconciled, …
//   )
//
// money_transactions rows are realised cash movements, so every row is
// treated as "received". Scope is ALWAYS pinned to the caller's own
// property/tenancy id set — an empty id set returns [] (never widened to
// all-workspace rows). 42P01/42703-safe → [] rather than throw.
// ============================================================

export interface PortalIncomeRow {
  id: string
  property_id: string | null
  tenancy_id: string | null
  amount: number
  currency: string | null
  /** ISO date the payment occurred (money_transactions.occurred_on). */
  date: string
  /** Normalised lifecycle status. Realised cash => always "received". */
  status: "received"
  category: string | null
  description: string | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

function mapRow(r: Record<string, unknown>): PortalIncomeRow {
  return {
    id: r.id as string,
    property_id: (r.property_id as string) ?? null,
    tenancy_id: (r.tenancy_id as string) ?? null,
    amount: (r.amount as number) ?? 0,
    currency: (r.currency as string) ?? "GBP",
    date: (r.occurred_on as string) ?? "",
    status: "received",
    category: (r.category as string) ?? null,
    description: (r.description as string) ?? null,
  }
}

const SELECT = "id, property_id, tenancy_id, amount, currency, occurred_on, description, category, reconciled, direction"

/**
 * Income (direction='in') scoped to a set of tenancy ids. Used by the tenant
 * portal — a tenant only ever sees rent recorded against THEIR own tenancy.
 * Empty id set => [].
 */
export async function getTenancyIncome(tenancyIds: string[]): Promise<PortalIncomeRow[]> {
  const ids = tenancyIds.filter(Boolean)
  if (ids.length === 0) return []
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("money_transactions")
      .select(SELECT)
      .eq("direction", "in")
      .in("tenancy_id", ids)
      .order("occurred_on", { ascending: false })
    if (error) return []
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
  } catch {
    return []
  }
}

/**
 * Income (direction='in') scoped to a set of property ids. Used by the
 * landlord portal — owner-facing rent/fees ONLY. Empty id set => [].
 */
export async function getPropertyIncome(propertyIds: string[]): Promise<PortalIncomeRow[]> {
  const ids = propertyIds.filter(Boolean)
  if (ids.length === 0) return []
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("money_transactions")
      .select(SELECT)
      .eq("direction", "in")
      .in("property_id", ids)
      .order("occurred_on", { ascending: false })
    if (error) return []
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
  } catch {
    return []
  }
}

/**
 * Income for a tenant — by tenancy id where set, falling back to the tenant's
 * property ids for rows where tenancy_id is null (the live seeder records rent
 * against property_id with a null tenancy_id). De-duplicated by row id and
 * STRICTLY scoped to the tenant's own tenancy/property id sets.
 */
export async function getTenantIncome(
  tenancyIds: string[],
  propertyIds: string[]
): Promise<PortalIncomeRow[]> {
  const tIds = tenancyIds.filter(Boolean)
  const pIds = propertyIds.filter(Boolean)
  if (tIds.length === 0 && pIds.length === 0) return []

  const byId = new Map<string, PortalIncomeRow>()
  const [byTenancy, byProperty] = await Promise.all([
    tIds.length ? getTenancyIncome(tIds) : Promise.resolve([] as PortalIncomeRow[]),
    pIds.length ? getPropertyIncome(pIds) : Promise.resolve([] as PortalIncomeRow[]),
  ])
  for (const r of byTenancy) byId.set(r.id, r)
  // Only fold in property-scoped rows that are NOT tied to a different tenancy,
  // so a tenant never sees a housemate's separately-keyed rent.
  for (const r of byProperty) {
    if (!byId.has(r.id) && (r.tenancy_id == null || tIds.includes(r.tenancy_id))) {
      byId.set(r.id, r)
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export { code as _incomeErrCode }
