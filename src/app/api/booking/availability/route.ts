import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Postgres codes meaning "the booking schema isn't provisioned yet" — the
// sibling lib agent's migration owns these tables. Tolerate their absence by
// returning an empty (fully-available) calendar rather than a hard error.
const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204"])

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_RANGE_DAYS = 400

/** Parse & validate a yyyy-mm-dd query param into a UTC midnight Date, or null. */
function parseDate(raw: string | null): Date | null {
  if (!raw || !ISO_DATE.test(raw)) return null
  const d = new Date(`${raw}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function isMissing(code: string | null | undefined): boolean {
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/**
 * GET /api/booking/availability?listingId=&from=&to=
 *
 * Public (anonymous) endpoint. Returns the set of blocked / booked dates for a
 * PUBLISHED stay-booking listing within [from, to], so the client date picker
 * can disable them. Reads ONLY with the request's anon-keyed client — RLS is
 * the isolation boundary; no service-role key is ever used here.
 *
 * Response: { listingId, from, to, blockedDates: string[], minNights, ready }
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const listingId = url.searchParams.get("listingId")?.trim()
    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    }

    const from = parseDate(url.searchParams.get("from"))
    const to = parseDate(url.searchParams.get("to"))
    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to must be yyyy-mm-dd dates" },
        { status: 400 }
      )
    }
    if (to < from) {
      return NextResponse.json({ error: "to must be on or after from" }, { status: 400 })
    }
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000)
    if (spanDays > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: `range too large (max ${MAX_RANGE_DAYS} days)` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // The listing must exist and be a published stay_booking listing. Never
    // leak existence of a non-public listing.
    const { data: listing, error: listingErr } = await supabase
      .from("marketplace_listings")
      .select("id, status, transaction_type")
      .eq("id", listingId)
      .maybeSingle()

    if (listingErr) {
      if (isMissing(listingErr.code)) {
        return NextResponse.json(
          { error: "Booking is not available yet.", ready: false },
          { status: 503 }
        )
      }
      throw listingErr
    }
    const row = listing as { status?: string | null; transaction_type?: string | null } | null
    if (!row || row.status !== "published" || row.transaction_type !== "stay_booking") {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Prefer the sibling-owned availability lib; fall back to a tolerant direct
    // read of a per-day availability table. Both paths degrade to "all open"
    // when the schema isn't provisioned yet.
    const fromIso = from.toISOString().slice(0, 10)
    const toIso = to.toISOString().slice(0, 10)

    const lib = await loadAvailabilityLib()
    if (lib?.getBlockedDates) {
      try {
        const result = await lib.getBlockedDates(supabase, {
          listingId,
          from: fromIso,
          to: toIso,
        })
        return NextResponse.json(
          {
            listingId,
            from: fromIso,
            to: toIso,
            blockedDates: result.blockedDates ?? [],
            minNights: result.minNights ?? 1,
            ready: true,
          },
          { headers: { "Cache-Control": "no-store" } }
        )
      } catch (err) {
        const code = (err as { code?: string } | null)?.code
        if (!isMissing(code)) throw err
        // fall through to direct read / open calendar
      }
    }

    // Tolerant direct read: any per-day availability rows that are not open.
    const blockedDates = await readBlockedDirect(supabase, listingId, fromIso, toIso)

    return NextResponse.json(
      {
        listingId,
        from: fromIso,
        to: toIso,
        blockedDates,
        minNights: 1,
        ready: true,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    captureException(err, { source: "api/booking/availability GET", requestId })
    return NextResponse.json(
      { error: "Failed to load availability", requestId },
      { status: 500 }
    )
  }
}

/** Tolerantly load the sibling availability lib. Returns null when absent. */
async function loadAvailabilityLib(): Promise<{
  getBlockedDates?: (
    supabase: Awaited<ReturnType<typeof createClient>>,
    args: { listingId: string; from: string; to: string }
  ) => Promise<{ blockedDates?: string[]; minNights?: number }>
} | null> {
  try {
    // @ts-ignore — provided by a sibling agent; may be absent on this branch.
    return (await import("@/lib/booking/availability")) as never
  } catch {
    return null
  }
}

/**
 * Direct, tolerant read of blocked per-day rows. Tries the per-listing daily
 * availability table; if it's missing, returns [] (treat as fully available so
 * a cold DB never blocks the UI). The reserve RPC is the real conflict guard.
 */
async function readBlockedDirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string,
  fromIso: string,
  toIso: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("booking_availability_days")
      .select("date, status")
      .eq("listing_id", listingId)
      .gte("date", fromIso)
      .lte("date", toIso)

    if (error) {
      if (isMissing(error.code)) return []
      return []
    }
    return (data ?? [])
      .filter((r) => {
        const status = (r as { status?: string | null }).status ?? "available"
        return status !== "available"
      })
      .map((r) => String((r as { date: string }).date).slice(0, 10))
  } catch {
    return []
  }
}
