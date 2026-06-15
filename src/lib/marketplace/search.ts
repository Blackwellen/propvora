// ============================================================================
// Marketplace search service — the read-side substrate for the public/browse
// marketplace. `searchListings` runs ONE tolerant, cross-workspace query over
// PUBLISHED listings only, exposing a bounded set of SAFE PUBLIC columns and a
// single thumbnail joined from `marketplace_listing_media`. It never throws on a
// cold/migrating DB: a missing table (42P01) or a not-yet-created column (42703)
// degrades to an empty page so the UI renders an empty state, never a 500.
//
// This file is read-only over the data model — it issues no writes. Management
// (create/update/delete) lives in the listings route handlers and delegates to
// `@/lib/marketplace/listings`.
//
// Schema contract (owned by a sibling agent — build to it, tolerate absence):
//   marketplace_listings(
//     id, workspace_id, title, description, transaction_type, category,
//     status('draft'|'published'|'paused'|'archived'), country_code, currency,
//     base_price_pence, pricing_model, location, latitude, longitude,
//     property_id, published_at, created_by, created_at, updated_at)
//   marketplace_listing_media(listing_id, url, kind, sort_order)
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

// ── Public, browse-safe shapes (consumed by the UI agent) ───────────────────

/** A listing as exposed to the cross-workspace marketplace browser. ONLY safe
 *  public columns appear here — no internal/financial/private fields. */
export interface PublicListing {
  id: string
  workspaceId: string
  title: string
  description: string | null
  transactionType: string | null
  category: string | null
  countryCode: string | null
  currency: string | null
  basePricePence: number | null
  pricingModel: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  publishedAt: string | null
  createdAt: string | null
  /** First media row's URL (lowest sort_order), or null when none. */
  thumbnailUrl: string | null
}

/** Search input. All fields optional; pagination is clamped to sane bounds. */
export interface SearchListingsParams {
  query?: string
  category?: string
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

/** Postgres error codes we treat as "not provisioned yet" → empty results. */
const TOLERATED_CODES = new Set([
  "42P01", // undefined_table   — table not migrated yet
  "42703", // undefined_column  — a contract column not added yet
  "PGRST205", // PostgREST: table not found in schema cache
  "PGRST204", // PostgREST: column not found in schema cache
])

/** Columns safe to expose to the cross-workspace browser. NEVER add internal,
 *  financial-internal, or contact PII columns here. */
const PUBLIC_COLUMNS =
  "id, workspace_id, title, description, transaction_type, category, country_code, currency, base_price_pence, pricing_model, location, latitude, longitude, published_at, created_at"

/** Escape a user string for safe use inside a PostgREST `ilike` pattern so that
 *  `%`, `_` and `,`/`(`/`)` (PostgREST filter syntax) can't alter the query. */
function sanitizeIlikeTerm(raw: string): string {
  return raw
    .trim()
    .slice(0, 120)
    .replace(/[%_]/g, "\\$&") // neutralise LIKE wildcards
    .replace(/[,()*]/g, " ") // neutralise PostgREST .or() separators
    .trim()
}

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

interface ListingRow {
  id: string
  workspace_id: string
  title: string | null
  description: string | null
  transaction_type: string | null
  category: string | null
  country_code: string | null
  currency: string | null
  base_price_pence: number | null
  pricing_model: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  published_at: string | null
  created_at: string | null
}

function toPublic(row: ListingRow, thumbnailUrl: string | null): PublicListing {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title ?? "",
    description: row.description ?? null,
    transactionType: row.transaction_type ?? null,
    category: row.category ?? null,
    countryCode: row.country_code ?? null,
    currency: row.currency ?? null,
    basePricePence:
      row.base_price_pence === null || row.base_price_pence === undefined
        ? null
        : Number(row.base_price_pence),
    pricingModel: row.pricing_model ?? null,
    location: row.location ?? null,
    latitude:
      row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude:
      row.longitude === null || row.longitude === undefined
        ? null
        : Number(row.longitude),
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at ?? null,
    thumbnailUrl,
  }
}

/**
 * Search PUBLISHED marketplace listings across all workspaces (the marketplace
 * is intentionally cross-workspace). Returns only browse-safe public columns
 * plus a single thumbnail per listing. Tolerant: a missing table/column → an
 * empty page rather than an error.
 */
export async function searchListings(
  supabase: SupabaseClient,
  params: SearchListingsParams = {}
): Promise<SearchListingsResult> {
  const page = clampPage(params.page)
  const pageSize = clampPageSize(params.pageSize)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    let q = supabase
      .from("marketplace_listings")
      .select(PUBLIC_COLUMNS, { count: "exact" })
      .eq("status", "published")

    // Text search over title/description (case-insensitive).
    if (params.query) {
      const term = sanitizeIlikeTerm(params.query)
      if (term) {
        q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
      }
    }

    if (params.category) q = q.eq("category", params.category)
    if (params.transactionType) q = q.eq("transaction_type", params.transactionType)
    if (params.countryCode) q = q.eq("country_code", params.countryCode)

    if (params.location) {
      const loc = sanitizeIlikeTerm(params.location)
      if (loc) q = q.ilike("location", `%${loc}%`)
    }

    if (typeof params.minPence === "number" && Number.isFinite(params.minPence)) {
      q = q.gte("base_price_pence", Math.max(0, Math.floor(params.minPence)))
    }
    if (typeof params.maxPence === "number" && Number.isFinite(params.maxPence)) {
      q = q.lte("base_price_pence", Math.floor(params.maxPence))
    }

    // Newest published first, then by creation as a stable tiebreaker.
    q = q
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, to)

    const { data, error, count } = await q

    if (error) {
      if (TOLERATED_CODES.has(error.code ?? "")) return emptyResult(page, pageSize)
      throw error
    }

    const rows = (data ?? []) as unknown as ListingRow[]
    if (rows.length === 0) {
      return { items: [], total: count ?? 0, page, pageSize }
    }

    const thumbnails = await fetchThumbnails(
      supabase,
      rows.map((r) => r.id)
    )

    const items = rows.map((r) => toPublic(r, thumbnails.get(r.id) ?? null))
    return { items, total: count ?? items.length, page, pageSize }
  } catch (err) {
    const code = (err as { code?: string } | null)?.code
    if (code && TOLERATED_CODES.has(code)) return emptyResult(page, pageSize)
    // Unknown failure: still degrade to empty rather than blowing up the route,
    // but rethrow so the route's captureException can record it.
    throw err
  }
}

/**
 * Resolve one thumbnail per listing id from `marketplace_listing_media`, picking
 * the lowest `sort_order` row. Tolerant: a missing media table → no thumbnails
 * (every listing simply gets null).
 */
async function fetchThumbnails(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (listingIds.length === 0) return out
  try {
    const { data, error } = await supabase
      .from("marketplace_listing_media")
      .select("listing_id, url, sort_order")
      .in("listing_id", listingIds)
      .order("sort_order", { ascending: true })

    if (error) {
      // Missing media table / column → no thumbnails (non-fatal).
      return out
    }

    for (const row of (data ?? []) as Array<{
      listing_id: string
      url: string | null
      sort_order: number | null
    }>) {
      // First row per listing wins (already ordered by sort_order ascending).
      if (row.url && !out.has(row.listing_id)) {
        out.set(row.listing_id, row.url)
      }
    }
  } catch {
    // Any failure resolving media is non-fatal — listings render without a thumb.
  }
  return out
}
