import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { getAvailability } from "@/lib/booking"
import { rateLimit, clientKey } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * GET /api/booking/listing/availability?listingId=&from=&to=
 *
 * Public (anon) per-day availability grid over a published `booking_listing`,
 * resolved by the deep engine (getAvailability merges availability_days + live
 * booking overlap + legacy blocked dates). Returns the set of NON-bookable dates
 * (everything not status='available') for the calendar to disable. Tolerant.
 */
export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)

  // 60 calendar loads per IP per minute — allows normal browsing, blocks scrapers.
  const rl = await rateLimit({ key: clientKey(request, "booking:avail"), limit: 60, windowMs: 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { ready: false, unavailableDates: [] },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  try {
    const url = new URL(request.url)
    const listingId = (url.searchParams.get("listingId") ?? "").trim()
    let from = (url.searchParams.get("from") ?? "").trim()
    let to = (url.searchParams.get("to") ?? "").trim()
    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    if (!ISO.test(from)) from = new Date().toISOString().slice(0, 10)
    if (!ISO.test(to)) to = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10)

    const supabase = await createClient()
    const { ready, days } = await getAvailability(supabase, listingId, from, to)
    const unavailableDates = days.filter((d) => d.status !== "available").map((d) => d.date)

    return NextResponse.json(
      { ready, unavailableDates },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" } }
    )
  } catch (err) {
    captureException(err, { source: "api/booking/listing/availability GET", requestId })
    return NextResponse.json({ ready: false, unavailableDates: [] })
  }
}
