import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier WORKSPACE availability data layer (P3).
//
// Backed by `supplier_workspace_availability`. Two kinds of rows live here:
//   - WEEKLY rules: weekday 0-6 + starts_at/ends_at, date_override NULL.
//   - DATE OVERRIDES: date_override set, weekday NULL (e.g. a blackout day or a
//     one-off open day).
// Workspace-scoped, 42P01/42703-tolerant. RLS enforces isolation.
// ============================================================================

export interface AvailabilityRow {
  id: string
  workspace_id: string
  weekday: number | null // 0 (Sun) .. 6 (Sat)
  starts_at: string | null // "HH:MM" / "HH:MM:SS"
  ends_at: string | null
  date_override: string | null // "YYYY-MM-DD"
  is_available: boolean
  note: string | null
  created_at: string
}

export interface WeeklySlot {
  weekday: number
  starts_at?: string | null
  ends_at?: string | null
  is_available?: boolean
  note?: string | null
}

export interface DateOverrideInput {
  date: string // "YYYY-MM-DD"
  is_available?: boolean
  starts_at?: string | null
  ends_at?: string | null
  note?: string | null
}

const AVAIL_COLS =
  "id, workspace_id, weekday, starts_at, ends_at, date_override, is_available, note, created_at"

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703"
}

/** All availability rows (weekly rules + date overrides) for a workspace. */
export async function getAvailability(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<AvailabilityRow[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_availability")
      .select(AVAIL_COLS)
      .eq("workspace_id", workspaceId)
      .order("weekday", { ascending: true, nullsFirst: false })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as AvailabilityRow[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/**
 * Replace the WEEKLY availability rules for a workspace (rows where
 * date_override IS NULL). Date overrides are left untouched. Returns the
 * persisted weekly rows.
 */
export async function setWeeklyAvailability(
  supabase: SupabaseClient,
  workspaceId: string,
  slots: WeeklySlot[]
): Promise<AvailabilityRow[]> {
  if (!workspaceId) return []
  try {
    const { error: delErr } = await supabase
      .from("supplier_workspace_availability")
      .delete()
      .eq("workspace_id", workspaceId)
      .is("date_override", null)
    if (delErr) {
      if (tolerable(delErr)) return []
      throw delErr
    }
    if (slots.length === 0) return []
    const rows = slots.map((s) => ({
      workspace_id: workspaceId,
      weekday: s.weekday,
      starts_at: s.starts_at ?? null,
      ends_at: s.ends_at ?? null,
      is_available: s.is_available ?? true,
      note: s.note ?? null,
      date_override: null,
    }))
    const { data, error } = await supabase
      .from("supplier_workspace_availability")
      .insert(rows)
      .select(AVAIL_COLS)
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    return (data as unknown as AvailabilityRow[] | null) ?? []
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/**
 * Add (or replace) a single-date override (e.g. a blackout day or a one-off
 * open day). Any existing override for the same date is removed first.
 */
export async function addDateOverride(
  supabase: SupabaseClient,
  workspaceId: string,
  override: DateOverrideInput
): Promise<AvailabilityRow | null> {
  if (!workspaceId || !override.date) return null
  try {
    const { error: delErr } = await supabase
      .from("supplier_workspace_availability")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("date_override", override.date)
    if (delErr && !tolerable(delErr)) throw delErr
    const row = {
      workspace_id: workspaceId,
      weekday: null,
      date_override: override.date,
      starts_at: override.starts_at ?? null,
      ends_at: override.ends_at ?? null,
      is_available: override.is_available ?? false,
      note: override.note ?? null,
    }
    const { data, error } = await supabase
      .from("supplier_workspace_availability")
      .insert(row)
      .select(AVAIL_COLS)
      .maybeSingle()
    if (error) {
      if (tolerable(error)) return null
      throw error
    }
    return (data as unknown as AvailabilityRow | null) ?? null
  } catch (e) {
    if (tolerable(e)) return null
    throw e
  }
}

/**
 * Resolve whether the supplier is available on a given calendar date.
 * Precedence: an explicit date override wins; otherwise the weekday rule
 * applies; if neither exists, the supplier is treated as NOT available.
 * `date` may be a Date or an ISO/`YYYY-MM-DD` string.
 */
export async function isAvailableOn(
  supabase: SupabaseClient,
  workspaceId: string,
  date: Date | string
): Promise<boolean> {
  if (!workspaceId) return false
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return false
  const iso = d.toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  const weekday = d.getUTCDay() // 0..6

  const rows = await getAvailability(supabase, workspaceId)

  const override = rows.find((r) => r.date_override === iso)
  if (override) return override.is_available

  const weekly = rows.filter((r) => r.date_override === null && r.weekday === weekday)
  if (weekly.length === 0) return false
  return weekly.some((r) => r.is_available)
}
