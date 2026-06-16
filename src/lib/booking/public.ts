// ============================================================================
// Public booking READ layer — browse-safe projections over PUBLISHED
// `booking_listings` (+ photos, amenities, property city/country, active
// pricing profile). This is the data the unauthenticated /stay surfaces render.
//
// SECURITY: every read here is anon-keyed; RLS (booking_listings_published_read
// and friends) is the boundary — only `status='published'` rows are returned,
// and only safe fields are projected (NEVER the full street address; city +
// country only). All calls are 42P01/42703-tolerant → empty result, never throw.
//
// Pricing for a specific date range is NOT computed here — that goes through the
// deep `quoteStay` engine (pricing-engine.ts) via the quote API. This module
// surfaces the "from" nightly price (the active profile base) for cards/headers.
// Money is integer pence.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  parseTypeDetails,
  getCategoryMeta,
  sectionsForCategory,
  type AccommodationCategory,
  type LetType,
  type TypeDetails,
  type CategorySections,
} from "./accommodation"

function isTolerable(err: unknown): boolean {
  const c = (err as { code?: string } | null)?.code
  return c === "42P01" || c === "42703" || c === "PGRST205" || c === "PGRST204"
}

export interface PublicListingPhoto {
  id: string
  url: string | null
  caption: string | null
  roomTag: string | null
  isCover: boolean
}

export interface PublicListingAmenity {
  key: string
  group: string | null
  value: string | null
}

/** Browse-safe published listing card (search/map). */
export interface PublicListingCard {
  id: string
  slug: string | null
  title: string
  summary: string | null
  listingType: string
  bookingMode: string
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  currency: string
  /** "From" nightly price (active profile base), integer pence, or null. */
  fromNightlyPence: number | null
  cleaningFeePence: number | null
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  coverUrl: string | null
  /** Gallery photo URLs (cover first) for card carousels. May be empty. */
  photoUrls: string[]
  cancellationPolicy: string
  complianceStatus: string
  /** Review aggregate (0–5) + count, or nulls when there are no reviews. */
  rating: number | null
  reviewCount: number | null
}

/** Full published detail view (detail page). */
export interface PublicListingDetail extends PublicListingCard {
  description: string | null
  houseRules: Record<string, unknown>
  amenities: PublicListingAmenity[]
  photos: PublicListingPhoto[]
  checkInWindow: string | null
  checkoutTime: string | null
  securityDepositPence: number | null
  minNights: number
  maxNights: number | null
  hostName: string | null
  workspaceId: string
  /** Accommodation typing — drives which detail sections + which CTA show. */
  accommodationCategory: AccommodationCategory
  accommodationLabel: string
  letType: LetType
  typeDetails: TypeDetails
  sections: CategorySections
  /** True for long/shared families → Apply/Enquire instead of nightly checkout. */
  applyFlow: boolean
}

interface ListingRow {
  id: string
  workspace_id: string
  property_id: string | null
  listing_type: string
  title: string
  slug: string | null
  summary: string | null
  description: string | null
  booking_mode: string
  max_guests: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities: unknown
  house_rules: unknown
  check_in_window: string | null
  checkout_time: string | null
  cancellation_policy: string
  currency: string
  compliance_status: string
  cover_photo_id: string | null
  accommodation_category?: string | null
  let_type?: string | null
  type_details?: unknown
}

const CARD_COLS =
  "id, workspace_id, property_id, listing_type, title, slug, summary, booking_mode, " +
  "max_guests, bedrooms, beds, bathrooms, currency, cancellation_policy, compliance_status, cover_photo_id"

const DETAIL_COLS =
  CARD_COLS +
  ", description, amenities, house_rules, check_in_window, checkout_time, accommodation_category, let_type, type_details"

