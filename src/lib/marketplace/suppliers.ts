// ============================================================================
// Marketplace SUPPLIER PROCUREMENT data layer (operator BUYER side).
//
// The operator is the BUYER. This module reads the cross-workspace SUPPLIER
// directory the operator procures from: each supplier is a `marketplace_listings`
// row of a supplier/emergency transaction_type, ENRICHED with the real supplier
// substrate keyed by that listing's `workspace_id`:
//   - supplier_workspace_profiles        (rating-adjacent trust: trades, years,
//                                          insurance, response time, coverage)
//   - supplier_workspace_services        (services & price bands)
//   - supplier_workspace_coverage_areas  (coverage zones)
//   - marketplace_trust_scores           (review-derived rating + count)
//   - marketplace_reviews                (testimonials)
//   - supplier_insurance_policies        (compliance / credentials, masked)
//
// EVERYTHING is browse-safe and 42P01/42703-tolerant: a cold/migrating DB
// degrades to an empty/partial result, never a throw. RLS is the real boundary:
//   - published listings + their child rows are readable cross-workspace;
//   - supplier_workspace_* rows are readable by members AND (via the published
//     listing) by anon/authenticated through the published-listing path.
// We additionally never expose private/financial operator columns.
//
// This is READ-ONLY discovery. Procurement WRITES (enquiries / orders) go through
// the existing kernel (`/api/marketplace/enquiries`, transactions.ts).
//
// All money is integer pence.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

const NOT_PROVISIONED = new Set(["42P01", "42703", "PGRST202", "PGRST204", "PGRST205"])

/** True when an error is a missing table/column/RPC (unmigrated) → tolerate. */
function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned/i.test(e.message ?? "")
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function str(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === "" ? null : s
}
function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
}

// ── Public shapes ───────────────────────────────────────────────────────────

/** A single service offered by a supplier (price band source). */
export interface SupplierServiceCard {
  id: string
  name: string
  category: string | null
  description: string | null
  pricingModel: string | null
  ratePence: number | null
  calloutFeePence: number | null
}

/** A coverage zone the supplier serves. */
export interface SupplierCoverageZone {
  id: string
  areaType: string
  value: string | null
  radiusKm: number | null
}

/** An insurance/credential record (compliance proof — masked numbers only). */
export interface SupplierCredential {
  id: string
  kind: string
  provider: string | null
  coverAmountPence: number | null
  expiresOn: string | null
  verified: boolean
}

/** A published review/testimonial about the supplier. */
export interface SupplierReviewCard {
  id: string
  rating: number
  title: string | null
  body: string | null
  createdAt: string | null
}

/** A price band derived from the supplier's real services. */
export interface PriceBand {
  minPence: number | null
  maxPence: number | null
  /** Coarse band label for fast scanning: budget / mid / premium / quote. */
  band: "quote" | "budget" | "mid" | "premium"
}

/**
 * A premium supplier CARD — everything the browse/compare surface renders, all
 * sourced from real tables. Cards are workspace-keyed by the listing's owner.
 */
export interface SupplierCard {
  /** The marketplace_listings.id (detail route key). */
  id: string
  /** The supplier's owning workspace_id (join key to the supplier substrate). */
  workspaceId: string
  title: string
  description: string | null
  transactionType: string | null
  category: string | null
  countryCode: string | null
  region: string | null
  city: string | null
  location: string | null
  currency: string
  basePricePence: number | null
  pricingModel: string | null
  thumbnailUrl: string | null
  verificationStatus: string | null
  /** Real review-derived signals (marketplace_trust_scores / listing columns). */
  rating: number | null
  reviewCount: number | null
  /** Supplier-profile enrichment (null when the supplier hasn't filled it in). */
  displayName: string | null
  trades: string[]
  yearsExperience: number | null
  insuranceVerified: boolean
  responseTimeHours: number | null
  serviceRadiusKm: number | null
  acceptsEmergency: boolean
  baseLocation: string | null
  /** Count of distinct services + coverage zones (for card density). */
  serviceCount: number
  /** Coarse price band from the supplier's real services. */
  priceBand: PriceBand
}

