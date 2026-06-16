import type { PublicListingCard } from "@/lib/booking/public"
import { STAY_TYPE_LABEL, STAY_POLICY_LABEL } from "./StayListingCard"

/* ──────────────────────────────────────────────────────────────────────────
   Stay filter model — the single source of truth for the /stay filter system.

   The filter state is URL-synced (see `filtersFromParams` / `filtersToParams`)
   so a filtered search is shareable and survives refresh/back. Server-driven
   filters (type, cancellation, guests, bedrooms, bathrooms, beds, instant,
   verified, price, q, city, bounds) are forwarded to /api/booking/public-search;
   client-only refinements (amenity toggles, min-rating) apply over the returned
   set. Money is integer pence.
─────────────────────────────────────────────────────────────────────────── */

export type SortKey = "recommended" | "price_asc" | "price_desc" | "rating" | "newest"

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
  { key: "newest", label: "Newest" },
]

/** Quick lifestyle toggles — match listing summary/title keywords (client-side). */
export const AMENITY_TOGGLES: { key: string; label: string; keywords: string[] }[] = [
  { key: "wifi", label: "Wifi", keywords: ["wifi", "wi-fi", "internet", "broadband"] },
  { key: "kitchen", label: "Kitchen", keywords: ["kitchen", "kitchenette"] },
  { key: "parking", label: "Free parking", keywords: ["parking", "garage", "driveway"] },
  { key: "self_checkin", label: "Self check-in", keywords: ["self check", "self-check", "keypad", "lockbox", "smart lock"] },
  { key: "workspace", label: "Work-friendly", keywords: ["desk", "workspace", "work-friendly", "office"] },
  { key: "family", label: "Family-friendly", keywords: ["family", "cot", "crib", "child"] },
  { key: "pets", label: "Pet-friendly", keywords: ["pet", "dog", "cat"] },
  { key: "aircon", label: "Air conditioning", keywords: ["air con", "a/c", "aircon", "air-conditioning"] },
]

export const TYPE_OPTIONS = Object.keys(STAY_TYPE_LABEL)
export const POLICY_OPTIONS = Object.keys(STAY_POLICY_LABEL)

export interface StayFilters {
  q: string
  city: string
  guests: number
  minPence: number | null
  maxPence: number | null
  type: string | null
  cancellation: string | null
  bedrooms: number
  bathrooms: number
  beds: number
  instantOnly: boolean
  verifiedOnly: boolean
  minRating: number
  amenities: string[]
  sort: SortKey
}

export const EMPTY_FILTERS: StayFilters = {
  q: "",
  city: "",
  guests: 0,
  minPence: null,
  maxPence: null,
  type: null,
  cancellation: null,
  bedrooms: 0,
  bathrooms: 0,
  beds: 0,
  instantOnly: false,
  verifiedOnly: false,
  minRating: 0,
  amenities: [],
  sort: "recommended",
}

/** Count the "advanced" filters that are active (excludes free-text + sort). */
export function activeFilterCount(f: StayFilters): number {
  let n = 0
  if (f.guests > 0) n++
  if (f.minPence != null || f.maxPence != null) n++
  if (f.type) n++
  if (f.cancellation) n++
  if (f.bedrooms > 0) n++
  if (f.bathrooms > 0) n++
  if (f.beds > 0) n++
  if (f.instantOnly) n++
  if (f.verifiedOnly) n++
  if (f.minRating > 0) n++
  n += f.amenities.length
  return n
}

