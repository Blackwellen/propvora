import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchListings, type SearchListingsParams } from "@/lib/marketplace/search"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/marketplace/public-search
 *
 * ANON-SAFE cross-workspace search over PUBLISHED/active listings. Unlike
 * `/api/marketplace/search` (which 401s for guests), this route is open to
 * anonymous visitors so the PUBLIC marketplace pages can fetch live results.
 * Security rests entirely on RLS: `marketplace_search` is SECURITY INVOKER and
 * `marketplace_listings_public_read` exposes only published/active rows to anon
 * — no private columns, no drafts. Tolerant: a cold DB → an empty page.
 *
 * Query params: q, category, listingType/transactionType, countryCode,
 *   minPence, maxPence, location, page, pageSize.
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const sp = url.searchParams

    const intParam = (key: string): number | undefined => {
      const raw = sp.get(key)
      if (raw === null || raw.trim() === "") return undefined
      const n = Number(raw)
      return Number.isFinite(n) ? n : undefined
    }
    const strParam = (key: string): string | undefined => {
      const raw = sp.get(key)
      if (raw === null) return undefined
      const trimmed = raw.trim()
      return trimmed === "" ? undefined : trimmed
    }

    const params: SearchListingsParams = {
      query: strParam("q") ?? strParam("query"),
      category: strParam("category"),
      listingType: strParam("listingType"),
      transactionType: strParam("transactionType"),
      countryCode: strParam("countryCode"),
      minPence: intParam("minPence"),
      maxPence: intParam("maxPence"),
      location: strParam("location"),
      page: intParam("page"),
      pageSize: intParam("pageSize"),
    }

    const result = await searchListings(supabase, params)
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120" },
    })
  } catch (err) {
    captureException(err, { source: "api/marketplace/public-search", requestId })
    return NextResponse.json({ items: [], total: 0, page: 1, pageSize: 24 })
  }
}
