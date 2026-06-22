import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit, clientKey } from "@/lib/rate-limit"
import { stripeSecretKey } from "@/lib/payments/stripe-keys"
import { resolveStripeCustomer, createCustomerSessionSecret } from "@/lib/payments/stripe-customer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/payments/intent — create (or reuse) a PaymentIntent for a HELD
   reservation so the public guest pay page can collect card details.

   HONESTY + SAFETY MODEL
   ──────────────────────
   • Money is integer pence end-to-end; the amount is RECOMPUTED from the booking
     row (total_pence) — the client NEVER sends an amount.
   • The PaymentIntent uses MANUAL CAPTURE (escrow) so funds are authorised but
     HELD until the stay/job completes. Capture is webhook/operator-driven, NOT
     done here.
   • Idempotent per booking: an existing open (requires_payment) payment record
     for this booking is reused — we re-fetch its live PaymentIntent and return a
     fresh client_secret instead of minting a second intent.
   • 503 when payments aren't provisioned (no STRIPE_SECRET_KEY, or the payments
     schema isn't present).

   The sibling lib `@/lib/payments/intents` is imported DYNAMICALLY and is the
   PRIMARY path (param building + escrow_payments/escrow_holds record writes).
   When it (or its tables) is absent we fall back to the documented inline path
   against the legacy `payments` table. The Stripe SECRET-key call lives here and
   is only reached at request time with a held booking + configured key — never
   during type-checking.
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "PGRST202", "42703"])
function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned|relation .* does not exist/i.test(e.message ?? "")
}

type SB = Awaited<ReturnType<typeof createClient>>

interface BookingForPayment {
  id: string
  workspaceId: string
  totalPence: number
  currency: string
  status: string
  guestEmail: string | null
  listingTitle: string | null
  countryCode: string | null
}

// ── Sibling contract shapes (structural; libs imported dynamically) ──────────
interface IntentsLib {
  buildPaymentIntentParams?: (args: Record<string, unknown>) => Record<string, unknown>
  createPaymentRecord?: (
    supabase: SB,
    args: Record<string, unknown>
  ) => Promise<{ id: string } | null>
  getPayment?: (supabase: SB, paymentId: string) => Promise<Record<string, unknown> | null>
  linkStripeIntent?: (supabase: SB, paymentId: string, intentId: string) => Promise<void>
}
interface FeesLib {
  calculateMarketplaceFee?: (args: Record<string, unknown>) => Promise<{
    platformFeePence: number
    sellerPayoutPence: number
    providerFeePence: number
    appliedRuleId: string | null
  }>
}

async function loadIntentsLib(): Promise<IntentsLib | null> {
  try {
    // @ts-ignore — sibling-owned; tolerate absence.
    return (await import("@/lib/payments/intents")) as IntentsLib
  } catch {
    return null
  }
}
async function loadFeesLib(): Promise<FeesLib | null> {
  try {
    // @ts-ignore — sibling-owned; tolerate absence.
    return (await import("@/lib/marketplace/fees")) as FeesLib
  } catch {
    return null
  }
}

// ── Inline fallback against the legacy `payments` table (011_money_level2) ───
// Used only when the sibling intents lib / escrow_payments table is absent. That
// table stores amount as DECIMAL (major units), stripe_payment_id, status,
// reference; we link the booking via linked_type/linked_id + reference.
async function fallbackFindOpenPayment(
  supabase: SB,
  bookingId: string
): Promise<{ id: string; intentId: string | null } | null> {
  const { data, error } = await supabase
    .from("payments")
    .select("id, stripe_payment_id, status")
    .eq("linked_type", "booking")
    .eq("linked_id", bookingId)
    .in("status", ["requires_payment", "processing", "requires_capture"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    if (isMissing(error)) throw error
    return null
  }
  if (!data) return null
  const row = data as { id: string; stripe_payment_id: string | null }
  return { id: row.id, intentId: row.stripe_payment_id }
}

async function fallbackCreatePayment(supabase: SB, b: BookingForPayment): Promise<string | null> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      workspace_id: b.workspaceId,
      payment_type: "income",
      linked_type: "booking",
      linked_id: b.id,
      amount: b.totalPence / 100,
      currency: b.currency || "GBP",
      payment_method: "card",
      status: "requires_payment",
      reference: b.id,
      metadata: { kind: "stay_booking", total_pence: b.totalPence, escrow: true },
    })
    .select("id")
    .single()
  if (error) {
    if (isMissing(error)) throw error
    return null
  }
  return (data as { id: string }).id
}

async function fallbackLinkIntent(
  supabase: SB,
  paymentId: string,
  intentId: string
): Promise<void> {
  try {
    await supabase.from("payments").update({ stripe_payment_id: intentId }).eq("id", paymentId)
  } catch {
    /* webhook reconciles authoritatively */
  }
}

