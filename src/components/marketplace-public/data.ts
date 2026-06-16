import "server-only"
import { createClient } from "@/lib/supabase/server"
import { searchListings, type SearchListingsParams, type PublicListing } from "@/lib/marketplace/search"

/* ──────────────────────────────────────────────────────────────────────────
   Public marketplace data layer (anon-safe, server-only).

   The authenticated API routes (`/api/marketplace/search`, `/listings/[id]`)
   require a signed-in user. The PUBLIC marketplace pages must render for
   anonymous visitors, so this module reads the SAME real kernel directly with
   the request's (possibly anon) Supabase server client. RLS does the isolation:
   `marketplace_listings_public_read` exposes ONLY published/active rows to anon,
   so nothing private leaks. Every read is tolerant — a cold/migrating DB → an
   empty result, never a throw.
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "42703", "PGRST202", "PGRST204", "PGRST205"])
function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned/i.test(e.message ?? "")
}

export type { PublicListing }

/** Public, browse-safe detail of a single PUBLISHED/active listing. */
export interface PublicListingDetail extends PublicListing {
  /** Image URLs from the listing's own `images` column (anon-readable). */
  images: string[]
  bedrooms: number | null
  bathrooms: number | null
  floorAreaSqm: number | null
  availableFrom: string | null
  serviceArea: string | null
  postcode: string | null
  instantBook: boolean
  requestQuoteEnabled: boolean
  paymentsEnabled: boolean
  features: string[]
}

/** Run the real FTS search with the anon/server client. Tolerant → empty page. */
export async function publicSearch(params: SearchListingsParams) {
  const supabase = await createClient()
  return searchListings(supabase, params)
}

function toStrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
}
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Load ONE published/active listing for the public surface. Returns null when
 * not found / not public (RLS hides non-public rows from anon). Tolerant.
 */
export async function publicGetListing(id: string): Promise<PublicListingDetail | null> {
  if (!id) return null
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select(
        "id, workspace_id, title, description, listing_type, transaction_type, category, " +
          "country_code, currency, base_price_pence, pricing_model, location, region, " +
          "location_city, postcode, service_area, latitude, longitude, verification_status, " +
          "instant_book, request_quote_enabled, payments_enabled, rating, review_count, " +
          "published_at, created_at, status, images, bedrooms, bathrooms, floor_area_sqm, " +
          "available_from, features"
      )
      .eq("id", id)
      .in("status", ["published", "active"])
      .maybeSingle()
    if (error) {
      if (isMissing(error)) return null
      return null
    }
    if (!data) return null
    const r = data as unknown as Record<string, unknown>
    const images = toStrArray(r.images)
    return {
      id: String(r.id),
      workspaceId: String(r.workspace_id),
      title: (r.title as string) ?? "",
      description: (r.description as string | null) ?? null,
      listingType: (r.listing_type as string | null) ?? null,
      transactionType: (r.transaction_type as string | null) ?? null,
      category: (r.category as string | null) ?? null,
      countryCode: (r.country_code as string | null) ?? null,
      currency: (r.currency as string | null) ?? "GBP",
      basePricePence: num(r.base_price_pence),
      pricingModel: (r.pricing_model as string | null) ?? null,
      location: (r.location as string | null) ?? (r.location_city as string | null) ?? null,
      region: (r.region as string | null) ?? null,
      city: (r.location_city as string | null) ?? null,
      latitude: num(r.latitude),
      longitude: num(r.longitude),
      verificationStatus: (r.verification_status as string | null) ?? null,
      instantBook: Boolean(r.instant_book),
      rating: num(r.rating),
      reviewCount: r.review_count == null ? null : Number(r.review_count),
      publishedAt: (r.published_at as string | null) ?? null,
      createdAt: (r.created_at as string | null) ?? null,
      rank: null,
      thumbnailUrl: images[0] ?? null,
      images,
      bedrooms: num(r.bedrooms),
      bathrooms: num(r.bathrooms),
      floorAreaSqm: num(r.floor_area_sqm),
      availableFrom: (r.available_from as string | null) ?? null,
      serviceArea: (r.service_area as string | null) ?? null,
      postcode: (r.postcode as string | null) ?? null,
      requestQuoteEnabled: r.request_quote_enabled !== false,
      paymentsEnabled: r.payments_enabled !== false,
      features: toStrArray(r.features),
    }
  } catch (err) {
    if (isMissing(err)) return null
    return null
  }
}
