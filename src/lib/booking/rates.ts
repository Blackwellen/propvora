// ============================================================================
// Booking rate plans — typed CRUD over `rate_plans`. Operator-only writes (RLS
// enforces workspace membership through the owning listing). 42P01/error
// tolerant reads (return [] / null rather than throwing) so a cold DB never
// hard-fails a page.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

/** A nightly rate plan for a listing. All money is integer pence. */
export interface RatePlan {
  id: string
  listingId: string
  name: string
  nightlyRatePence: number
  minNights: number
  maxNights: number | null
  weekendUpliftPct: number | null
  active: boolean
  createdAt: string
  updatedAt: string
}

const COLS = "id, listing_id, name, nightly_rate_pence, min_nights, max_nights, weekend_uplift_pct, active, created_at, updated_at"

function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

interface RatePlanRow {
  id: string
  listing_id: string
  name: string
  nightly_rate_pence: number
  min_nights: number
  max_nights: number | null
  weekend_uplift_pct: number | null
  active: boolean
  created_at: string
  updated_at: string
}

function mapRow(r: RatePlanRow): RatePlan {
  return {
    id: r.id,
    listingId: r.listing_id,
    name: r.name,
    nightlyRatePence: Number(r.nightly_rate_pence),
    minNights: Number(r.min_nights),
    maxNights: r.max_nights === null ? null : Number(r.max_nights),
    weekendUpliftPct: r.weekend_uplift_pct === null ? null : Number(r.weekend_uplift_pct),
    active: r.active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/** List all rate plans for a listing, newest first. Tolerant → [] on error. */
export async function listRatePlans(
  supabase: SupabaseClient,
  listingId: string
): Promise<RatePlan[]> {
  try {
    const { data, error } = await supabase
      .from("rate_plans")
      .select(COLS)
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })
    if (error) return []
    return (data ?? []).map((r) => mapRow(r as unknown as RatePlanRow))
  } catch (err) {
    if (isMissingTable(err)) return []
    return []
  }
}

/**
 * Get the active rate plan for a listing (most recent active row), or null if
 * none exists. The booking price engine falls back to the listing base price
 * when this is null (matching the DB function).
 */
export async function getActiveRatePlan(
  supabase: SupabaseClient,
  listingId: string
): Promise<RatePlan | null> {
  try {
    const { data, error } = await supabase
      .from("rate_plans")
      .select(COLS)
      .eq("listing_id", listingId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as RatePlanRow)
  } catch {
    return null
  }
}

/** Fields accepted by {@link upsertRatePlan}. */
export interface UpsertRatePlanInput {
  id?: string
  listingId: string
  name?: string
  nightlyRatePence: number
  minNights?: number
  maxNights?: number | null
  weekendUpliftPct?: number | null
  active?: boolean
}

/**
 * Insert or update a rate plan (operator-only via RLS). Returns the saved plan
 * or null on error. When `id` is supplied an UPDATE is performed; otherwise a
 * new row is inserted.
 */
export async function upsertRatePlan(
  supabase: SupabaseClient,
  input: UpsertRatePlanInput
): Promise<RatePlan | null> {
  const payload: Record<string, unknown> = {
    listing_id: input.listingId,
    name: input.name ?? "Standard",
    nightly_rate_pence: Math.max(0, Math.trunc(input.nightlyRatePence)),
    min_nights: Math.max(1, Math.trunc(input.minNights ?? 1)),
    max_nights: input.maxNights == null ? null : Math.trunc(input.maxNights),
    weekend_uplift_pct: input.weekendUpliftPct == null ? null : input.weekendUpliftPct,
    active: input.active ?? true,
  }
  try {
    if (input.id) {
      const { data, error } = await supabase
        .from("rate_plans")
        .update(payload)
        .eq("id", input.id)
        .select(COLS)
        .maybeSingle()
      if (error || !data) return null
      return mapRow(data as unknown as RatePlanRow)
    }
    const { data, error } = await supabase
      .from("rate_plans")
      .insert(payload)
      .select(COLS)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as RatePlanRow)
  } catch {
    return null
  }
}