// ── Load the held booking (anon client; pay page is public) ──────────────────
async function loadHeldBooking(
  supabase: SB,
  bookingRef: string
): Promise<BookingForPayment | "missing" | null> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, workspace_id, total_pence, currency, status, guest_email, marketplace_listings(title, country_code)"
      )
      .eq("id", bookingRef)
      .maybeSingle()
    if (error) {
      if (isMissing(error)) return "missing"
      return null
    }
    if (!data) return null
    const row = data as Record<string, unknown>
    const listing = row.marketplace_listings as { title?: string; country_code?: string } | null
    return {
      id: String(row.id),
      workspaceId: String(row.workspace_id),
      totalPence: Math.trunc(Number(row.total_pence ?? 0)),
      currency: (row.currency as string) || "GBP",
      status: (row.status as string) || "hold",
      guestEmail: (row.guest_email as string | null) ?? null,
      listingTitle: listing?.title ?? null,
      countryCode: listing?.country_code ?? null,
    }
  } catch (err) {
    if (isMissing(err)) return "missing"
    return null
  }
}

export async function POST(request: NextRequest) {
  // Strict: 5 payment-intent creates per IP per 15 minutes — same as reserve.
  const rl = await rateLimit({ key: clientKey(request, "payments:intent"), limit: 5, windowMs: 15 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  // No secret key → payments not provisioned. NEVER attempt a Stripe call.
  const secretKey = stripeSecretKey()
  if (!secretKey) {
    return NextResponse.json({ error: "Payments are not available yet.", ready: false }, { status: 503 })
  }

  let bookingRef: string | undefined
  let transactionId: string | undefined
  try {
    const body = await request.json()
    bookingRef = typeof body?.bookingRef === "string" ? body.bookingRef.trim() : undefined
    transactionId = typeof body?.transactionId === "string" ? body.transactionId.trim() : undefined
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const ref = bookingRef ?? transactionId
  if (!ref) {
    return NextResponse.json({ error: "A booking reference is required." }, { status: 400 })
  }

  // Guest pay endpoint: there is no auth session here, and the public pay page
  // has no RLS read path to its own held booking — the unguessable booking id
  // IS the bearer capability (like a Stripe client_secret), and this route is
  // rate-limited + recomputes the amount from the row (never trusts the client).
  // So we load + record via the service role.
  const supabase = createAdminClient() as Awaited<ReturnType<typeof createClient>>

  const booking = await loadHeldBooking(supabase, ref)
  if (booking === "missing") {
    return NextResponse.json({ error: "Payments are not available yet.", ready: false }, { status: 503 })
  }
  if (!booking) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 })
  }
  if (!["hold", "pending_payment"].includes(booking.status)) {
    return NextResponse.json({ error: "This reservation can no longer be paid for." }, { status: 409 })
  }
  if (booking.totalPence <= 0) {
    return NextResponse.json({ error: "This reservation has no payable amount." }, { status: 409 })
  }

  const intentsLib = await loadIntentsLib()
  const usingLib = !!intentsLib?.createPaymentRecord && !!intentsLib?.buildPaymentIntentParams

  try {
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia" as const,
    })

    // ── Saved cards: when a logged-in user is paying, attach their Stripe
    // Customer + a CustomerSession so the Payment Element shows their saved
    // cards and can save new ones. Anonymous guests skip this (one-off PI).
    let stripeCustomerId: string | null = null
    let customerSessionSecret: string | null = null
    try {
      const { data: { user } } = await (await createClient()).auth.getUser()
      if (user) {
        stripeCustomerId = await resolveStripeCustomer(stripe, { id: user.id, email: user.email })
        if (stripeCustomerId) {
          customerSessionSecret = await createCustomerSessionSecret(stripe, stripeCustomerId)
        }
      }
    } catch {
      /* anon / auth unavailable — proceed as a guest one-off */
    }

    // ── Idempotency: find an existing open payment + its intent ─────────────
    let paymentId: string | null = null
    let existingIntentId: string | null = null

    if (usingLib && intentsLib?.getPayment) {
      // The lib's getPayment is BY PAYMENT ID; we don't have one yet, so query
      // escrow_payments by booking_id directly for the open record (tolerant).
      try {
        const { data, error } = await supabase
          .from("escrow_payments")
          .select("id, stripe_payment_intent_id, status")
          .eq("booking_id", booking.id)
          .in("status", ["requires_payment", "processing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        if (error && isMissing(error)) throw error
        if (data) {
          paymentId = (data as { id: string }).id
          existingIntentId = (data as { stripe_payment_intent_id: string | null }).stripe_payment_intent_id
        }
      } catch (err) {
        if (isMissing(err)) {
          return NextResponse.json({ error: "Payments are not available yet.", ready: false }, { status: 503 })
        }
      }
    } else {
      try {
        const open = await fallbackFindOpenPayment(supabase, booking.id)
        if (open) {
          paymentId = open.id
          existingIntentId = open.intentId
        }
      } catch (err) {
        if (isMissing(err)) {
          return NextResponse.json({ error: "Payments are not available yet.", ready: false }, { status: 503 })
        }
      }
    }

    // Reuse the live intent when present + still open.
    if (existingIntentId) {
      const intent = await stripe.paymentIntents.retrieve(existingIntentId)
      if (intent && intent.status !== "canceled" && intent.status !== "succeeded") {
        return NextResponse.json({
          clientSecret: intent.client_secret,
          paymentId,
          amountPence: booking.totalPence,
          currency: booking.currency,
          customerSessionSecret,
        })
      }
      // else fall through to mint a fresh intent + record
    }

    // ── Resolve fee breakdown (for escrow record + intent metadata) ─────────
    const feesLib = await loadFeesLib()
    let fee = { platformFeePence: 0, sellerPayoutPence: booking.totalPence, providerFeePence: 0, appliedRuleId: null as string | null }
    if (feesLib?.calculateMarketplaceFee) {
      try {
        fee = await feesLib.calculateMarketplaceFee({
          supabase,
          countryCode: booking.countryCode ?? "GB",
          transactionType: "stay_booking",
          grossPence: booking.totalPence,
        })
      } catch {
        /* keep the zero-fee fallback */
      }
    }

    // ── Create the payment record (requires_payment) ────────────────────────
    if (!paymentId) {
      if (usingLib && intentsLib?.createPaymentRecord) {
        try {
          const rec = await intentsLib.createPaymentRecord(supabase, {
            workspaceId: booking.workspaceId,
            amountPence: booking.totalPence,
            currency: booking.currency,
            platformFeePence: fee.platformFeePence,
            bookingId: booking.id,
            payerEmail: booking.guestEmail,
            escrow: true,
            releaseCondition: "stay_completed",
          })
          paymentId = rec?.id ?? null
        } catch (err) {
          if (isMissing(err)) {
            return NextResponse.json({ error: "Payments are not available yet.", ready: false }, { status: 503 })
          }
        }
      } else {
        try {
          paymentId = await fallbackCreatePayment(supabase, booking)
        } catch (err) {
          if (isMissing(err)) {
            return NextResponse.json({ error: "Payments are not available yet.", ready: false }, { status: 503 })
          }
        }
      }
    }

    // ── Build intent params (manual capture / escrow) + create the intent ───
    let params: Record<string, unknown>
    if (usingLib && intentsLib?.buildPaymentIntentParams) {
      params = intentsLib.buildPaymentIntentParams({
        amountPence: booking.totalPence,
        currency: booking.currency,
        fee,
        escrow: true,
        bookingId: booking.id,
        payerEmail: booking.guestEmail,
        ...(paymentId ? { paymentId } : {}),
        metadata: { kind: "stay_booking" },
      })
    } else {
      // Documented inline fallback: manual-capture escrow intent.
      params = {
        amount: booking.totalPence,
        currency: (booking.currency || "GBP").toLowerCase(),
        capture_method: "manual",
        description: booking.listingTitle ? `Stay booking · ${booking.listingTitle}` : "Stay booking",
        ...(booking.guestEmail ? { receipt_email: booking.guestEmail } : {}),
        metadata: {
          booking_id: booking.id,
          workspace_id: booking.workspaceId,
          kind: "stay_booking",
          escrow: "true",
          ...(paymentId ? { payment_id: paymentId } : {}),
        },
      }
    }

    const intent = await stripe.paymentIntents.create({
      ...(params as unknown as Stripe.PaymentIntentCreateParams),
      // Logged-in user → attach their Customer + save the card for next time.
      ...(stripeCustomerId
        ? { customer: stripeCustomerId, setup_future_usage: "off_session" as const }
        : {}),
      automatic_payment_methods: { enabled: true },
    })

    // ── Link the intent back to the payment record ──────────────────────────
    if (paymentId) {
      if (usingLib && intentsLib?.linkStripeIntent) {
        try {
          await intentsLib.linkStripeIntent(supabase, paymentId, intent.id)
        } catch {
          /* webhook reconciles */
        }
      } else {
        await fallbackLinkIntent(supabase, paymentId, intent.id)
      }
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentId,
      amountPence: booking.totalPence,
      currency: booking.currency,
      customerSessionSecret,
    })
  } catch (err) {
    console.error("[payments/intent]", err)
    return NextResponse.json({ error: "We couldn't start the payment. Please try again." }, { status: 500 })
  }
}
