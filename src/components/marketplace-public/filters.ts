import type { PublicListing } from "@/lib/marketplace/search"
import type { IntentKey } from "./intent"

/* ──────────────────────────────────────────────────────────────────────────
   Marketplace public filter model — URL-synced, intent-aware.

   Server-driven filters (q, country, location, price) hit the real
   `/api/marketplace/public-search` (→ marketplace_search FTS RPC). The richer
   discovery toggles (instant-book, verified/insured/licensed, available-now,
   response-time, min-rating, bedrooms for stays) refine the returned set
   client-side over real public columns — no fabricated data. Money is pence.
─────────────────────────────────────────────────────────────────────────── */

export type MpSortKey = "recommended" | "price_asc" | "price_desc" | "rating" | "newest"

export const MP_SORT_OPTIONS: { key: MpSortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
  { key: "newest", label: "Newest" },
]

export interface MpFilters {
  query: string
  countryCode: string
  location: string
  minPence: number | null
  maxPence: number | null
  // trust / discovery toggles
  instantBook: boolean
  verifiedOnly: boolean
  availableNow: boolean
  minRating: number
  // stays
  bedrooms: number
  sort: MpSortKey
}

export const MP_EMPTY: MpFilters = {
  query: "",
  countryCode: "",
  location: "",
  minPence: null,
  maxPence: null,
  instantBook: false,
  verifiedOnly: false,
  availableNow: false,
  minRating: 0,
  bedrooms: 0,
  sort: "recommended",
}

export function mpActiveCount(f: MpFilters): number {
  let n = 0
  if (f.countryCode) n++
  if (f.location) n++
  if (f.minPence != null || f.maxPence != null) n++
  if (f.instantBook) n++
  if (f.verifiedOnly) n++
  if (f.availableNow) n++
  if (f.minRating > 0) n++
  if (f.bedrooms > 0) n++
  return n
}

export function mpFromParams(sp: URLSearchParams): MpFilters {
  const int = (k: string) => {
    const n = Number(sp.get(k))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  }
  const penceOrNull = (k: string): number | null => {
    const raw = sp.get(k)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? Math.floor(n) : null
  }
  const sort = (sp.get("sort") as MpSortKey) || "recommended"
  return {
    query: sp.get("q") ?? "",
    countryCode: sp.get("country") ?? "",
    location: sp.get("where") ?? "",
    minPence: penceOrNull("minPence"),
    maxPence: penceOrNull("maxPence"),
    instantBook: sp.get("instant") === "1",
    verifiedOnly: sp.get("verified") === "1",
    availableNow: sp.get("now") === "1",
    minRating: int("rating"),
    bedrooms: int("bedrooms"),
    sort: MP_SORT_OPTIONS.some((s) => s.key === sort) ? sort : "recommended",
  }
}

export function mpToParams(f: MpFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.query) p.set("q", f.query)
  if (f.countryCode) p.set("country", f.countryCode)
  if (f.location) p.set("where", f.location)
  if (f.minPence != null) p.set("minPence", String(f.minPence))
  if (f.maxPence != null) p.set("maxPence", String(f.maxPence))
  if (f.instantBook) p.set("instant", "1")
  if (f.verifiedOnly) p.set("verified", "1")
  if (f.availableNow) p.set("now", "1")
  if (f.minRating > 0) p.set("rating", String(f.minRating))
  if (f.bedrooms > 0) p.set("bedrooms", String(f.bedrooms))
  if (f.sort !== "recommended") p.set("sort", f.sort)
  return p
}

function isVerified(l: PublicListing): boolean {
  return l.verificationStatus === "verified" || l.verificationStatus === "approved"
}

/** Apply client-side refinements + sort over the real returned listings. */
export function mpRefineAndSort(items: PublicListing[], f: MpFilters): PublicListing[] {
  let out = items
  if (f.instantBook) out = out.filter((l) => l.instantBook)
  if (f.verifiedOnly) out = out.filter(isVerified)
  if (f.availableNow) out = out.filter((l) => l.instantBook || l.transactionType === "emergency_job")
  if (f.minRating > 0) out = out.filter((l) => (l.rating ?? 0) >= f.minRating)

  const sorted = [...out]
  switch (f.sort) {
    case "price_asc":
      sorted.sort((a, b) => (a.basePricePence ?? Infinity) - (b.basePricePence ?? Infinity))
      break
    case "price_desc":
      sorted.sort((a, b) => (b.basePricePence ?? -1) - (a.basePricePence ?? -1))
      break
    case "rating":
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      break
    case "newest":
      sorted.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      break
    default:
      break
  }
  return sorted
}

/** Which discovery toggles make sense for a given intent. */
export function togglesForIntent(intent: IntentKey): {
  instantBook: boolean
  verified: boolean
  availableNow: boolean
  rating: boolean
  bedrooms: boolean
} {
  const isSupplier = intent === "suppliers" || intent === "emergency" || intent === "services"
  return {
    instantBook: intent === "stays" || intent === "all",
    verified: true,
    availableNow: isSupplier || intent === "all",
    rating: true,
    bedrooms: intent === "stays",
  }
}
