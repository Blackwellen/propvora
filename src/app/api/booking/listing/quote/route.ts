import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { quoteListingStay } from "@/lib/booking"
import { rateLimit, clientKey } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * POST /api/booking/listing/quote
 * Body: { listingId, checkIn, checkOut, guests }
 *
 * Public (anon) deep quote over `booking_listings`. The price is RECOMPUTED
 * server-side by the deep engine (quoteListingStay → pricing-engine.computeQuote)
 * from the active pricing profile + price rules + per-day overrides. The client
 * total is never trusted. Returns the full StayQuote shape (line items, deposit,
 * notes, ready flag). Never throws on a cold schema — `ready:false` instead.
 */
export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)

  // 30 price quotes per IP per 5 minutes — prevents pricing scrapers.
  const rl = await rateLimit({ key: clientKey(request, "booking:quote"), limit: 30, windowMs: 5 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit reached. Please wait before requesting another price." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : ""
    const checkIn = typeof body?.checkIn === "string" ? body.checkIn : ""
    const checkOut = typeof body?.checkOut === "string" ? body.checkOut : ""
    const guestsRaw = Number(body?.guests ?? 1)
    const guests = Number.isFinite(guestsRaw) ? Math.max(1, Math.trunc(guestsRaw)) : 1

    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    if (!ISO.test(checkIn) || !ISO.test(checkOut)) {
      return NextResponse.json({ error: "checkIn and checkOut must be yyyy-mm-dd" }, { status: 400 })
    }
    const today = new Date().toISOString().slice(0, 10)
    if (checkIn < today) return NextResponse.json({ error: "checkIn cannot be in the past" }, { status: 400 })
    if (!(checkOut > checkIn)) return NextResponse.json({ error: "checkOut must be after checkIn" }, { status: 400 })

    const supabase = await createClient()
    const quote = await quoteListingStay({ supabase, listingId, checkIn, checkOut, guests })

    return NextResponse.json({ quote }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    captureException(err, { source: "api/booking/listing/quote POST", requestId })
    return NextResponse.json({ error: "Failed to price stay", requestId }, { status: 500 })
  }
}
