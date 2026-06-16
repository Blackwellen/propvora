import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit, clientKey } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/payments/status?bookingRef=… (or ?paymentId=…)

   Read-only status surface the guest pay / confirmation UI POLLS after
   confirming a PaymentIntent. It returns the REAL, current state — it never
   asserts capture or confirmation on its own. Capture/confirmation is
   webhook-driven; this route only reports what the records say.

   Returned shape:
     {
       ready: boolean,                // false → payments not provisioned (503-ish)
       paymentStatus: string|null,    // requires_payment | processing |
                                      //   requires_capture | succeeded | …
       bookingStatus: string|null,    // hold | pending_payment | confirmed | …
       amountPence: number|null,
       currency: string|null,
     }

   The pay page maps these onto honest copy:
     • requires_payment / processing   → "Processing your payment…"
     • requires_capture / succeeded    → "Payment received — booking pending
                                          confirmation" (escrow: funds held)
     • bookingStatus === 'confirmed'   → "Booking confirmed"
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "PGRST202"])
function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned|relation .* does not exist/i.test(e.message ?? "")
}

type SB = Awaited<ReturnType<typeof createClient>>

async function readBookingStatus(
  supabase: SB,
  bookingRef: string
): Promise<{ status: string | null; totalPence: number | null; currency: string | null } | "missing"> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("status, total_pence, currency")
      .eq("id", bookingRef)
      .maybeSingle()
    if (error) {
      if (isMissing(error)) return "missing"
      return { status: null, totalPence: null, currency: null }
    }
    if (!data) return { status: null, totalPence: null, currency: null }
    const row = data as Record<string, unknown>
    return {
      status: (row.status as string | null) ?? null,
      totalPence: row.total_pence == null ? null : Math.trunc(Number(row.total_pence)),
      currency: (row.currency as string | null) ?? null,
    }
  } catch (err) {
    if (isMissing(err)) return "missing"
    return { status: null, totalPence: null, currency: null }
  }
}

/**
 * Read the latest payment status for a booking/payment. Tries the sibling P5
 * `escrow_payments` table first (real schema: booking_id + status), then the
 * legacy `payments` table (linked_type/linked_id). Returns "missing" only when
 * BOTH are unprovisioned. Read-only — never advances any status.
 */
async function readPaymentStatus(
  supabase: SB,
  args: { bookingRef?: string; paymentId?: string }
): Promise<string | null | "missing"> {
  // 1. Real escrow_payments table.
  try {
    let q = supabase
      .from("escrow_payments")
      .select("status")
      .order("created_at", { ascending: false })
      .limit(1)
    if (args.paymentId) q = q.eq("id", args.paymentId)
    else q = q.eq("booking_id", args.bookingRef ?? "")
    const { data, error } = await q.maybeSingle()
    if (!error) {
      return ((data as { status?: string } | null)?.status as string | undefined) ?? null
    }
    if (!isMissing(error)) return null
    // else fall through to the legacy table
  } catch (err) {
    if (!isMissing(err)) return null
  }

  // 2. Legacy payments table fallback.
  try {
    let q = supabase.from("payments").select("status").order("created_at", { ascending: false }).limit(1)
    if (args.paymentId) q = q.eq("id", args.paymentId)
    else q = q.eq("linked_type", "booking").eq("linked_id", args.bookingRef ?? "")
    const { data, error } = await q.maybeSingle()
    if (error) {
      if (isMissing(error)) return "missing"
      return null
    }
    return ((data as { status?: string } | null)?.status as string | undefined) ?? null
  } catch (err) {
    if (isMissing(err)) return "missing"
    return null
  }
}

export async function GET(request: NextRequest) {
  // 60 status polls per IP per minute — permits normal polling, blocks scrapers.
  const rl = await rateLimit({ key: clientKey(request, "payments:status"), limit: 60, windowMs: 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { ready: false, paymentStatus: null, bookingStatus: null },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  const url = new URL(request.url)
  const bookingRef = url.searchParams.get("bookingRef")?.trim() || undefined
  const paymentId = url.searchParams.get("paymentId")?.trim() || undefined

  if (!bookingRef && !paymentId) {
    return NextResponse.json(
      { error: "A bookingRef or paymentId is required." },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  let bookingStatus: string | null = null
  let amountPence: number | null = null
  let currency: string | null = null

  if (bookingRef) {
    const b = await readBookingStatus(supabase, bookingRef)
    if (b === "missing") {
      return NextResponse.json(
        { ready: false, paymentStatus: null, bookingStatus: null },
        { status: 503 }
      )
    }
    bookingStatus = b.status
    amountPence = b.totalPence
    currency = b.currency
  }

  const paymentStatus = await readPaymentStatus(supabase, { bookingRef, paymentId })
  if (paymentStatus === "missing" && bookingStatus === null) {
    return NextResponse.json(
      { ready: false, paymentStatus: null, bookingStatus: null },
      { status: 503 }
    )
  }

  return NextResponse.json(
    {
      ready: true,
      paymentStatus: paymentStatus === "missing" ? null : paymentStatus,
      bookingStatus,
      amountPence,
      currency,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