/** The full detail payload for the operator procurement detail page. */
export interface SupplierDetail extends SupplierCard {
  bio: string | null
  publicLiabilityCoverPence: number | null
  latitude: number | null
  longitude: number | null
  images: string[]
  services: SupplierServiceCard[]
  coverage: SupplierCoverageZone[]
  credentials: SupplierCredential[]
  reviews: SupplierReviewCard[]
  /** Listing capability flags (drive the CTA: quote vs checkout). */
  requestQuoteEnabled: boolean
  paymentsEnabled: boolean
  instantBook: boolean
  publishedAt: string | null
}

/** Filters for the supplier directory browse. All optional. */
export interface SupplierSearchParams {
  query?: string
  /** Service category slug (matches supplier_workspace_services.category or listing.category). */
  serviceCategory?: string
  /** Region / zone text match. */
  zone?: string
  countryCode?: string
  /** Minimum review rating (0..5). */
  minRating?: number
  verifiedOnly?: boolean
  emergencyOnly?: boolean
  minPence?: number
  maxPence?: number
  page?: number
  pageSize?: number
  /** Restrict to a specific set of listing ids (compare view). */
  ids?: string[]
}

export interface SupplierSearchResult {
  items: SupplierCard[]
  total: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60

/** Supplier/emergency listings only — the operator never procures stays here. */
const SUPPLIER_TXN_TYPES = ["supplier_job", "emergency_job", "service_package"]

const LISTING_COLS =
  "id, workspace_id, title, description, transaction_type, category, country_code, " +
  "region, location, location_city, currency, base_price_pence, pricing_model, " +
  "verification_status, instant_book, request_quote_enabled, payments_enabled, " +
  "rating, review_count, images, published_at, status, latitude, longitude"

interface ListingRow {
  id: string
  workspace_id: string
  title: string | null
  description: string | null
  transaction_type: string | null
  category: string | null
  country_code: string | null
  region: string | null
  location: string | null
  location_city: string | null
  currency: string | null
  base_price_pence: number | null
  pricing_model: string | null
  verification_status: string | null
  instant_book: boolean | null
  request_quote_enabled: boolean | null
  payments_enabled: boolean | null
  rating: number | null
  review_count: number | null
  images: unknown
  published_at: string | null
  status: string | null
  latitude: number | null
  longitude: number | null
}

/** Derive a coarse price band from a supplier's service rates (in pence). */
function deriveBand(rates: number[]): PriceBand {
  const valid = rates.filter((r) => Number.isFinite(r) && r > 0)
  if (valid.length === 0) return { minPence: null, maxPence: null, band: "quote" }
  const minPence = Math.min(...valid)
  const maxPence = Math.max(...valid)
  // Bands on the typical lower-bound hourly/fixed rate (pence).
  let band: PriceBand["band"]
  if (minPence < 5000) band = "budget"
  else if (minPence < 12000) band = "mid"
  else band = "premium"
  return { minPence, maxPence, band }
}

/** Build a SupplierCard from a listing row + its enrichment maps. */
function toCard(
  l: ListingRow,
  profile: ProfileRow | undefined,
  trust: TrustRow | undefined,
  services: ServiceRow[]
): SupplierCard {
  const rates = services
    .map((s) => num(s.rate_pence))
    .filter((n): n is number => n !== null)
  const band = deriveBand(rates)
  const rating = num(trust?.avg_rating) ?? num(l.rating)
  const reviewCount =
    trust?.review_count != null ? Number(trust.review_count) : num(l.review_count)
  return {
    id: l.id,
    workspaceId: l.workspace_id,
    title: str(l.title) ?? str(profile?.display_name) ?? "Supplier",
    description: str(l.description) ?? str(profile?.bio),
    transactionType: str(l.transaction_type),
    category: str(l.category),
    countryCode: str(l.country_code),
    region: str(l.region),
    city: str(l.location_city),
    location: str(l.location) ?? str(l.location_city) ?? str(profile?.base_location),
    currency: str(l.currency) ?? "GBP",
    basePricePence: num(l.base_price_pence) ?? band.minPence,
    pricingModel: str(l.pricing_model),
    thumbnailUrl: strArr(l.images)[0] ?? null,
    verificationStatus: str(l.verification_status),
    rating,
    reviewCount,
    displayName: str(profile?.display_name),
    trades: strArr(profile?.trades),
    yearsExperience: num(profile?.years_experience),
    insuranceVerified: profile?.insurance_verified === true,
    responseTimeHours: num(profile?.response_time_hours),
    serviceRadiusKm: num(profile?.service_radius_km),
    acceptsEmergency:
      profile?.accepts_emergency === true || l.transaction_type === "emergency_job",
    baseLocation: str(profile?.base_location),
    serviceCount: services.length,
    priceBand: band,
  }
}

interface ProfileRow {
  workspace_id: string
  display_name: string | null
  bio: string | null
  trades: unknown
  years_experience: number | null
  insurance_verified: boolean | null
  public_liability_cover_pence: number | null
  service_radius_km: number | null
  base_location: string | null
  latitude: number | null
  longitude: number | null
  response_time_hours: number | null
  accepts_emergency: boolean | null
}
interface TrustRow {
  workspace_id: string
  avg_rating: number | null
  review_count: number | null
  score: number | null
}
interface ServiceRow {
  id: string
  workspace_id: string
  name: string
  category: string | null
  description: string | null
  pricing_model: string | null
  rate_pence: number | null
  callout_fee_pence: number | null
}

/** Tolerant batch read of supplier profiles keyed by workspace_id. */
async function loadProfiles(
  supabase: SupabaseClient,
  workspaceIds: string[]
): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>()
  if (workspaceIds.length === 0) return map
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_profiles")
      .select(
        "workspace_id, display_name, bio, trades, years_experience, insurance_verified, " +
          "public_liability_cover_pence, service_radius_km, base_location, latitude, longitude, " +
          "response_time_hours, accepts_emergency"
      )
      .in("workspace_id", workspaceIds)
    if (error || !data) return map
    for (const row of data as unknown as ProfileRow[]) map.set(row.workspace_id, row)
  } catch {
    /* tolerate */
  }
  return map
}

