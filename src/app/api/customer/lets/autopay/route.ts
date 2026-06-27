import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCustomerStripe, ensureCustomerStripeId } from "@/lib/customer/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Rent autopay mandates — customer_autopay_mandates (RLS owner-scoped).
 *
 *   GET  ?tenancyId=…                       → { enabled }
 *   POST { tenancyId, enable, amountPence } → toggles a monthly mandate against the
 *                                             customer's default saved card. If they
 *                                             have no card → { needsCard: true }.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const tenancyId = new URL(req.url).searchParams.get("tenancyId")
  if (!tenancyId) return NextResponse.json({ enabled: false })
  try {
    const { data } = await supabase
      .from("customer_autopay_mandates")
      .select("id").eq("tenancy_id", tenancyId).eq("customer_id", user.id).eq("status", "active").maybeSingle()
    return NextResponse.json({ enabled: Boolean(data) })
  } catch {
    return NextResponse.json({ enabled: false })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { tenancyId?: string; enable?: boolean; amountPence?: number; nextRunOn?: string } | null
  const tenancyId = body?.tenancyId?.trim()
  if (!tenancyId) return NextResponse.json({ error: "tenancyId is required" }, { status: 400 })

  // Disable: cancel any active mandates for this tenancy.
  if (body?.enable === false) {
    try {
      await supabase.from("customer_autopay_mandates")
        .update({ status: "cancelled", updated_by: user.id })
        .eq("tenancy_id", tenancyId).eq("customer_id", user.id).eq("status", "active")
      return NextResponse.json({ ok: true, enabled: false })
    } catch {
      return NextResponse.json({ error: "Could not turn off autopay." }, { status: 500 })
    }
  }

  // Enable: requires a saved card.
  const stripe = await getCustomerStripe()
  if (!stripe) return NextResponse.json({ error: "Autopay isn't available right now." }, { status: 503 })
  try {
    const customerId = await ensureCustomerStripeId(stripe, user.id, user.email ?? null)
    const pms = await stripe.paymentMethods.list({ customer: customerId, type: "card" })
    const pm = pms.data[0]
    if (!pm) return NextResponse.json({ needsCard: true })

    // Don't double-create.
    const { data: existing } = await supabase
      .from("customer_autopay_mandates")
      .select("id").eq("tenancy_id", tenancyId).eq("customer_id", user.id).eq("status", "active").maybeSingle()
    if (existing) return NextResponse.json({ ok: true, enabled: true })

    await supabase.from("customer_autopay_mandates").insert({
      customer_id: user.id,
      tenancy_id: tenancyId,
      provider: "stripe",
      provider_ref: pm.id,
      amount_pence: typeof body?.amountPence === "number" ? body.amountPence : null,
      currency: "GBP",
      cadence: "monthly",
      next_run_on: typeof body?.nextRunOn === "string" ? body.nextRunOn : null,
      status: "active",
      created_by: user.id,
    })
    return NextResponse.json({ ok: true, enabled: true })
  } catch (e) {
    console.error("[lets/autopay]", e)
    return NextResponse.json({ error: "Could not set up autopay." }, { status: 502 })
  }
}
