/* ──────────────────────────────────────────────────────────────────────────
   Marketplace UI — shared types + defensive normalisers.

   The browse search API (`GET /api/marketplace/search`) returns items in the
   camelCase shape produced by `@/lib/marketplace/search` (PublicListing). The
   build brief documents a snake_case shape. We tolerate BOTH: every consumer
   reads through `normaliseListing`, which accepts either key style and never
   throws on a partial/cold payload.

   The "my listings" API (`GET /api/marketplace/listings`) returns raw
   `marketplace_listings` rows (snake_case, incl. `status`). `normaliseOwn`
   maps those defensively too.
─────────────────────────────────────────────────────────────────────────── */

/** A browse-safe listing as rendered by the marketplace UI. Money is integer
 *  pence end-to-end; format only at the edge with `PriceTag`. */
export interface MarketListing {
  id: string
  title: string
  description: string | null
  transactionType: string | null
  category: string | null
  countryCode: string | null
  currency: string | null
  basePricePence: number | null
  pricingModel: string | null
  location: string | null
  thumbnailUrl: string | null
  publishedAt: string | null
}

/** A listing the caller OWNS (all statuses) — includes lifecycle status. */
export interface OwnListing extends MarketListing {
  workspaceId: string | null
  status: OwnListingStatus
  createdAt: string | null
  updatedAt: string | null
}

export type OwnListingStatus = "draft" | "published" | "paused" | "archived"

/** Search API response envelope. */
export interface SearchResponse {
  items: MarketListing[]
  total: number
  page: number
  pageSize: number
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function pick<T>(...vals: (T | null | undefined)[]): T | null {
  for (const v of vals) if (v !== null && v !== undefined) return v
  return null
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === "" ? null : s
}

type AnyRow = Record<string, unknown>

/** Accepts a camelCase PublicListing OR a snake_case row; returns MarketListing. */
export function normaliseListing(raw: AnyRow): MarketListing {
  return {
    id: toStr(raw.id) ?? "",
    title: toStr(raw.title) ?? "Untitled listing",
    description: toStr(pick(raw.description)),
    transactionType: toStr(pick(raw.transactionType, raw.transaction_type)),
    category: toStr(pick(raw.category)),
    countryCode: toStr(pick(raw.countryCode, raw.country_code)),
    currency: toStr(pick(raw.currency)),
    basePricePence: toInt(pick(raw.basePricePence, raw.base_price_pence)),
    pricingModel: toStr(pick(raw.pricingModel, raw.pricing_model)),
    location: toStr(pick(raw.location)),
    thumbnailUrl: toStr(pick(raw.thumbnailUrl, raw.thumbnail_url)),
    publishedAt: toStr(pick(raw.publishedAt, raw.published_at)),
  }
}

const OWN_STATUSES: OwnListingStatus[] = ["draft", "published", "paused", "archived"]

function toStatus(v: unknown): OwnListingStatus {
  const s = toStr(v)
  return s && (OWN_STATUSES as string[]).includes(s) ? (s as OwnListingStatus) : "draft"
}

/** Map a raw `marketplace_listings` row (own listings API) into OwnListing. */
export function normaliseOwn(raw: AnyRow): OwnListing {
  const base = normaliseListing(raw)
  return {
    ...base,
    workspaceId: toStr(pick(raw.workspaceId, raw.workspace_id)),
    status: toStatus(raw.status),
    createdAt: toStr(pick(raw.createdAt, raw.created_at)),
    updatedAt: toStr(pick(raw.updatedAt, raw.updated_at)),
  }
}

/** Parse a SearchResponse defensively; non-conforming payloads → empty page. */
export function normaliseSearchResponse(raw: unknown, page = 1, pageSize = 24): SearchResponse {
  const r = (raw ?? {}) as AnyRow
  const items = Array.isArray(r.items) ? (r.items as AnyRow[]).map(normaliseListing) : []
  return {
    items,
    total: toInt(r.total) ?? items.length,
    page: toInt(r.page) ?? page,
    pageSize: toInt(r.pageSize) ?? pageSize,
  }
}