/** Tolerant batch read of trust scores keyed by workspace_id. */
async function loadTrust(
  supabase: SupabaseClient,
  workspaceIds: string[]
): Promise<Map<string, TrustRow>> {
  const map = new Map<string, TrustRow>()
  if (workspaceIds.length === 0) return map
  try {
    const { data, error } = await supabase
      .from("marketplace_trust_scores")
      .select("workspace_id, avg_rating, review_count, score")
      .in("workspace_id", workspaceIds)
    if (error || !data) return map
    for (const row of data as unknown as TrustRow[]) map.set(row.workspace_id, row)
  } catch {
    /* tolerate */
  }
  return map
}

/** Tolerant batch read of services grouped by workspace_id (active only). */
async function loadServices(
  supabase: SupabaseClient,
  workspaceIds: string[]
): Promise<Map<string, ServiceRow[]>> {
  const map = new Map<string, ServiceRow[]>()
  if (workspaceIds.length === 0) return map
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_services")
      .select(
        "id, workspace_id, name, category, description, pricing_model, rate_pence, callout_fee_pence"
      )
      .in("workspace_id", workspaceIds)
      .eq("active", true)
    if (error || !data) return map
    for (const row of data as unknown as ServiceRow[]) {
      const list = map.get(row.workspace_id) ?? []
      list.push(row)
      map.set(row.workspace_id, list)
    }
  } catch {
    /* tolerate */
  }
  return map
}

function clampPage(p: number | undefined): number {
  const n = Math.floor(Number(p))
  return Number.isFinite(n) && n >= 1 ? n : 1
}
function clampPageSize(p: number | undefined): number {
  const n = Math.floor(Number(p))
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE
  return Math.min(n, MAX_PAGE_SIZE)
}
function sanitizeIlike(raw: string): string {
  return raw.trim().slice(0, 120).replace(/[%_]/g, "\\$&").replace(/[,()*]/g, " ").trim()
}

