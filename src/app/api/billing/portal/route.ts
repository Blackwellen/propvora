import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// No request body required for this endpoint — auth is via session cookie only.
export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
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

    // Dynamically import Stripe so it doesn't break when env var is missing
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia" as "2026-05-27.dahlia",
    })

    // Get the stripe customer ID from the user's profile or workspace
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()

    const wsId = profile?.current_workspace_id
    let customerId: string | undefined

    if (wsId) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("stripe_customer_id")
        .eq("id", wsId)
        .maybeSingle()
      customerId = ws?.stripe_customer_id ?? undefined
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this workspace. Subscribe to a plan first." },
        { status: 404 }
      )
    }

    const returnUrl =
      process.env.STRIPE_PORTAL_RETURN_URL ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/app/workspace-settings/billing`

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[billing/portal]", err)
    return NextResponse.json({ error: "Failed to create billing portal session." }, { status: 500 })
  }
}
