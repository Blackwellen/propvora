import "server-only"
import { createClient } from "@/lib/supabase/server"
import { getBookingAccess } from "./server"
import {
  listBookingListings,
  getBookingListing,
  listListingPhotos,
  evaluatePublishReadiness,
  type BookingListing,
  type ListingPhoto,
  type PublishReadiness,
} from "@/lib/booking/booking-listings"
import { getActivePricingProfile, type SavedPricingProfile } from "@/lib/booking/pricing-profiles"
import { getAvailability, type AvailabilityDay } from "@/lib/booking/availability"

/* ──────────────────────────────────────────────────────────────────────────
   Deep operator booking loaders — booking_listings, listing detail (+ photos,
   pricing, publish readiness) and the calendar availability grid. All reads are
   tolerant (cold DB → empty) and workspace-scoped via RLS.
─────────────────────────────────────────────────────────────────────────── */

export interface ListingSummary extends BookingListing {
  basePricePence: number | null
  photoCount: number
}

export interface ListingsManagerData {
  ready: boolean
  listings: ListingSummary[]
}

/** Load the workspace's booking listings with base price + photo counts. */
export async function loadBookingListingsData(
  workspaceId: string | null
): Promise<ListingsManagerData> {
  if (!workspaceId) return { ready: false, listings: [] }
  const supabase = await createClient()
  const listings = await listBookingListings(supabase, workspaceId)
  if (listings.length === 0) return { ready: true, listings: [] }

  const ids = listings.map((l) => l.id)
  const priceById = new Map<string, number>()
  const photoCountById = new Map<string, number>()
  try {
    const { data } = await supabase
      .from("booking_pricing_profiles")
      .select("listing_id, base_nightly_pence")
      .in("listing_id", ids)
      .eq("is_active", true)
    for (const p of data ?? []) {
      const row = p as { listing_id: string; base_nightly_pence: number }
      priceById.set(row.listing_id, Number(row.base_nightly_pence) || 0)
    }
  } catch {
    /* tolerant */
  }
  try {
    const { data } = await supabase
      .from("booking_listing_photos")
      .select("listing_id")
      .in("listing_id", ids)
    for (const p of data ?? []) {
      const lid = String((p as { listing_id: string }).listing_id)
      photoCountById.set(lid, (photoCountById.get(lid) ?? 0) + 1)
    }
  } catch {
    /* tolerant */
  }

  return {
    ready: true,
    listings: listings.map((l) => ({
      ...l,
      basePricePence: priceById.has(l.id) ? priceById.get(l.id)! : null,
      photoCount: photoCountById.get(l.id) ?? 0,
    })),
  }
}

export interface ListingDetailData {
  listing: BookingListing | null
  photos: ListingPhoto[]
  pricing: SavedPricingProfile | null
  readiness: PublishReadiness | null
}

/** Load a single listing's detail bundle for the wizard / editor. */
export async function loadListingDetail(
  workspaceId: string | null,
  listingId: string
): Promise<ListingDetailData> {
  if (!workspaceId) return { listing: null, photos: [], pricing: null, readiness: null }
  const supabase = await createClient()
  const listing = await getBookingListing(supabase, listingId)
  if (!listing) return { listing: null, photos: [], pricing: null, readiness: null }
  const [photos, pricing, readiness] = await Promise.all([
    listListingPhotos(supabase, listingId),
    getActivePricingProfile(supabase, listingId),
    evaluatePublishReadiness(supabase, listingId),
  ])
  return { listing, photos, pricing, readiness }
}

export interface CalendarData {
  ready: boolean
  listingId: string | null
  from: string
  to: string
  days: AvailabilityDay[]
  basePricePence: number | null
  currency: string
}

/** Load the availability grid for a listing across [from, to). */
export async function loadCalendarData(
  workspaceId: string | null,
  listingId: string | null,
  from: string,
  to: string
): Promise<CalendarData> {
  const empty: CalendarData = {
    ready: false,
    listingId,
    from,
    to,
    days: [],
    basePricePence: null,
    currency: "GBP",
  }
  if (!workspaceId || !listingId) return empty
  const supabase = await createClient()
  const [grid, pricing, listing] = await Promise.all([
    getAvailability(supabase, listingId, from, to),
    getActivePricingProfile(supabase, listingId),
    getBookingListing(supabase, listingId),
  ])
  return {
    ready: grid.ready || grid.days.length > 0,
    listingId,
    from,
    to,
    days: grid.days,
    basePricePence: pricing?.baseNightlyPence ?? null,
    currency: listing?.currency ?? pricing?.currency ?? "GBP",
  }
}

/** Properties the workspace can attach to a listing (for the wizard step). */
export async function loadAttachableProperties(
  workspaceId: string | null
): Promise<{ id: string; label: string; city: string | null }[]> {
  if (!workspaceId) return []
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("id, nickname, city")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("nickname", { ascending: true })
      .limit(200)
    if (error || !Array.isArray(data)) return []
    return data.map((r) => {
      const row = r as { id: string; nickname: string; city: string | null }
      return { id: row.id, label: row.nickname, city: row.city }
    })
  } catch {
    return []
  }
}

export { getBookingAccess }
