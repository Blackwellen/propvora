import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCustomerStripe, ensureCustomerStripeId } from "@/lib/customer/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/customer/lets/rent-payment
 *   { action: "create", scheduleId }  → returns a Stripe Checkout url for the rent due
 *   { action: "confirm", sessionId }  → verifies the session paid, marks the schedule
 *                                        paid and records the payment (idempotent)
 *
 * Rent is paid via a Stripe Checkout Session (hosted card entry). On the success
 * return the client calls "confirm", which retrieves the session and, if paid,
 * settles the schedule + writes a customer_tenancy_rent_payments row.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { action?: string; scheduleId?: string; sessionId?: string } | null
  const action = body?.action

  const stripe = await getCustomerStripe()
  if (!stripe) return NextResponse.json({ error: "Payments aren't available right now." }, { status: 503 })

  // ── Create a Checkout Session for one scheduled rent payment ────────────────
  if (action === "create") {
    const scheduleId = body?.scheduleId?.trim()
    if (!scheduleId) return NextResponse.json({ error: "scheduleId is required" }, { status: 400 })
    try {
      const { data: sched } = await supabase
        .from("customer_tenancy_rent_schedule")
        .select("id, customer_tenancy_id, amount_pence, payment_status")
        .eq("id", scheduleId)
        .eq("customer_id", user.id)
        .maybeSingle()
      const s = sched as { id: string; customer_tenancy_id: string; amount_pence: number | null; payment_status: string | null } | null
      if (!s) return NextResponse.json({ error: "Rent item not found." }, { status: 404 })
      if ((s.payment_status ?? "").toLowerCase() === "paid") return NextResponse.json({ error: "This rent is already paid." }, { status: 409 })

      const customerId = await ensureCustomerStripeId(stripe, user.id, user.email ?? null)
      const origin = new URL(req.url).origin
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [{
          quantity: 1,
          price_data: { currency: "gbp", unit_amount: s.amount_pence ?? 0, product_data: { name: "Rent payment" } },
        }],
        metadata: { kind: "customer_rent", scheduleId: s.id, tenancyId: s.customer_tenancy_id, customerUserId: user.id },
        success_url: `${origin}/customer/lets/tenancies/${s.customer_tenancy_id}/rent-payments?paid={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/customer/lets/tenancies/${s.customer_tenancy_id}/rent-payments`,
      })
      return NextResponse.json({ url: session.url })
    } catch (e) {
      console.error("[lets/rent-payment create]", e)
      return NextResponse.json({ error: "Could not start the payment." }, { status: 502 })
    }
  }

  // ── Verify a completed session and settle the schedule ──────────────────────
  if (action === "confirm") {
    const sessionId = body?.sessionId?.trim()
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (session.payment_status !== "paid") return NextResponse.json({ ok: false, paid: false })
      const md = session.metadata ?? {}
      if (md.customerUserId !== user.id || md.kind !== "customer_rent") {
        return NextResponse.json({ error: "Not your payment." }, { status: 403 })
      }
      const scheduleId = md.scheduleId
      const tenancyId = md.tenancyId
      const ref = typeof session.payment_intent === "string" ? session.payment_intent : session.id

      // Idempotent: skip if already recorded.
      const { data: existing } = await supabase
        .from("customer_tenancy_rent_payments")
        .select("id").eq("provider_ref", ref).maybeSingle()
      if (!existing) {
        await supabase.from("customer_tenancy_rent_schedule")
          .update({ payment_status: "paid", updated_by: user.id })
          .eq("id", scheduleId).eq("customer_id", user.id)
        await supabase.from("customer_tenancy_rent_payments").insert({
          customer_id: user.id,
          customer_tenancy_id: tenancyId,
          schedule_id: scheduleId,
          amount_pence: session.amount_total ?? 0,
          paid_at: new Date().toISOString(),
          payment_status: "paid",
          provider: "stripe",
          provider_ref: ref,
          status: "active",
          created_by: user.id,
        })
      }
      return NextResponse.json({ ok: true, paid: true })
    } catch (e) {
      console.error("[lets/rent-payment confirm]", e)
      return NextResponse.json({ error: "Could not confirm the payment." }, { status: 502 })
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 })
}
