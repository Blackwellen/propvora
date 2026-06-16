import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { createMarketplaceTransaction } from "@/lib/marketplace/transactions"
import { transactionTypeForListing, type ListingType } from "@/lib/marketplace/types"
import type { MarketplaceTransactionType } from "@/lib/marketplace/fees"
import { buildPaymentIntentParams, createPaymentRecord, linkStripeIntent } from "@/lib/payments/intents"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/marketplace/checkout — the REAL marketplace checkout.

   Flow (server-authoritative; the client NEVER sends an amount):
     1. Authenticate the caller.
     2. Resolve the listing (must be published/active + payments enabled) and
        the buyer workspace; verify the caller is a member of it.
     3. Compute the gross from the listing's base_price_pence (× quantity), in
        integer pence — recomputed server-side, never trusted from the client.
     4. Create the marketplace transaction via the kernel (transaction header +
        commission ledger + order, with the DB-driven fee split).
     5. Create an escrow_payments record (requires_payment) + escrow hold, then
        create a MANUAL-CAPTURE (escrow) Stripe PaymentIntent and link it.
     6. Return { orderId, transactionId, clientSecret, amountPence, currency, fee }.

   Escrow: capture_method='manual' — funds are authorised + HELD; capture/release
   is webhook/operator-driven elsewhere. This route does NOT confirm or capture a
   payment, so it never executes a live charge.
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "42703", "PGRST202", "PGRST204", "PGRST205"])
function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned/i.test(e.message ?? "")
}

type SB = Awaited<ReturnType<typeof createClient>>

async function isWorkspaceMember(supabase: SB, workspaceId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return Boolean(data)
}

interface ListingForCheckout {
  id: string
  workspaceId: string
  title: string | null
  listingType: string | null
  transactionType: string | null
  category: string | null
  countryCode: string | null
  currency: string
  basePricePence: number | null
  status: string
  paymentsEnabled: boolean
  holdsEnabled: boolean
}

async function loadListing(supabase: SB, listingId: string): Promise<ListingForCheckout | "missing" | null> {
  try {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select(
        "id, workspace_id, title, listing_type, transaction_type, category, country_code, currency, base_price_pence, status, payments_enabled, holds_enabled"
      )
      .eq("id", listingId)
      .maybeSingle()
    if (error) {
      if (isMissing(error)) return "missing"
      return null
    }
    if (!data) return null
    const r = data as Record<string, unknown>
    return {
      id: String(r.id),
      workspaceId: String(r.workspace_id),
      title: (r.title as string | null) ?? null,
      listingType: (r.listing_type as string | null) ?? null,
      transactionType: (r.transaction_type as string | null) ?? null,
      category: (r.category as string | null) ?? null,
      countryCode: (r.country_code as string | null) ?? null,
      currency: (r.currency as string) || "GBP",
      basePricePence: r.base_price_pence == null ? null : Number(r.base_price_pence),
      status: (r.status as string) || "draft",
      paymentsEnabled: r.payments_enabled !== false,
      holdsEnabled: r.holds_enabled !== false,
    }
  } catch (err) {
    if (isMissing(err)) return "missing"
    return null
  }
}

