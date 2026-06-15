import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchListings, type SearchListingsParams } from "@/lib/marketplace/search"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/marketplace/search
 * Cross-workspace search over PUBLISHED listings only. Open to any authenticated
 * user; returns only browse-safe public columns. Query params:
 *   q, category, transactionType, countryCode, minPence, maxPence, location,
 *   page, pageSize
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

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
      transactionType: strParam("transactionType"),
      countryCode: strParam("countryCode"),
      minPence: intParam("minPence"),
      maxPence: intParam("maxPence"),
      location: strParam("location"),
      page: intParam("page"),
      pageSize: intParam("pageSize"),
    }

    const result = await searchListings(supabase, params)
    return NextResponse.json(result)
  } catch (err) {
    captureException(err, { source: "api/marketplace/search", requestId })
    return NextResponse.json({ error: "Search failed", requestId }, { status: 500 })
  }
}
