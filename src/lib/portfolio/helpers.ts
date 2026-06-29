/* ------------------------------------------------------------------ */
/* Portfolio shared helpers                                            */
/* Live-data normalisation, aggregation and CSV export.               */
/* ------------------------------------------------------------------ */

/**
 * The DB stores `operation_profile` as enum strings (e.g. `hmo`,
 * `rent_to_rent`, `serviced_accommodation`). The UI segments/filters key
 * off human labels (e.g. "HMO", "Rent-to-Rent"). This maps the enum value
 * to the label so live rows match the same buckets as the mock data.
 */
const OPERATION_PROFILE_LABELS: Record<string, string> = {
  long_term_let: "Long-Term Let",
  rent_to_rent: "Rent-to-Rent",
  hmo: "HMO",
  student_let: "Student Let",
  serviced_accommodation: "Serviced Accommodation",
  sa_lite: "Serviced Accommodation",
  holiday_let: "Holiday Let",
  build_to_rent: "Build-to-Rent",
  social_housing: "Social Housing",
  supported_living: "Supported Living",
  commercial: "Commercial",
  mixed_use: "Mixed Use",
  refinancing: "Refinancing",
  dev_flip: "Development",
  development: "Development",
  buy_to_sell: "Buy-to-Sell",
  co_living: "Co-Living",
  standard_rental: "Long-Term Let",
}

export function normaliseOperationProfile(value: string | null | undefined): string {
  if (!value) return ""
  // Already a label (mock data) — pass through.
  if (Object.values(OPERATION_PROFILE_LABELS).includes(value)) return value
  return OPERATION_PROFILE_LABELS[value] ?? value
}

/** Map a DB property_type enum to the card's compact type union. */
export function normalisePropertyType(value: string | null | undefined): string {
  switch (value) {
    case "hmo": return "HMO"
    case "commercial": return "Commercial"
    case "mixed_use": return "Mixed"
    case "flat":
    case "house":
    case "land":
    case "other":
    default: return "BTL"
  }
}

export function normalisePropertyStatus(value: string | null | undefined): string {
  switch (value) {
    case "active": return "Active"
    case "vacant": return "Vacant"
    case "under_works": return "Under Works"
    case "archived":
    case "disposed": return "Archived"
    default: return "Active"
  }
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

export interface UnitLike {
  property_id: string
  status?: string | null
  target_rent?: number | null
}

export interface TenancyLike {
  property_id: string
  status?: string | null
  rent_amount?: number | null
}

export interface PropertyAggregate {
  units: number
  occupied: number
  vacant: number
  tenants: number
  unitRent: number
}

/**
 * Build a per-property aggregate from the loaded units + tenancies arrays so
 * cards/segments show real occupancy and unit counts instead of hardcoded 1/0.
 */
export function aggregateByProperty(
  units: UnitLike[],
  tenancies: TenancyLike[],
): Map<string, PropertyAggregate> {
  const map = new Map<string, PropertyAggregate>()
  const ensure = (id: string) => {
    let a = map.get(id)
    if (!a) { a = { units: 0, occupied: 0, vacant: 0, tenants: 0, unitRent: 0 }; map.set(id, a) }
    return a
  }
  for (const u of units) {
    if (!u.property_id) continue
    const a = ensure(u.property_id)
    a.units += 1
    if (u.status === "occupied") a.occupied += 1
    if (u.status === "available") a.vacant += 1
    a.unitRent += u.target_rent ?? 0
  }
  for (const t of tenancies) {
    if (!t.property_id) continue
    if (t.status === "active") {
      const a = ensure(t.property_id)
      a.tenants += 1
    }
  }
  return map
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function daysUntil(d: string): number {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

/* ------------------------------------------------------------------ */
/* CSV export (client-side, no deps)                                  */
/* ------------------------------------------------------------------ */

export function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (typeof window === "undefined") return
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