/** Load the active pricing profile's headline numbers for a set of listings. */
async function loadProfileHeadlines(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<Map<string, { base: number; cleaning: number; deposit: number; minNights: number; maxNights: number | null; currency: string }>> {
  const map = new Map<
    string,
    { base: number; cleaning: number; deposit: number; minNights: number; maxNights: number | null; currency: string }
  >()
  if (listingIds.length === 0) return map
  try {
    const { data, error } = await supabase
      .from("booking_pricing_profiles")
      .select(
        "listing_id, base_nightly_pence, cleaning_fee_pence, security_deposit_pence, min_nights, max_nights, currency, is_active, created_at"
      )
      .in("listing_id", listingIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    if (error || !Array.isArray(data)) return map
    for (const r of data as Record<string, unknown>[]) {
      const lid = String(r.listing_id)
      if (map.has(lid)) continue // keep most-recent active
      map.set(lid, {
        base: Number(r.base_nightly_pence) || 0,
        cleaning: Number(r.cleaning_fee_pence) || 0,
        deposit: Number(r.security_deposit_pence) || 0,
        minNights: Number(r.min_nights) || 1,
        maxNights: r.max_nights == null ? null : Number(r.max_nights),
        currency: (r.currency as string) || "GBP",
      })
    }
  } catch {
    /* tolerant */
  }
  return map
}

/** Load ALL photo urls (cover first) per listing for card carousels. */
async function loadPhotoGalleries(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (listingIds.length === 0) return map
  try {
    const { data, error } = await supabase
      .from("booking_listing_photos")
      .select("listing_id, url, is_cover, sort_order")
      .in("listing_id", listingIds)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true })
    if (error || !Array.isArray(data)) return map
    for (const r of data as Record<string, unknown>[]) {
      const lid = String(r.listing_id)
      const url = (r.url as string | null) ?? null
      if (!url) continue
      const arr = map.get(lid) ?? []
      if (!arr.includes(url)) arr.push(url)
      map.set(lid, arr)
    }
  } catch {
    /* tolerant */
  }
  return map
}

/** Load review aggregates (avg rating, count) per listing. Tolerant → empty. */
async function loadReviewAggregates(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<Map<string, { rating: number; count: number }>> {
  const map = new Map<string, { rating: number; count: number }>()
  if (listingIds.length === 0) return map
  for (const table of ["booking_reviews", "marketplace_reviews"]) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("listing_id, rating")
        .in("listing_id", listingIds)
      if (error || !Array.isArray(data)) continue
      const acc = new Map<string, { sum: number; n: number }>()
      for (const r of data as Record<string, unknown>[]) {
        const lid = String(r.listing_id)
        const rating = Number(r.rating)
        if (!Number.isFinite(rating)) continue
        const a = acc.get(lid) ?? { sum: 0, n: 0 }
        a.sum += rating
        a.n += 1
        acc.set(lid, a)
      }
      for (const [lid, a] of acc) {
        if (a.n > 0 && !map.has(lid)) map.set(lid, { rating: a.sum / a.n, count: a.n })
      }
      if (map.size > 0) break
    } catch {
      /* tolerant — table may not exist */
    }
  }
  return map
}

/** Load property city/country/lat/lng (safe location fields only). */
async function loadPropertyLocations(
  supabase: SupabaseClient,
  propertyIds: string[]
): Promise<Map<string, { city: string | null; country: string | null; lat: number | null; lng: number | null }>> {
  const map = new Map<string, { city: string | null; country: string | null; lat: number | null; lng: number | null }>()
  const ids = propertyIds.filter(Boolean)
  if (ids.length === 0) return map
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("id, city, country, latitude, longitude")
      .in("id", ids)
    if (error || !Array.isArray(data)) return map
    for (const r of data as Record<string, unknown>[]) {
      map.set(String(r.id), {
        city: (r.city as string | null) ?? null,
        country: (r.country as string | null) ?? null,
        lat: r.latitude == null ? null : Number(r.latitude),
        lng: r.longitude == null ? null : Number(r.longitude),
      })
    }
  } catch {
    /* property table may be locked down for anon — degrade to no location */
  }
  return map
}