/**
 * Search the PUBLISHED supplier directory (operator buyer view). Reads
 * `marketplace_listings` (supplier/emergency/service transaction types only),
 * then enriches each with real supplier profile / trust / services data.
 * Tolerant → empty page on a cold DB. Post-filters by rating/verified/price band
 * (derived signals) after the DB page so the listing index stays simple.
 */
export async function searchSuppliers(
  supabase: SupabaseClient,
  params: SupplierSearchParams = {}
): Promise<SupplierSearchResult> {
  const page = clampPage(params.page)
  const pageSize = clampPageSize(params.pageSize)
  const empty: SupplierSearchResult = { items: [], total: 0, page, pageSize }

  try {
    let q = supabase
      .from("marketplace_listings")
      .select(LISTING_COLS, { count: "exact" })
      .in("status", ["published", "active"])
      .in("transaction_type", params.emergencyOnly ? ["emergency_job"] : SUPPLIER_TXN_TYPES)

    if (params.ids && params.ids.length > 0) q = q.in("id", params.ids.slice(0, MAX_PAGE_SIZE))
    if (params.query) {
      const term = sanitizeIlike(params.query)
      if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    }
    if (params.serviceCategory) q = q.eq("category", params.serviceCategory)
    if (params.countryCode) q = q.eq("country_code", params.countryCode)
    if (params.zone) {
      const z = sanitizeIlike(params.zone)
      if (z) q = q.or(`region.ilike.%${z}%,location.ilike.%${z}%,location_city.ilike.%${z}%`)
    }
    if (params.verifiedOnly) q = q.in("verification_status", ["verified", "approved"])
    if (typeof params.minPence === "number" && Number.isFinite(params.minPence))
      q = q.gte("base_price_pence", Math.max(0, Math.floor(params.minPence)))
    if (typeof params.maxPence === "number" && Number.isFinite(params.maxPence))
      q = q.lte("base_price_pence", Math.floor(params.maxPence))

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    q = q
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, to)

    const { data, error, count } = await q
    if (error) {
      if (isMissing(error)) return empty
      return empty
    }
    const rows = (data ?? []) as unknown as ListingRow[]
    if (rows.length === 0) return { ...empty, total: count ?? 0 }

    const workspaceIds = Array.from(new Set(rows.map((r) => r.workspace_id).filter(Boolean)))
    const [profiles, trust, services] = await Promise.all([
      loadProfiles(supabase, workspaceIds),
      loadTrust(supabase, workspaceIds),
      loadServices(supabase, workspaceIds),
    ])

    let items = rows.map((l) =>
      toCard(l, profiles.get(l.workspace_id), trust.get(l.workspace_id), services.get(l.workspace_id) ?? [])
    )

    // Derived post-filters (rating depends on the trust join, not a listing col).
    if (typeof params.minRating === "number" && params.minRating > 0) {
      items = items.filter((c) => (c.rating ?? 0) >= params.minRating!)
    }
    if (params.emergencyOnly) items = items.filter((c) => c.acceptsEmergency)

    return { items, total: count ?? items.length, page, pageSize }
  } catch (err) {
    if (isMissing(err)) return empty
    return empty
  }
}

interface InsuranceRow {
  id: string
  insurance_type: string | null
  provider: string | null
  coverage_amount_pence: number | null
  valid_to: string | null
  minimum_cover_met: boolean | null
  status: string | null
}
interface ReviewRow {
  id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string | null
}

