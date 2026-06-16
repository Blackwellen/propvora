import { createAdminClient } from "@/lib/supabase/admin"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  getConnectionByToken,
  collectBusySpans,
  buildIcalFeed,
} from "@/lib/booking/ical"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/booking/ical/[token].ics
 *
 * PUBLIC-BY-TOKEN iCal export feed for a listing. Airbnb / Booking.com / Vrbo /
 * Google / Outlook subscribe to this URL to read the listing's blocked + booked
 * dates. The token is an unguessable secret stored on the export connection.
 *
 * PRIVACY: the feed contains DATES ONLY (VEVENTs with DTSTART/DTEND VALUE=DATE
 * and a generic SUMMARY of "Booked"/"Blocked"). It NEVER includes guest names,
 * emails, prices, or any other private data. Lookup is by token via the SERVICE
 * role (the connections table has no anon SELECT policy), so an attacker cannot
 * enumerate listings — they would need the exact token, which only reveals
 * dates.
 *
 * The route accepts either ".../[token]" or ".../[token].ics" (the .ics suffix
 * is stripped) so the URL pastes cleanly into channel managers.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { token: raw } = await ctx.params
    const token = (raw ?? "").replace(/\.ics$/i, "").trim()
    if (!token || !/^[a-f0-9]{16,}$/i.test(token)) {
      return new Response("Not found", { status: 404 })
    }

    // Service role: the connection table is not anon-readable; this route is the
    // only public mediator and it emits dates only.
    const admin = createAdminClient()
    const conn = await getConnectionByToken(admin, token)
    if (!conn) {
      return new Response("Not found", { status: 404 })
    }

    const spans = await collectBusySpans(admin, conn.listingId)
    const feed = buildIcalFeed({
      calendarName: `Propvora · ${conn.channel} export`,
      spans,
    })

    return new Response(feed, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="propvora-${conn.listingId}.ics"`,
        // Channel managers poll periodically; allow a short cache.
        "Cache-Control": "public, max-age=900, s-maxage=900",
      },
    })
  } catch (err) {
    captureException(err, { source: "api/booking/ical/[token] GET", requestId })
    // Always return a syntactically-valid empty calendar rather than leaking.
    const empty = buildIcalFeed({ calendarName: "Propvora export", spans: [] })
    return new Response(empty, {
      status: 200,
      headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" },
    })
  }
}