/**
 * Approximate city centroids (UK + a few intl) used ONLY as a map fallback when
 * a listing has no precise property coordinates. The pin is an APPROXIMATE area
 * marker (never an exact address), keeping the public map honest while letting
 * city-named listings appear on it. Matched against the listing title/city.
 */
const CITY_CENTROIDS: Array<[string, number, number]> = [
  ["london", 51.5074, -0.1278],
  ["shoreditch", 51.5265, -0.0784],
  ["manchester", 53.4808, -2.2426],
  ["brighton", 50.8225, -0.1372],
  ["edinburgh", 55.9533, -3.1883],
  ["leeds", 53.8008, -1.5491],
  ["headingley", 53.8189, -1.5817],
  ["bristol", 51.4545, -2.5879],
  ["birmingham", 52.4862, -1.8904],
  ["liverpool", 53.4084, -2.9916],
  ["glasgow", 55.8642, -4.2518],
  ["cardiff", 51.4816, -3.1791],
  ["sheffield", 53.3811, -1.4701],
  ["newcastle", 54.9783, -1.6178],
  ["nottingham", 52.9548, -1.1581],
  ["oxford", 51.752, -1.2577],
  ["cambridge", 52.2053, 0.1218],
  ["bath", 51.3811, -2.3596],
  ["york", 53.959, -1.0815],
]

/** Find an approximate centroid from a haystack (title + city), or null. */
function approxCentroid(haystack: string): { lat: number; lng: number } | null {
  const hay = haystack.toLowerCase()
  for (const [name, lat, lng] of CITY_CENTROIDS) {
    if (hay.includes(name)) return { lat, lng }
  }
  return null
}

function cardFromRow(
  row: ListingRow,
  profile: { base: number; cleaning: number; deposit: number; minNights: number; maxNights: number | null; currency: string } | undefined,
  photos: string[] | undefined,
  loc: { city: string | null; country: string | null; lat: number | null; lng: number | null } | undefined,
  review?: { rating: number; count: number } | undefined
): PublicListingCard {
  const gallery = photos ?? []
  // Real coordinates win; otherwise derive an APPROXIMATE area pin from the name.
  let lat = loc?.lat ?? null
  let lng = loc?.lng ?? null
  if (lat == null || lng == null) {
    const approx = approxCentroid(`${row.title ?? ""} ${row.summary ?? ""} ${loc?.city ?? ""}`)
    if (approx) {
      lat = approx.lat
      lng = approx.lng
    }
  }
  return {
    id: row.id,
    slug: row.slug,
    title: (row.title || "Your stay").trim(),
    summary: row.summary,
    listingType: row.listing_type,
    bookingMode: row.booking_mode,
    maxGuests: Number(row.max_guests) || 1,
    bedrooms: Number(row.bedrooms) || 0,
    beds: Number(row.beds) || 0,
    bathrooms: Number(row.bathrooms) || 0,
    currency: profile?.currency || row.currency || "GBP",
    fromNightlyPence: profile && profile.base > 0 ? profile.base : null,
    cleaningFeePence: profile ? profile.cleaning : null,
    city: loc?.city ?? null,
    country: loc?.country ?? null,
    latitude: lat,
    longitude: lng,
    coverUrl: gallery[0] ?? null,
    photoUrls: gallery,
    cancellationPolicy: row.cancellation_policy || "flexible",
    complianceStatus: row.compliance_status || "pending",
    rating: review ? Math.round(review.rating * 10) / 10 : null,
    reviewCount: review ? review.count : null,
  }
}

export interface SearchListingsArgs {
  q?: string | null
  city?: string | null
  guests?: number | null
  minPence?: number | null
  maxPence?: number | null
  listingType?: string | null
  cancellation?: string | null
  /** Minimum bedrooms / bathrooms / beds. */
  bedrooms?: number | null
  bathrooms?: number | null
  beds?: number | null
  /** Only instant-bookable listings. */
  instantOnly?: boolean | null
  /** Only listings with a passed compliance check. */
  verifiedOnly?: boolean | null
  /** Map-bounds filter [south, west, north, east] (lat/lng). */
  bounds?: [number, number, number, number] | null
  limit?: number
}

