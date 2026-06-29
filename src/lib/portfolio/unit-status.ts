import type { UnitStatus } from "@/types/database"

// ============================================================================
// Single source of truth for UNIT status.
//
// Values match the live `units.status` CHECK exactly — there is ONE vocabulary
// across the database, the useUnits adapter, and the UI (no translation layer):
//   available  → "Vacant"      (empty / lettable)
//   occupied   → "Occupied"    (tenanted)
//   maintenance→ "Under works" (renovation / repair)
//   offline    → "Offline"     (held back / not in service)
//
// NOTE: do not confuse with PROPERTY status (active|vacant|under_works|archived|
// disposed) — a separate enum that legitimately still uses "vacant"/"under_works".
// ============================================================================

export const UNIT_STATUSES: UnitStatus[] = ["available", "occupied", "maintenance", "offline"]

export const UNIT_STATUS_LABEL: Record<string, string> = {
  available: "Vacant",
  occupied: "Occupied",
  maintenance: "Under works",
  offline: "Offline",
}

/** Friendly label for a unit status; tolerates unknown/empty → "Vacant". */
export function unitStatusLabel(status: string | null | undefined): string {
  return UNIT_STATUS_LABEL[status ?? ""] ?? "Vacant"
}

/** Options for status pickers/filters — the one place the 4 states are listed. */
export const UNIT_STATUS_OPTIONS: { value: UnitStatus; label: string }[] = UNIT_STATUSES.map(
  (value) => ({ value, label: UNIT_STATUS_LABEL[value] })
)

/** Pill/dot tone classes per unit status (badge styling). */
export const UNIT_STATUS_TONE: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  available:   { label: "Vacant",      dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-100 border border-slate-200" },
  occupied:    { label: "Occupied",    dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-200" },
  maintenance: { label: "Under works", dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border border-amber-200" },
  offline:     { label: "Offline",     dot: "bg-violet-500",  text: "text-violet-700",  bg: "bg-violet-50 border border-violet-200" },
}
