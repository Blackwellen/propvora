// ============================================================================
// Marketplace search service — the read-side substrate for the public/browse
// marketplace. `searchListings` runs REAL Postgres full-text search via the
// `marketplace_search` RPC (websearch_to_tsquery over a generated tsvector with
// ts_rank + recency + trust blended ranking), with structured filters and
// pagination. It exposes ONLY browse-safe public columns plus a single thumbnail.
//
// SECURITY: the RPC is SECURITY INVOKER, so the caller's RLS applies — only
// published/active listings are returned. This file issues no writes (search
// events are recorded separately via `recordSearchEvent`).
//
// TOLERANCE: a cold/migrating DB (missing RPC/table/column) degrades to an empty
// page so the UI renders an empty state, never a 500. A legacy fallback path
// (ILIKE) is kept for the window before the FTS migration is applied.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { isMissingObject } from "./types"

// ── Public, browse-safe shapes (consumed by the UI agent) ───────────────────

/** A listing as exposed to the cross-workspace marketplace browser. ONLY safe
 *  public columns appear here — no internal/financial/private fields. */
export interface PublicListing {
  id: string
  workspaceId: string
  title: string
  description: string | null
  listingType: string | null
  transactionType: string | null
  category: string | null
  countryCode: string | null
  currency: string | null
  basePricePence: number | null
  pricingModel: string | null
  location: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  verificationStatus: string | null
  instantBook: boolean
  rating: number | null
  reviewCount: number | null
  publishedAt: string | null
  createdAt: string | null
  /** Relevance/ranking score (FTS + recency + trust). */
  rank: number | null
  /** First media row's URL (lowest sort_order), or null when none. */
  thumbnailUrl: string | null
}

/** Search input. All fields optional; pagination is clamped to sane bounds. */
export interface SearchListingsParams {
  query?: string
  category?: string
  listingType?: string
  /** @deprecated use listingType — kept for callers passing transactionType. */
  transactionType?: string
  countryCode?: string
  minPence?: number
  maxPence?: number
  location?: string
  page?: number
  pageSize?: number
}

/** Paginated search result. `total` is the full count across all pages. */
export interface SearchListingsResult {
  items: PublicListing[]
  total: number
  page: number
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 100

function clampPage(page: number | undefined): number {
  const n = Math.floor(Number(page))
  return Number.isFinite(n) && n >= 1 ? n : 1
}
function clampPageSize(pageSize: number | undefined): number {
  const n = Math.floor(Number(pageSize))
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE
  return Math.min(n, MAX_PAGE_SIZE)
}
function emptyResult(page: number, pageSize: number): SearchListingsResult {
  return { items: [], total: 0, page, pageSize }
}
function numOrNull(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v)
}

/** A row shape returned by the `marketplace_search` RPC. */
interface RpcRow {
  id: string
  workspace_id: string
  title: string | null
  description: string | null
  listing_type: string | null
  transaction_type: string | null
  category: string | null
  country_code: string | null
  currency: string | null
  base_price_pence: number | null
  pricing_model: string | null
  location: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  verification_status: string | null
  instant_book: boolean | null
  rating: number | null
  review_count: number | null
  published_at: string | null
  created_at: string | null
  thumbnail_url: string | null
  rank: number | null
  total_count: number | null
}

function rpcRowToPublic(r: RpcRow): PublicListing {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    title: r.title ?? "",
    description: r.description ?? null,
    listingType: r.listing_type ?? null,
    transactionType: r.transaction_type ?? null,
    category: r.category ?? null,
    countryCode: r.country_code ?? null,
    currency: r.currency ?? null,
    basePricePence: numOrNull(r.base_price_pence),
    pricingModel: r.pricing_model ?? null,
    location: r.location ?? null,
    region: r.region ?? null,
    city: r.city ?? null,
    latitude: numOrNull(r.latitude),
    longitude: numOrNull(r.longitude),
    verificationStatus: r.verification_status ?? null,
    instantBook: Boolean(r.instant_book),
    rating: numOrNull(r.rating),
    reviewCount: r.review_count === null || r.review_count === undefined ? null : Number(r.review_count),
    publishedAt: r.published_at ?? null,
    createdAt: r.created_at ?? null,
    rank: numOrNull(r.rank),
    thumbnailUrl: r.thumbnail_url ?? null,
  }
}

/**
 * Search PUBLISHED marketplace listings across all workspaces using the
 * `marketplace_search` FTS RPC. Returns browse-safe public columns + a single
 * thumbnail + ranking. Tolerant: a missing RPC/table/column → empty page.
 */
