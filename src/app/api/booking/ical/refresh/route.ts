import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { captureException, requestIdFrom } from "@/lib/observability"
import { getBookingListing } from "@/lib/booking/booking-listings"
import { listConnections, runImportSync } from "@/lib/booking/ical"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/booking/ical/refresh  { listingId, connectionId? }
 *
 * Manually trigger an IMPORT sync for one connection (or all import connections
 * on the listing). Fetches the external iCal URL(s), blocks the busy dates on
 * booking_availability_days, detects conflicts vs live direct bookings, and
 * records a sync event per run.
 *
 * Authorisation: the caller must be able to see the listing via RLS (cookie
 * client). The sync itself then runs with the service role so it can write
 * availability + the append-only sync_events audit, scoped to the verified
 * listing's connections only.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const listingId = String(body.listingId ?? "").trim()
    const connectionId = body.connectionId ? String(body.connectionId).trim() : null
    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 })

    // 1. Authorise against the listing with the RLS-bound client.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })
    const listing = await getBookingListing(supabase, listingId)
    if (!listing) return NextResponse.json({ error: "not_found_or_unauthorised" }, { status: 404 })

    // 2. Load the import connections (RLS-scoped read), filter to the target.
    const all = await listConnections(supabase, listingId)
    const imports = all.filter(
      (c) => c.direction === "import" && c.active && (!connectionId || c.id === connectionId),
    )
    if (imports.length === 0) {
      return NextResponse.json({ ok: true, ran: 0, results: [], note: "no active import connections" })
    }

    // 3. Run the syncs with the service role (writes availability + audit).
    const admin = createAdminClient()
    const results = []
    for (const conn of imports) {
      const outcome = await runImportSync(admin, conn)
      results.push({
        connectionId: conn.id,
        channel: conn.channel,
        status: outcome.status,
        eventsParsed: outcome.eventsParsed,
        daysBlocked: outcome.daysBlocked,
        conflicts: outcome.conflicts,
        conflictRanges: outcome.conflictRanges,
        error: outcome.error ?? null,
      })
    }
    return NextResponse.json({ ok: true, ran: results.length, results })
  } catch (err) {
    captureException(err, { source: "api/booking/ical/refresh POST", requestId })
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
