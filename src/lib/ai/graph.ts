import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Context graph — traverse REAL relationships (not a separate materialised
// store) and compare multiple entities side-by-side without context bleed.
//
// Everything runs under the caller's RLS-scoped client, so traversal can only
// ever reach records the user is allowed to see. Schema-tolerant + fail-safe:
// a missing table/column yields a partial result, never an error.
// ============================================================================

type Row = Record<string, unknown>
const num = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN
  return Number.isFinite(n) ? n : 0
}

async function count(
  supabase: SupabaseClient,
  table: string,
  filters: (q: any) => any
): Promise<number> {
  try {
    const { count: c, error } = await filters(
      supabase.from(table).select("id", { count: "exact", head: true })
    )
    return error ? 0 : c ?? 0
  } catch {
    return 0
  }
}

export interface PropertyMetrics {
  id: string
  name: string | null
  address: string | null
  units: number
  vacantUnits: number
  activeTenancies: number
  monthlyRent: number
  openTasks: number
  complianceOverdue: number
  complianceDueSoon: number
}

const todayIso = () => new Date().toISOString().slice(0, 10)
const in30 = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)

/**
 * Resolve a single property's subgraph metrics (descendants: units, tenancies,
 * tasks, compliance). One bounded read for the property + parallel counts.
 */
export async function resolvePropertyMetrics(
  supabase: SupabaseClient,
  workspaceId: string,
  propertyId: string
): Promise<PropertyMetrics | null> {
  let property: Row | null = null
  try {
    const { data } = await supabase
      .from("properties")
      .select("id, nickname, address_line1, city, postcode, units(id, status), tenancies(id, status, rent_amount)")
      .eq("id", propertyId)
      .eq("workspace_id", workspaceId)
      .single()
    property = (data as Row) ?? null
  } catch {
    property = null
  }
  if (!property) return null

  const units = (property.units as Row[]) ?? []
  const tenancies = (property.tenancies as Row[]) ?? []
  const active = tenancies.filter((t) => String(t.status) === "active")

  const [openTasks, complianceOverdue, complianceDueSoon] = await Promise.all([
    count(supabase, "tasks", (q) => q.eq("workspace_id", workspaceId).eq("property_id", propertyId).neq("status", "done")),
    count(supabase, "compliance_items", (q) => q.eq("workspace_id", workspaceId).eq("property_id", propertyId).lt("due_date", todayIso()).neq("status", "compliant")),
    count(supabase, "compliance_items", (q) => q.eq("workspace_id", workspaceId).eq("property_id", propertyId).gte("due_date", todayIso()).lte("due_date", in30()).neq("status", "compliant")),
  ])

  const addr = [property.address_line1, property.city, property.postcode].filter(Boolean).map(String).join(", ")
  return {
    id: String(property.id),
    name: (property.nickname as string) ?? null,
    address: addr || null,
    units: units.length,
    vacantUnits: units.filter((u) => String(u.status) === "available").length,
    activeTenancies: active.length,
    monthlyRent: active.reduce((sum, t) => sum + num(t.rent_amount), 0),
    openTasks,
    complianceOverdue,
    complianceDueSoon,
  }
}

export interface CompareResult {
  dimensions: string[]
  rows: PropertyMetrics[]
}

/**
 * Compare N properties side-by-side. Each property's subgraph is resolved
 * independently (no bleed) and returned as a normalised matrix the model can
 * narrate. Capped at 8 properties to bound cost.
 */
export async function compareProperties(
  supabase: SupabaseClient,
  workspaceId: string,
  propertyIds: string[]
): Promise<CompareResult> {
  const ids = propertyIds.slice(0, 8)
  const rows = (
    await Promise.all(ids.map((id) => resolvePropertyMetrics(supabase, workspaceId, id)))
  ).filter((r): r is PropertyMetrics => r !== null)
  return {
    dimensions: ["units", "vacantUnits", "activeTenancies", "monthlyRent", "openTasks", "complianceOverdue", "complianceDueSoon"],
    rows,
  }
}

/** Render a compare matrix as a compact text table for the model to narrate. */
export function renderCompare(result: CompareResult): string {
  if (result.rows.length === 0) return "No comparable properties were found."
  const header = `Property | Units | Vacant | Active tenancies | Monthly rent | Open tasks | Compliance overdue | Due soon`
  const lines = result.rows.map(
    (r) =>
      `${r.name ?? r.id} | ${r.units} | ${r.vacantUnits} | ${r.activeTenancies} | ${r.monthlyRent} | ${r.openTasks} | ${r.complianceOverdue} | ${r.complianceDueSoon}`
  )
  return [header, ...lines].join("\n")
}
