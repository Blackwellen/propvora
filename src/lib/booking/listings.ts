// ============================================================================
// src/lib/booking/listings.ts
//
// Unified operator data layer for booking_listings — workspace-scoped reads,
// writes and aggregations. This is the "listings.ts" entry point that composes
// the deeper per-domain modules (booking-listings, pricing-profiles,
// availability, accommodation, keyless) into the shapes the operator UI needs.
//
// All money is integer pence. All reads are 42P01-tolerant (never throw to the
// caller). Every write is workspace-scoped — the caller must already have an
// authenticated supabase client with RLS in effect.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  listBookingListings,
  getBookingListing,
  createBookingListing,
  updateBookingListing,
  listListingPhotos,
  evaluatePublishReadiness,
  publishListing,
  pauseListing,
  type BookingListing,
  type ListingPhoto,
  type ListingType,
  type ListingStatus,
  type BookingMode,
  type CancellationPolicy,
  type PublishReadiness,
} from "./booking-listings"
import { getActivePricingProfile, upsertPricingProfile, type SavedPricingProfile } from "./pricing-profiles"
import { getAvailability, type AvailabilityDay } from "./availability"
import {
  getListingAccommodation,
  listAmenityCatalogue,
  getListingAmenitySlugs,
  type ListingAccommodation,
  type CatalogueAmenity,
} from "./accommodation"
import { getKeylessLock, type KeylessLock } from "./keyless"

// ── Re-exports so callers only need to import from this module ────────────────

export type {
  BookingListing,
  ListingPhoto,
  ListingType,
  ListingStatus,
  BookingMode,
  CancellationPolicy,
  PublishReadiness,
  SavedPricingProfile,
  AvailabilityDay,
  ListingAccommodation,
  CatalogueAmenity,
  KeylessLock,
}

// ── Aggregated list shape ─────────────────────────────────────────────────────

export interface ListingCard extends BookingListing {
  /** Active nightly rate in pence, or null if no pricing profile. */
  baseNightlyPence: number | null
  /** How many photos are attached. */
  photoCount: number
  /** Bookings in the next 30 days (indicative occupancy signal). */
  upcomingBookings: number
}

/**
 * Load all booking listings for a workspace with summary stats.
 * Tolerant: a cold DB or no listings → [].
 */
export async function getWorkspaceListings(
  supabase: SupabaseClient,
  workspaceId: string,
  opts?: { status?: ListingStatus | ListingStatus[]; search?: string }
): Promise<ListingCard[]> {
  const listings = await listBookingListings(supabase, workspaceId, opts?.status ? { status: opts.status } : undefined)
  if (listings.length === 0) return []

  let filtered = listings
  if (opts?.search) {
    const q = opts.search.toLowerCase()
    filtered = filtered.filter((l) => l.title.toLowerCase().includes(q))
  }
  if (filtered.length === 0) return []

  const ids = filtered.map((l) => l.id)
  const priceById = new Map<string, number>()
  const photoCountById = new Map<string, number>()
  const upcomingById = new Map<string, number>()

  // Fetch active pricing profiles in bulk
  try {
    const { data } = await supabase
      .from("booking_pricing_profiles")
      .select("listing_id, base_nightly_pence")
      .in("listing_id", ids)
      .eq("is_active", true)
    for (const r of (data ?? []) as { listing_id: string; base_nightly_pence: number }[]) {
      priceById.set(r.listing_id, Number(r.base_nightly_pence) || 0)
    }
  } catch { /* tolerant */ }

  // Photo counts
  try {
    const { data } = await supabase
      .from("booking_listing_photos")
      .select("listing_id")
      .in("listing_id", ids)
    for (const r of (data ?? []) as { listing_id: string }[]) {
      photoCountById.set(r.listing_id, (photoCountById.get(r.listing_id) ?? 0) + 1)
    }
  } catch { /* tolerant */ }

  // Upcoming confirmed bookings count (next 30 days)
  try {
    const from = new Date().toISOString().slice(0, 10)
    const to = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
    const { data } = await supabase
      .from("bookings")
      .select("booking_listing_id")
      .in("booking_listing_id", ids)
      .in("status", ["confirmed", "checked_in"])
      .gte("check_in", from)
      .lte("check_in", to)
    for (const r of (data ?? []) as { booking_listing_id: string }[]) {
      if (r.booking_listing_id) {
        upcomingById.set(r.booking_listing_id, (upcomingById.get(r.booking_listing_id) ?? 0) + 1)
      }
    }
  } catch { /* tolerant */ }

  return filtered.map((l) => ({
    ...l,
    baseNightlyPence: priceById.has(l.id) ? priceById.get(l.id)! : null,
    photoCount: photoCountById.get(l.id) ?? 0,
    upcomingBookings: upcomingById.get(l.id) ?? 0,
  }))
}

// ── Full detail bundle ────────────────────────────────────────────────────────

export interface ListingDetail {
  listing: BookingListing | null
  photos: ListingPhoto[]
  pricing: SavedPricingProfile | null
  readiness: PublishReadiness | null
  accommodation: ListingAccommodation | null
  amenityCatalogue: CatalogueAmenity[]
  selectedAmenitySlugs: string[]
  keylessLock: KeylessLock | null
}

/**
 * Load the full detail bundle for a single listing (workspace-scoped).
 * Returns null listing when not found or access denied.
 */
