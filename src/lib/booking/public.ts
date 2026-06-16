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
  cancellationPolicy: string
  complianceStatus: string
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
}

const CARD_COLS =
  "id, workspace_id, property_id, listing_type, title, slug, summary, booking_mode, " +
  "max_guests, bedrooms, beds, bathrooms, currency, cancellation_policy, compliance_status, cover_photo_id"

const DETAIL_COLS =
  CARD_COLS + ", description, amenities, house_rules, check_in_window, checkout_time"

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

/** Load cover photo url for a set of listings (one per listing). */
async function loadCoverPhotos(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
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
      if (url && !map.has(lid)) map.set(lid, url)
    }
  } catch {
    /* tolerant */
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

function cardFromRow(
  row: ListingRow,
  profile: { base: number; cleaning: number; deposit: number; minNights: number; maxNights: number | null; currency: string } | undefined,
  cover: string | undefined,
  loc: { city: string | null; country: string | null; lat: number | null; lng: number | null } | undefined
): PublicListingCard {
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
    latitude: loc?.lat ?? null,
    longitude: loc?.lng ?? null,
    coverUrl: cover ?? null,
    cancellationPolicy: row.cancellation_policy || "flexible",
    complianceStatus: row.compliance_status || "pending",
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

    const { data, error } = await q
    if (error || !Array.isArray(data)) return []
    const rows = data as unknown as ListingRow[]
    const ids = rows.map((r) => r.id)
    const propIds = rows.map((r) => r.property_id).filter((x): x is string => !!x)

    const [profiles, covers, locs] = await Promise.all([
      loadProfileHeadlines(supabase, ids),
      loadCoverPhotos(supabase, ids),
      loadPropertyLocations(supabase, propIds),
    ])

    let cards = rows.map((r) =>
      cardFromRow(r, profiles.get(r.id), covers.get(r.id), r.property_id ? locs.get(r.property_id) : undefined)
    )

    // Post-enrichment filters (price range, city contains).
    if (args.minPence != null) cards = cards.filter((c) => (c.fromNightlyPence ?? 0) >= args.minPence!)
    if (args.maxPence != null) cards = cards.filter((c) => (c.fromNightlyPence ?? Infinity) <= args.maxPence!)
    if (args.city && args.city.trim()) {
      const needle = args.city.trim().toLowerCase()
      cards = cards.filter((c) => (c.city ?? "").toLowerCase().includes(needle))
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

  const [profiles, covers, locs, photos, amenities, host] = await Promise.all([
    loadProfileHeadlines(supabase, [row.id]),
    loadCoverPhotos(supabase, [row.id]),
    row.property_id ? loadPropertyLocations(supabase, [row.property_id]) : Promise.resolve(new Map()),
    listPublicPhotos(supabase, row.id),
    listPublicAmenities(supabase, row.id),
    loadHostName(supabase, row.workspace_id),
  ])

  const profile = profiles.get(row.id)
  const card = cardFromRow(row, profile, covers.get(row.id), row.property_id ? locs.get(row.property_id) : undefined)

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
