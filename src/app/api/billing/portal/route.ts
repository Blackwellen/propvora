import { NextResponse } from "next/server"
import { stripeSecretKey } from "@/lib/payments/stripe-keys"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/billing/portal — open the Stripe customer billing portal.
// Auth via session cookie only; no request body.
export async function POST() {
  const secretKey = stripeSecretKey()
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY to enable billing portal." },
      { status: 503 }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia" as const })

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()
    const wsId = profile?.current_workspace_id
    if (!wsId) {
      return NextResponse.json({ error: "No workspace selected." }, { status: 404 })
    }

    // Read + persist the customer with the service-role client so it is
    // authoritative and never RLS-blocked (the caller is already authenticated
    // and wsId comes from their own profile).
    const admin = createAdminClient()
    const { data: ws } = await admin
      .from("workspaces")
      .select("name, stripe_customer_id")
      .eq("id", wsId)
      .maybeSingle()

    let customerId = ws?.stripe_customer_id ?? undefined

    // Validate the stored customer exists on THIS Stripe account. A customer id
    // created under test mode is "No such customer" under a live key (and vice
    // versa) — when that happens we recreate a customer on the active account so
    // the portal always opens instead of 500-ing.
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId)
        if ((existing as { deleted?: boolean }).deleted) customerId = undefined
      } catch {
        customerId = undefined
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: ws?.name ?? undefined,
        metadata: { workspace_id: wsId },
      })
      customerId = customer.id
      await admin.from("workspaces").update({ stripe_customer_id: customerId }).eq("id", wsId)
    }

    // Always return to the PRODUCTION app. Prefer the app/site URL env (which is
    // https://propvora.com in prod) over STRIPE_PORTAL_RETURN_URL, which has been
    // observed pointing at a stale staging host.
    const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")
    const returnUrl = base
      ? `${base}/property-manager/workspace/billing/renewals`
      : process.env.STRIPE_PORTAL_RETURN_URL ??
        "https://www.propvora.com/property-manager/workspace/billing/renewals"

    const configurationId = process.env.STRIPE_PORTAL_CONFIGURATION_ID

    let session
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
        ...(configurationId ? { configuration: configurationId } : {}),
      })
    } catch (cfgErr) {
      // A bad/foreign configuration id must not block the portal — retry with the
      // account's default customer-portal configuration.
      if (configurationId) {
        session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        })
      } else {
        throw cfgErr
      }
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[billing/portal]", err)
    const message = err instanceof Error ? err.message : "Failed to create billing portal session."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