/**
 * Search PUBLISHED booking listings. Text filter is applied to title/summary;
 * price/guest/type filters are applied after enriching with the active pricing
 * profile (so "from" price + min-guests are accurate). Tolerant → [].
 */
export async function searchPublicListings(
  supabase: SupabaseClient,
  args: SearchListingsArgs = {}
): Promise<PublicListingCard[]> {
  try {
    let q = supabase
      .from("booking_listings")
      .select(CARD_COLS)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(Math.min(args.limit ?? 60, 120))

    if (args.q && args.q.trim()) {
      const term = `%${args.q.trim().replace(/[%_]/g, "")}%`
      q = q.or(`title.ilike.${term},summary.ilike.${term}`)
    }
    if (args.listingType) q = q.eq("listing_type", args.listingType)
    if (args.cancellation) q = q.eq("cancellation_policy", args.cancellation)
    if (args.guests && args.guests > 0) q = q.gte("max_guests", args.guests)
    if (args.bedrooms && args.bedrooms > 0) q = q.gte("bedrooms", args.bedrooms)
    if (args.bathrooms && args.bathrooms > 0) q = q.gte("bathrooms", args.bathrooms)
    if (args.beds && args.beds > 0) q = q.gte("beds", args.beds)
    if (args.instantOnly) q = q.eq("booking_mode", "instant")
    if (args.verifiedOnly) q = q.eq("compliance_status", "passed")

    const { data, error } = await q
    if (error || !Array.isArray(data)) return []
    const rows = data as unknown as ListingRow[]
    const ids = rows.map((r) => r.id)
    const propIds = rows.map((r) => r.property_id).filter((x): x is string => !!x)

    const [profiles, galleries, locs, reviews] = await Promise.all([
      loadProfileHeadlines(supabase, ids),
      loadPhotoGalleries(supabase, ids),
      loadPropertyLocations(supabase, propIds),
      loadReviewAggregates(supabase, ids),
    ])

    let cards = rows.map((r) =>
      cardFromRow(
        r,
        profiles.get(r.id),
        galleries.get(r.id),
        r.property_id ? locs.get(r.property_id) : undefined,
        reviews.get(r.id)
      )
    )

    // Post-enrichment filters (price range, city contains).
    if (args.minPence != null) cards = cards.filter((c) => (c.fromNightlyPence ?? 0) >= args.minPence!)
    if (args.maxPence != null) cards = cards.filter((c) => (c.fromNightlyPence ?? Infinity) <= args.maxPence!)
    if (args.city && args.city.trim()) {
      const needle = args.city.trim().toLowerCase()
      cards = cards.filter((c) => (c.city ?? "").toLowerCase().includes(needle))
    }
    if (args.bounds) {
      const [s, w, n, e] = args.bounds
      cards = cards.filter(
        (c) =>
          c.latitude != null &&
          c.longitude != null &&
          c.latitude >= s &&
          c.latitude <= n &&
          c.longitude >= w &&
          c.longitude <= e
      )
    }
    return cards
  } catch (err) {
    if (isTolerable(err)) return []
    return []
  }
}

