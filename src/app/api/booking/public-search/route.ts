import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchPublicListings, type SearchListingsArgs } from "@/lib/booking/public"
import { captureException, requestIdFrom } from "@/lib/observability"
import { rateLimit, clientKey } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/booking/public-search
 *
 * ANON-SAFE search over PUBLISHED booking_listings. Drives the /stay search +
 * map experience: URL filter state → these params → the `searchPublicListings`
 * query (which applies title/summary, type, cancellation, guests, bedrooms,
 * bathrooms, beds, instant-only, verified-only as SQL filters and price/city/
 * map-bounds as post-enrichment filters). Tolerant: a cold DB → empty list.
 *
 * Query params: q, city, guests, minPence, maxPence, listingType, cancellation,
 *   bedrooms, bathrooms, beds, instant (0/1), verified (0/1),
 *   bounds (s,w,n,e), limit.
 */
export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)

  // 120 search requests per IP per minute — permits normal browsing, throttles scrapers.
  const rl = await rateLimit({ key: clientKey(request, "booking:search"), limit: 120, windowMs: 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { listings: [] },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  try {
    const supabase = await createClient()
    const sp = new URL(request.url).searchParams

    const intParam = (key: string): number | null => {
      const raw = sp.get(key)
      if (raw === null || raw.trim() === "") return null
      const n = Number(raw)
      return Number.isFinite(n) ? n : null
    }
    const strParam = (key: string): string | null => {
      const raw = sp.get(key)
      const t = raw?.trim()
      return t ? t : null
    }
    const boolParam = (key: string): boolean | null => {
      const raw = sp.get(key)
      if (raw === "1" || raw === "true") return true
      return null
    }
    let bounds: [number, number, number, number] | null = null
    const rawBounds = sp.get("bounds")
    if (rawBounds) {
      const parts = rawBounds.split(",").map((x) => Number(x))
      if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
        bounds = [parts[0], parts[1], parts[2], parts[3]]
      }
    }

    const args: SearchListingsArgs = {
      q: strParam("q"),
      city: strParam("city"),
      guests: intParam("guests"),
      minPence: intParam("minPence"),
      maxPence: intParam("maxPence"),
      listingType: strParam("listingType"),
      cancellation: strParam("cancellation"),
      bedrooms: intParam("bedrooms"),
      bathrooms: intParam("bathrooms"),
      beds: intParam("beds"),
      instantOnly: boolParam("instant"),
      verifiedOnly: boolParam("verified"),
      bounds,
      limit: intParam("limit") ?? 90,
    }

    const listings = await searchPublicListings(supabase, args)
    return NextResponse.json(
      { listings },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120" } }
    )
  } catch (err) {
    captureException(err, { source: "api/booking/public-search", requestId })
    return NextResponse.json({ listings: [] })
  }
}