export async function getListingDetail(
  supabase: SupabaseClient,
  listingId: string,
  workspaceId: string
): Promise<ListingDetail> {
  const empty: ListingDetail = {
    listing: null,
    photos: [],
    pricing: null,
    readiness: null,
    accommodation: null,
    amenityCatalogue: [],
    selectedAmenitySlugs: [],
    keylessLock: null,
  }
  const listing = await getBookingListing(supabase, listingId)
  if (!listing || listing.workspaceId !== workspaceId) return empty

  const [photos, pricing, readiness, accommodation, amenityCatalogue, selectedAmenitySlugs, keylessLock] =
    await Promise.all([
      listListingPhotos(supabase, listingId),
      getActivePricingProfile(supabase, listingId),
      evaluatePublishReadiness(supabase, listingId),
      getListingAccommodation(supabase, listingId),
      listAmenityCatalogue(supabase),
      getListingAmenitySlugs(supabase, listingId),
      getKeylessLock(supabase, listingId),
    ])

  return { listing, photos, pricing, readiness, accommodation, amenityCatalogue, selectedAmenitySlugs, keylessLock }
}

// ── Field-level updater ───────────────────────────────────────────────────────

type ListingPatch = Parameters<typeof updateBookingListing>[2]

/**
 * Generic field updater — accepts any subset of listing patch fields and
 * returns the updated listing. Pass `field` + `value` for single-field edits,
 * or a full patch object for multi-field saves.
 */
export async function updateListingField(
  supabase: SupabaseClient,
  listingId: string,
  workspaceId: string,
  patch: ListingPatch
): Promise<BookingListing | null> {
  // Validate workspace scope before mutating
  const current = await getBookingListing(supabase, listingId)
  if (!current || current.workspaceId !== workspaceId) return null
  return updateBookingListing(supabase, listingId, patch)
}

// ── Create ───────────────────────────────────────────────────────────────────

export interface CreateListingInput {
  workspaceId: string
  title: string
  listingType?: ListingType
  propertyId?: string | null
  bookingMode?: BookingMode
  maxGuests?: number
  bedrooms?: number
  beds?: number
  bathrooms?: number
  countryCode?: string
  currency?: string
  cancellationPolicy?: CancellationPolicy
  createdBy?: string | null
}

/**
 * Create a new draft booking listing. Returns the created listing or null.
 */
export async function createListing(
  supabase: SupabaseClient,
  input: CreateListingInput
): Promise<BookingListing | null> {
  return createBookingListing(supabase, input)
}

// ── Photos ───────────────────────────────────────────────────────────────────

export async function getListingPhotos(
  supabase: SupabaseClient,
  listingId: string
): Promise<ListingPhoto[]> {
  return listListingPhotos(supabase, listingId)
}

export async function addListingPhoto(
  supabase: SupabaseClient,
  listingId: string,
  photo: {
    url?: string | null
    r2Key?: string | null
    caption?: string | null
    roomTag?: string | null
    sortOrder?: number
    isCover?: boolean
  }
): Promise<ListingPhoto | null> {
  try {
    const { data, error } = await supabase
      .from("booking_listing_photos")
      .insert({
        listing_id: listingId,
        url: photo.url ?? null,
        r2_key: photo.r2Key ?? null,
        caption: photo.caption ?? null,
        room_tag: photo.roomTag ?? null,
        sort_order: photo.sortOrder ?? 0,
        is_cover: photo.isCover ?? false,
      })
      .select("id, listing_id, url, r2_key, caption, room_tag, sort_order, is_cover")
      .maybeSingle()
    if (error || !data) return null
    const r = data as Record<string, unknown>
    return {
      id: String(r.id),
      listingId: String(r.listing_id),
      url: (r.url as string) ?? null,
      r2Key: (r.r2_key as string) ?? null,
      caption: (r.caption as string) ?? null,
      roomTag: (r.room_tag as string) ?? null,
      sortOrder: Number(r.sort_order) || 0,
      isCover: Boolean(r.is_cover),
    }
  } catch {
    return null
  }
}

export async function deleteListingPhoto(
  supabase: SupabaseClient,
  photoId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("booking_listing_photos").delete().eq("id", photoId)
    return !error
  } catch {
    return false
  }
}

export async function setCoverPhoto(
  supabase: SupabaseClient,
  listingId: string,
  photoId: string
): Promise<boolean> {
  try {
    // Clear existing cover
    await supabase.from("booking_listing_photos").update({ is_cover: false }).eq("listing_id", listingId)
    // Set new cover
    await supabase.from("booking_listing_photos").update({ is_cover: true }).eq("id", photoId)
    // Link in listing row
    await supabase.from("booking_listings").update({ cover_photo_id: photoId }).eq("id", listingId)
    return true
  } catch {
    return false
  }
}

// ── Pricing profile ───────────────────────────────────────────────────────────

export async function getListingPricingProfile(
  supabase: SupabaseClient,
  listingId: string
): Promise<SavedPricingProfile | null> {
  return getActivePricingProfile(supabase, listingId)
}

export async function savePricingProfile(
  supabase: SupabaseClient,
  workspaceId: string,
  listingId: string,
  pricing: Omit<Parameters<typeof upsertPricingProfile>[1], "workspaceId" | "listingId">
): Promise<SavedPricingProfile | null> {
  return upsertPricingProfile(supabase, { workspaceId, listingId, ...pricing })
}

// ── Availability ──────────────────────────────────────────────────────────────

export async function getListingAvailability(
  supabase: SupabaseClient,
  listingId: string,
  from: string,
  to: string
): Promise<{ ready: boolean; days: AvailabilityDay[] }> {
  return getAvailability(supabase, listingId, from, to)
}

// ── Publish / pause ───────────────────────────────────────────────────────────

export { publishListing, pauseListing, evaluatePublishReadiness }