export async function searchListings(
  supabase: SupabaseClient,
  params: SearchListingsParams = {}
): Promise<SearchListingsResult> {
  const page = clampPage(params.page)
  const pageSize = clampPageSize(params.pageSize)
  const offset = (page - 1) * pageSize

  const query = params.query?.trim() ? params.query.trim().slice(0, 200) : null
  const listingType = params.listingType?.trim() || null
  // Legacy callers may still pass transactionType; it has no RPC filter of its
  // own (listing_type supersedes it) but we keep it harmless.
  const category = params.category?.trim() || null
  const countryCode = params.countryCode?.trim() || null
  const location = params.location?.trim() ? params.location.trim().slice(0, 120) : null
  const minPence =
    typeof params.minPence === "number" && Number.isFinite(params.minPence)
      ? Math.max(0, Math.floor(params.minPence))
      : null
  const maxPence =
    typeof params.maxPence === "number" && Number.isFinite(params.maxPence)
      ? Math.floor(params.maxPence)
      : null

  try {
    const { data, error } = await supabase.rpc("marketplace_search", {
      p_query: query,
      p_listing_type: listingType,
      p_category: category,
      p_country_code: countryCode,
      p_min_pence: minPence,
      p_max_pence: maxPence,
      p_location: location,
      p_limit: pageSize,
      p_offset: offset,
    })

    if (error) {
      // RPC not present yet → fall back to the tolerant ILIKE path.
      if (isMissingObject(error)) return fallbackSearch(supabase, params, page, pageSize)
      return emptyResult(page, pageSize)
    }

    const rows = (data ?? []) as RpcRow[]
    const total = rows.length > 0 ? Number(rows[0].total_count ?? rows.length) : 0
    return { items: rows.map(rpcRowToPublic), total, page, pageSize }
  } catch (err) {
    if (isMissingObject(err)) return fallbackSearch(supabase, params, page, pageSize)
    return emptyResult(page, pageSize)
  }
}

/**
 * Record a search event (analytics / ranking signal). Best-effort: any failure
 * is swallowed — a search must never fail because logging did.
 */
export async function recordSearchEvent(
  supabase: SupabaseClient,
  args: {
    workspaceId?: string | null
    userId?: string | null
    query?: string | null
    filters?: Record<string, unknown>
    resultCount?: number
  }
): Promise<void> {
  try {
    await supabase.from("marketplace_search_events").insert({
      workspace_id: args.workspaceId ?? null,
      user_id: args.userId ?? null,
      query: args.query ?? null,
      filters: args.filters ?? {},
      result_count: Math.max(0, Math.trunc(args.resultCount ?? 0)),
    })
  } catch {
    /* best-effort */
  }
}

// ── Legacy ILIKE fallback (pre-FTS-migration window only) ────────────────────

const PUBLIC_COLUMNS =
  "id, workspace_id, title, description, listing_type, transaction_type, category, country_code, currency, base_price_pence, pricing_model, location, region, location_city, latitude, longitude, verification_status, instant_book, rating, review_count, published_at, created_at"

function sanitizeIlikeTerm(raw: string): string {
  return raw.trim().slice(0, 120).replace(/[%_]/g, "\\$&").replace(/[,()*]/g, " ").trim()
}

async function fallbackSearch(
  supabase: SupabaseClient,
  params: SearchListingsParams,
  page: number,
  pageSize: number
): Promise<SearchListingsResult> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  try {
    let q = supabase
      .from("marketplace_listings")
      .select(PUBLIC_COLUMNS, { count: "exact" })
      .in("status", ["published", "active"])

    if (params.query) {
      const term = sanitizeIlikeTerm(params.query)
      if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    }
    if (params.category) q = q.eq("category", params.category)
    if (params.listingType) q = q.eq("listing_type", params.listingType)
    if (params.countryCode) q = q.eq("country_code", params.countryCode)
    if (params.location) {
      const loc = sanitizeIlikeTerm(params.location)
      if (loc) q = q.ilike("location", `%${loc}%`)
    }
    if (typeof params.minPence === "number" && Number.isFinite(params.minPence))
      q = q.gte("base_price_pence", Math.max(0, Math.floor(params.minPence)))
    if (typeof params.maxPence === "number" && Number.isFinite(params.maxPence))
      q = q.lte("base_price_pence", Math.floor(params.maxPence))

    q = q
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, to)

    const { data, error, count } = await q
    if (error) return emptyResult(page, pageSize)

    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>
    const items: PublicListing[] = rows.map((r) =>
      rpcRowToPublic({
        id: String(r.id),
        workspace_id: String(r.workspace_id),
        title: (r.title as string) ?? null,
        description: (r.description as string) ?? null,
        listing_type: (r.listing_type as string) ?? null,
        transaction_type: (r.transaction_type as string) ?? null,
        category: (r.category as string) ?? null,
        country_code: (r.country_code as string) ?? null,
        currency: (r.currency as string) ?? null,
        base_price_pence: (r.base_price_pence as number) ?? null,
        pricing_model: (r.pricing_model as string) ?? null,
        location: (r.location as string) ?? null,
        region: (r.region as string) ?? null,
        city: (r.location_city as string) ?? null,
        latitude: (r.latitude as number) ?? null,
        longitude: (r.longitude as number) ?? null,
        verification_status: (r.verification_status as string) ?? null,
        instant_book: (r.instant_book as boolean) ?? null,
        rating: (r.rating as number) ?? null,
        review_count: (r.review_count as number) ?? null,
        published_at: (r.published_at as string) ?? null,
        created_at: (r.created_at as string) ?? null,
        thumbnail_url: null,
        rank: null,
        total_count: count ?? rows.length,
      })
    )
    return { items, total: count ?? items.length, page, pageSize }
  } catch {
    return emptyResult(page, pageSize)
  }
}
