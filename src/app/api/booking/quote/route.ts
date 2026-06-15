import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  validateQuoteInput,
  loadPublishedStayListing,
  computeQuote,
} from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/booking/quote
 * Body: { listingId, checkIn, checkOut, guests }
 *
 * Public (anonymous) endpoint. RECOMPUTES the price server-side and returns a
 * transparent breakdown. The client total is never trusted — this is the
 * source of truth the checkout displays and the reserve endpoint re-verifies.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const body = await request.json().catch(() => null)
    const validated = validateQuoteInput(body)
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: validated.status })
    }

    const supabase = await createClient()

    const loaded = await loadPublishedStayListing(supabase, validated.listingId)
    if ("error" in loaded) {
      return NextResponse.json(
        { error: loaded.error, ...(loaded.status === 503 ? { ready: false } : {}) },
        { status: loaded.status }
      )
    }

    // Optional guest-capacity check when the listing declares a max.
    if (loaded.listing.max_guests != null && validated.guests > loaded.listing.max_guests) {
      return NextResponse.json(
        {
          error: `This listing accommodates up to ${loaded.listing.max_guests} guest${
            loaded.listing.max_guests === 1 ? "" : "s"
          }.`,
        },
        { status: 400 }
      )
    }

    const quote = await computeQuote(supabase, validated, loaded.listing)
    return NextResponse.json(
      { quote },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    captureException(err, { source: "api/booking/quote POST", requestId })
    return NextResponse.json({ error: "Failed to price stay", requestId }, { status: 500 })
  }
}