/** Parse filter state from URLSearchParams (URL → state). */
export function filtersFromParams(sp: URLSearchParams): StayFilters {
  const int = (k: string, d = 0) => {
    const n = Number(sp.get(k))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
  }
  const penceOrNull = (k: string): number | null => {
    const raw = sp.get(k)
    if (raw == null || raw === "") return null
    const n = Number(raw)
    return Number.isFinite(n) ? Math.floor(n) : null
  }
  const sort = (sp.get("sort") as SortKey) || "recommended"
  return {
    q: sp.get("q") ?? "",
    city: sp.get("city") ?? "",
    guests: int("guests"),
    minPence: penceOrNull("minPence"),
    maxPence: penceOrNull("maxPence"),
    type: sp.get("type") || null,
    cancellation: sp.get("cancellation") || null,
    bedrooms: int("bedrooms"),
    bathrooms: int("bathrooms"),
    beds: int("beds"),
    instantOnly: sp.get("instant") === "1",
    verifiedOnly: sp.get("verified") === "1",
    minRating: int("rating"),
    amenities: (sp.get("amenities") ?? "").split(",").filter(Boolean),
    sort: SORT_OPTIONS.some((s) => s.key === sort) ? sort : "recommended",
  }
}

/** Serialise filter state to URLSearchParams (state → URL). Omits defaults. */
export function filtersToParams(f: StayFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q) p.set("q", f.q)
  if (f.city) p.set("city", f.city)
  if (f.guests > 0) p.set("guests", String(f.guests))
  if (f.minPence != null) p.set("minPence", String(f.minPence))
  if (f.maxPence != null) p.set("maxPence", String(f.maxPence))
  if (f.type) p.set("type", f.type)
  if (f.cancellation) p.set("cancellation", f.cancellation)
  if (f.bedrooms > 0) p.set("bedrooms", String(f.bedrooms))
  if (f.bathrooms > 0) p.set("bathrooms", String(f.bathrooms))
  if (f.beds > 0) p.set("beds", String(f.beds))
  if (f.instantOnly) p.set("instant", "1")
  if (f.verifiedOnly) p.set("verified", "1")
  if (f.minRating > 0) p.set("rating", String(f.minRating))
  if (f.amenities.length) p.set("amenities", f.amenities.join(","))
  if (f.sort !== "recommended") p.set("sort", f.sort)
  return p
}

/** Build the /api/booking/public-search query for the server-driven filters. */
export function filtersToApiParams(f: StayFilters, bounds?: [number, number, number, number] | null): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q) p.set("q", f.q)
  if (f.city) p.set("city", f.city)
  if (f.guests > 0) p.set("guests", String(f.guests))
  if (f.minPence != null) p.set("minPence", String(f.minPence))
  if (f.maxPence != null) p.set("maxPence", String(f.maxPence))
  if (f.type) p.set("listingType", f.type)
  if (f.cancellation) p.set("cancellation", f.cancellation)
  if (f.bedrooms > 0) p.set("bedrooms", String(f.bedrooms))
  if (f.bathrooms > 0) p.set("bathrooms", String(f.bathrooms))
  if (f.beds > 0) p.set("beds", String(f.beds))
  if (f.instantOnly) p.set("instant", "1")
  if (f.verifiedOnly) p.set("verified", "1")
  if (bounds) p.set("bounds", bounds.join(","))
  p.set("limit", "90")
  return p
}

/** Apply client-only refinements (amenities, min-rating) + sort to the cards. */
export function refineAndSort(cards: PublicListingCard[], f: StayFilters): PublicListingCard[] {
  let out = cards
  if (f.minRating > 0) out = out.filter((c) => (c.rating ?? 0) >= f.minRating)
  if (f.amenities.length > 0) {
    out = out.filter((c) => {
      const hay = `${c.title} ${c.summary ?? ""}`.toLowerCase()
      return f.amenities.every((key) => {
        const def = AMENITY_TOGGLES.find((a) => a.key === key)
        if (!def) return true
        return def.keywords.some((kw) => hay.includes(kw))
      })
    })
  }
  const sorted = [...out]
  switch (f.sort) {
    case "price_asc":
      sorted.sort((a, b) => (a.fromNightlyPence ?? Infinity) - (b.fromNightlyPence ?? Infinity))
      break
    case "price_desc":
      sorted.sort((a, b) => (b.fromNightlyPence ?? -1) - (a.fromNightlyPence ?? -1))
      break
    case "rating":
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      break
    case "newest":
      // Server already returns newest-first; keep order.
      break
    default:
      break
  }
  return sorted
}