/** Tolerant read of a supplier workspace's credentials (insurance policies). */
async function loadCredentials(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierCredential[]> {
  try {
    const { data, error } = await supabase
      .from("supplier_insurance_policies")
      .select("id, insurance_type, provider, coverage_amount_pence, valid_to, minimum_cover_met, status")
      .eq("supplier_workspace_id", workspaceId)
    if (error || !data) return []
    return (data as unknown as InsuranceRow[]).map((r) => ({
      id: r.id,
      kind: str(r.insurance_type) ?? "insurance",
      provider: str(r.provider),
      coverAmountPence: num(r.coverage_amount_pence),
      expiresOn: str(r.valid_to),
      verified: r.status === "accepted" || r.minimum_cover_met === true,
    }))
  } catch {
    return []
  }
}

/** Tolerant read of published reviews about a supplier workspace. */
async function loadReviews(
  supabase: SupabaseClient,
  workspaceId: string,
  limit = 12
): Promise<SupplierReviewCard[]> {
  try {
    const { data, error } = await supabase
      .from("marketplace_reviews")
      .select("id, rating, title, body, created_at")
      .eq("subject_workspace_id", workspaceId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as unknown as ReviewRow[]).map((r) => ({
      id: r.id,
      rating: Number(r.rating) || 0,
      title: str(r.title),
      body: str(r.body),
      createdAt: str(r.created_at),
    }))
  } catch {
    return []
  }
}

/** Tolerant read of a supplier workspace's coverage zones. */
async function loadCoverage(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierCoverageZone[]> {
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_coverage_areas")
      .select("id, area_type, value, radius_km")
      .eq("workspace_id", workspaceId)
    if (error || !data) return []
    return (data as unknown as { id: string; area_type: string; value: string | null; radius_km: number | null }[]).map((r) => ({
      id: r.id,
      areaType: r.area_type,
      value: str(r.value),
      radiusKm: num(r.radius_km),
    }))
  } catch {
    return []
  }
}

/**
 * Load the full procurement detail for one supplier LISTING (operator view).
 * Reads the published listing, then joins the real supplier substrate by its
 * owning workspace_id. Returns null when the listing is not public / not found.
 * Tolerant throughout.
 */
export async function getSupplierDetail(
  supabase: SupabaseClient,
  listingId: string
): Promise<SupplierDetail | null> {
  if (!listingId) return null
  try {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select(LISTING_COLS)
      .eq("id", listingId)
      .in("status", ["published", "active"])
      .maybeSingle()
    if (error || !data) return null
    const l = data as unknown as ListingRow
    const ws = l.workspace_id

    const [profileMap, trustMap, serviceMap, credentials, reviews, coverage] = await Promise.all([
      loadProfiles(supabase, [ws]),
      loadTrust(supabase, [ws]),
      loadServices(supabase, [ws]),
      loadCredentials(supabase, ws),
      loadReviews(supabase, ws),
      loadCoverage(supabase, ws),
    ])

    const profile = profileMap.get(ws)
    const serviceRows = serviceMap.get(ws) ?? []
    const card = toCard(l, profile, trustMap.get(ws), serviceRows)

    return {
      ...card,
      bio: str(profile?.bio),
      publicLiabilityCoverPence: num(profile?.public_liability_cover_pence),
      latitude: num(l.latitude) ?? num(profile?.latitude),
      longitude: num(l.longitude) ?? num(profile?.longitude),
      images: strArr(l.images),
      services: serviceRows.map((s) => ({
        id: s.id,
        name: s.name,
        category: str(s.category),
        description: str(s.description),
        pricingModel: str(s.pricing_model),
        ratePence: num(s.rate_pence),
        calloutFeePence: num(s.callout_fee_pence),
      })),
      coverage,
      credentials,
      reviews,
      requestQuoteEnabled: l.request_quote_enabled !== false,
      paymentsEnabled: l.payments_enabled !== false,
      instantBook: l.instant_book === true,
      publishedAt: str(l.published_at),
    }
  } catch {
    return null
  }
}

/** Load several supplier cards by listing id (compare view). Order preserved. */
export async function getSuppliersByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<SupplierCard[]> {
  const clean = Array.from(new Set(ids.filter(Boolean))).slice(0, 4)
  if (clean.length === 0) return []
  const res = await searchSuppliers(supabase, { ids: clean, pageSize: MAX_PAGE_SIZE })
  // Preserve the requested order.
  const byId = new Map(res.items.map((c) => [c.id, c]))
  return clean.map((id) => byId.get(id)).filter((c): c is SupplierCard => Boolean(c))
}