/** Resolve the fee-bearing transaction type for a listing (explicit → derived). */
function resolveTransactionType(listing: ListingForCheckout): MarketplaceTransactionType {
  if (listing.transactionType) return listing.transactionType as MarketplaceTransactionType
  if (listing.listingType) return transactionTypeForListing(listing.listingType as ListingType)
  return "supplier_job"
}

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    }

    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : ""
    const buyerWorkspaceId =
      typeof body.buyerWorkspaceId === "string" ? body.buyerWorkspaceId.trim() : ""
    const quantityRaw = Number(body.quantity ?? 1)
    const quantity = Number.isFinite(quantityRaw) && quantityRaw >= 1 ? Math.trunc(quantityRaw) : 1

    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    if (!buyerWorkspaceId) {
      return NextResponse.json({ error: "buyerWorkspaceId is required" }, { status: 400 })
    }

    // Membership FIRST — never reveal listing/pricing to non-members of the buyer ws.
    if (!(await isWorkspaceMember(supabase, buyerWorkspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // Resolve the listing.
    const listing = await loadListing(supabase, listingId)
    if (listing === "missing") {
      return NextResponse.json({ error: "Marketplace is not available yet.", ready: false }, { status: 503 })
    }
    if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 })
    if (!["published", "active"].includes(listing.status)) {
      return NextResponse.json({ error: "This listing is not available for purchase." }, { status: 409 })
    }
    if (!listing.paymentsEnabled) {
      return NextResponse.json({ error: "This listing does not accept online payment." }, { status: 409 })
    }
    if (listing.workspaceId === buyerWorkspaceId) {
      return NextResponse.json({ error: "You cannot purchase your own listing." }, { status: 409 })
    }

    // Server-authoritative gross (integer pence). Never trust a client amount.
    const unitPence = listing.basePricePence ?? 0
    const grossPence = Math.max(0, Math.trunc(unitPence * quantity))
    if (grossPence <= 0) {
      return NextResponse.json({ error: "This listing has no payable price." }, { status: 409 })
    }

    const transactionType = resolveTransactionType(listing)
    const currency = listing.currency || "GBP"
    const countryCode = listing.countryCode ?? "GB"

    // ── Create the transaction via the kernel (txn + ledger + order + fees) ──
    const kernel = await createMarketplaceTransaction({
      supabase,
      buyerWorkspaceId,
      sellerWorkspaceId: listing.workspaceId,
      listingId: listing.id,
      transactionType,
      grossPence,
      countryCode,
      category: listing.category ?? undefined,
      currency,
      orderTitle: listing.title ?? `Order · ${transactionType}`,
      metadata: { source: "marketplace_checkout", quantity },
    })
    if (kernel.error && !kernel.data) {
      if (kernel.error === "marketplace_unavailable") {
        return NextResponse.json({ error: "Marketplace is not available yet.", ready: false }, { status: 503 })
      }
      return NextResponse.json({ error: "Could not create the order.", detail: kernel.error }, { status: 502 })
    }
    const result = kernel.data!
    const fee = result.fee
    const transactionId = result.transaction.id
    const orderId = result.order?.id ?? null

    // ── Payments: build the escrow record + manual-capture intent ───────────
    // If Stripe isn't configured the order/transaction still exist (escrow can be
    // attached later) — we return without a clientSecret rather than charging.
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        orderId,
        transactionId,
        clientSecret: null,
        amountPence: grossPence,
        currency,
        fee,
        ready: false,
        message: "Order created. Online payment is not configured yet.",
      })
    }

    let paymentId: string | null = null
    try {
      const payment = await createPaymentRecord(supabase, {
        workspaceId: buyerWorkspaceId,
        amountPence: grossPence,
        currency,
        platformFeePence: fee.platformFeePence,
        transactionId,
        payerEmail: user.email ?? null,
        escrow: listing.holdsEnabled,
        releaseCondition: "order_completed",
      })
      paymentId = payment.id
    } catch (err) {
      if (isMissing(err)) {
        // Payments schema not provisioned — order exists; return without secret.
        return NextResponse.json({
          orderId,
          transactionId,
          clientSecret: null,
          amountPence: grossPence,
          currency,
          fee,
          ready: false,
          message: "Order created. Payments are not provisioned yet.",
        })
      }
      throw err
    }

    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia" as const,
    })

    const params = buildPaymentIntentParams({
      amountPence: grossPence,
      currency,
      fee,
      escrow: listing.holdsEnabled,
      transactionId,
      payerEmail: user.email ?? null,
      ...(paymentId ? { paymentId } : {}),
      metadata: { kind: "marketplace_order", ...(orderId ? { order_id: orderId } : {}) },
    })

    const intent = await stripe.paymentIntents.create({
      ...(params as Stripe.PaymentIntentCreateParams),
      automatic_payment_methods: { enabled: true },
    })

    if (paymentId) {
      try {
        await linkStripeIntent(supabase, paymentId, intent.id)
      } catch {
        /* webhook reconciles authoritatively */
      }
    }

    return NextResponse.json({
      orderId,
      transactionId,
      paymentId,
      clientSecret: intent.client_secret,
      amountPence: grossPence,
      currency,
      fee,
    })
  } catch (err) {
    captureException(err, { source: "api/marketplace/checkout", requestId })
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again.", requestId },
      { status: 500 }
    )
  }
}