/** Resolve a published listing by slug OR id (slug preferred). Tolerant → null. */
export async function getPublicListingDetail(
  supabase: SupabaseClient,
  slugOrId: string
): Promise<PublicListingDetail | null> {
  if (!slugOrId) return null

  async function fetchRow(): Promise<ListingRow | null> {
    // by slug first
    try {
      const bySlug = await supabase
        .from("booking_listings")
        .select(DETAIL_COLS)
        .eq("slug", slugOrId)
        .eq("status", "published")
        .maybeSingle()
      if (!bySlug.error && bySlug.data) return bySlug.data as unknown as ListingRow
    } catch {
      /* tolerant */
    }
    // by id (uuid). A malformed-uuid error is swallowed.
    try {
      const byId = await supabase
        .from("booking_listings")
        .select(DETAIL_COLS)
        .eq("id", slugOrId)
        .eq("status", "published")
        .maybeSingle()
      if (!byId.error && byId.data) return byId.data as unknown as ListingRow
    } catch {
      /* tolerant */
    }
    return null
  }

  const row = await fetchRow()
  if (!row) return null

  const [profiles, galleries, locs, photos, amenities, host, reviews] = await Promise.all([
    loadProfileHeadlines(supabase, [row.id]),
    loadPhotoGalleries(supabase, [row.id]),
    row.property_id ? loadPropertyLocations(supabase, [row.property_id]) : Promise.resolve(new Map()),
    listPublicPhotos(supabase, row.id),
    listPublicAmenities(supabase, row.id),
    loadHostName(supabase, row.workspace_id),
    loadReviewAggregates(supabase, [row.id]),
  ])

  const profile = profiles.get(row.id)
  const card = cardFromRow(
    row,
    profile,
    galleries.get(row.id),
    row.property_id ? locs.get(row.property_id) : undefined,
    reviews.get(row.id)
  )

  const catMeta = getCategoryMeta(row.accommodation_category ?? "short_stay")
  const sections = sectionsForCategory(catMeta.value)
  const typeDetails = parseTypeDetails(row.type_details ?? {})

  return {
    ...card,
    description: row.description,
    houseRules: (row.house_rules as Record<string, unknown>) ?? {},
    amenities,
    photos,
    checkInWindow: row.check_in_window,
    checkoutTime: row.checkout_time,
    securityDepositPence: profile ? profile.deposit : null,
    minNights: profile?.minNights ?? 1,
    maxNights: profile?.maxNights ?? null,
    hostName: host,
    workspaceId: row.workspace_id,
    accommodationCategory: catMeta.value,
    accommodationLabel: catMeta.label,
    letType: ((row.let_type as LetType | null) ?? catMeta.defaultLetType) as LetType,
    typeDetails,
    sections,
    applyFlow: sections.applyFlow,
  }
}

export async function listPublicPhotos(
  supabase: SupabaseClient,
  listingId: string
): Promise<PublicListingPhoto[]> {
  try {
    const { data, error } = await supabase
      .from("booking_listing_photos")
      .select("id, url, caption, room_tag, is_cover, sort_order")
      .eq("listing_id", listingId)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true })
    if (error || !Array.isArray(data)) return []
    return (data as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      url: (r.url as string | null) ?? null,
      caption: (r.caption as string | null) ?? null,
      roomTag: (r.room_tag as string | null) ?? null,
      isCover: Boolean(r.is_cover),
    }))
  } catch {
    return []
  }
}

export async function listPublicAmenities(
  supabase: SupabaseClient,
  listingId: string
): Promise<PublicListingAmenity[]> {
  try {
    const { data, error } = await supabase
      .from("booking_listing_amenities")
      .select("amenity_key, amenity_group, value")
      .eq("listing_id", listingId)
      .order("amenity_group", { ascending: true })
    if (error || !Array.isArray(data)) return []
    return (data as Record<string, unknown>[]).map((r) => ({
      key: String(r.amenity_key),
      group: (r.amenity_group as string | null) ?? null,
      value: (r.value as string | null) ?? null,
    }))
  } catch {
    return []
  }
}

/** Host display name = workspace name. Tolerant → null. */
async function loadHostName(supabase: SupabaseClient, workspaceId: string): Promise<string | null> {
  try {
    const { data } = await supabase.from("workspaces").select("name").eq("id", workspaceId).maybeSingle()
    return (data as { name?: string } | null)?.name ?? null
  } catch {
    return null
  }
}
