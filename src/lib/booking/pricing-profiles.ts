// ============================================================================
// Booking pricing profiles — operator CRUD over `booking_pricing_profiles`
// (and the listing.pricing_profile_id link). Separate from `pricing-engine.ts`
// (which READS profiles to quote): this module is the WRITE side used by the
// listing wizard's pricing step and the pricing manager.
//
// 42P01/error tolerant. Money is integer pence.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export interface PricingProfileInput {
  workspaceId: string
  listingId: string
  name?: string
  currency?: string
  baseNightlyPence: number
  weekendPence?: number | null
  weeklyDiscountPct?: number
  monthlyDiscountPct?: number
  minNights?: number
  maxNights?: number | null
  cleaningFeePence?: number
  extraGuestFeePence?: number
  extraGuestAfter?: number
  securityDepositPence?: number
}

export interface SavedPricingProfile {
  id: string
  listingId: string | null
  name: string
  currency: string
  baseNightlyPence: number
  weekendPence: number | null
  weeklyDiscountPct: number
  monthlyDiscountPct: number
  minNights: number
  maxNights: number | null
  cleaningFeePence: number
  extraGuestFeePence: number
  extraGuestAfter: number
  securityDepositPence: number
  isActive: boolean
}

const COLS =
  "id, listing_id, name, currency, base_nightly_pence, weekend_pence, weekly_discount_pct, " +
  "monthly_discount_pct, min_nights, max_nights, cleaning_fee_pence, extra_guest_fee_pence, " +
  "extra_guest_after, security_deposit_pence, is_active"

function mapRow(r: Record<string, unknown>): SavedPricingProfile {
  return {
    id: String(r.id),
    listingId: (r.listing_id as string) ?? null,
    name: (r.name as string) ?? "Standard pricing",
    currency: (r.currency as string) ?? "GBP",
    baseNightlyPence: Number(r.base_nightly_pence) || 0,
    weekendPence: r.weekend_pence == null ? null : Number(r.weekend_pence),
    weeklyDiscountPct: Number(r.weekly_discount_pct) || 0,
    monthlyDiscountPct: Number(r.monthly_discount_pct) || 0,
    minNights: Number(r.min_nights) || 1,
    maxNights: r.max_nights == null ? null : Number(r.max_nights),
    cleaningFeePence: Number(r.cleaning_fee_pence) || 0,
    extraGuestFeePence: Number(r.extra_guest_fee_pence) || 0,
    extraGuestAfter: Number(r.extra_guest_after) || 2,
    securityDepositPence: Number(r.security_deposit_pence) || 0,
    isActive: Boolean(r.is_active),
  }
}

/** Create or update the active pricing profile for a listing. Idempotent per
 * listing: if an active profile exists it is updated, else inserted; then the
 * listing's `pricing_profile_id` is pointed at it. */
export async function upsertPricingProfile(
  supabase: SupabaseClient,
  input: PricingProfileInput
): Promise<SavedPricingProfile | null> {
  const payload: Record<string, unknown> = {
    workspace_id: input.workspaceId,
    listing_id: input.listingId,
    name: input.name ?? "Standard pricing",
    currency: input.currency ?? "GBP",
    base_nightly_pence: Math.max(0, Math.trunc(input.baseNightlyPence)),
    weekend_pence: input.weekendPence == null ? null : Math.max(0, Math.trunc(input.weekendPence)),
    weekly_discount_pct: input.weeklyDiscountPct ?? 0,
    monthly_discount_pct: input.monthlyDiscountPct ?? 0,
    min_nights: Math.max(1, Math.trunc(input.minNights ?? 1)),
    max_nights: input.maxNights == null ? null : Math.trunc(input.maxNights),
    cleaning_fee_pence: Math.max(0, Math.trunc(input.cleaningFeePence ?? 0)),
    extra_guest_fee_pence: Math.max(0, Math.trunc(input.extraGuestFeePence ?? 0)),
    extra_guest_after: Math.max(1, Math.trunc(input.extraGuestAfter ?? 2)),
    security_deposit_pence: Math.max(0, Math.trunc(input.securityDepositPence ?? 0)),
    is_active: true,
  }
  try {
    // find existing active profile
    const { data: existing } = await supabase
      .from("booking_pricing_profiles")
      .select("id")
      .eq("listing_id", input.listingId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    let saved: SavedPricingProfile | null = null
    if (existing?.id) {
      const { data, error } = await supabase
        .from("booking_pricing_profiles")
        .update(payload)
        .eq("id", existing.id)
        .select(COLS)
        .maybeSingle()
      if (error || !data) return null
      saved = mapRow(data as unknown as Record<string, unknown>)
    } else {
      const { data, error } = await supabase
        .from("booking_pricing_profiles")
        .insert(payload)
        .select(COLS)
        .maybeSingle()
      if (error || !data) return null
      saved = mapRow(data as unknown as Record<string, unknown>)
    }

    // link listing → profile (best-effort)
    if (saved) {
      try {
        await supabase
          .from("booking_listings")
          .update({ pricing_profile_id: saved.id })
          .eq("id", input.listingId)
      } catch {
        /* tolerant */
      }
    }
    return saved
  } catch {
    return null
  }
}

/** Read the active pricing profile for a listing (write-side mirror). */
export async function getActivePricingProfile(
  supabase: SupabaseClient,
  listingId: string
): Promise<SavedPricingProfile | null> {
  try {
    const { data, error } = await supabase
      .from("booking_pricing_profiles")
      .select(COLS)
      .eq("listing_id", listingId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as Record<string, unknown>)
  } catch {
    return null
  }
}
