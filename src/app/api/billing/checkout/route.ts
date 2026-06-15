import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Billing not configured" },
      { status: 503 }
    )
  }

  try {
    // Authenticate the user via the session cookie
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Parse request body
    let priceId: string | undefined
    try {
      const body = await request.json()
      priceId = body?.priceId
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 })
    }

    // Fetch the user's current workspace
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()

    const wsId = profile?.current_workspace_id
    if (!wsId) {
      return NextResponse.json(
        { error: "No workspace found for this user" },
        { status: 404 }
      )
    }

    const adminClient = createAdminClient()

    const { data: workspace } = await adminClient
      .from("workspaces")
      .select("id, name, stripe_customer_id")
      .eq("id", wsId)
      .maybeSingle()

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Lazy-import Stripe to avoid breaking the app when the env var is absent
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia" as const,
    })

    // Create or retrieve the Stripe customer for this workspace
    let customerId = workspace.stripe_customer_id ?? undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: workspace.name,
        metadata: {
          workspace_id: wsId,
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Persist the new customer ID on the workspace
      await adminClient
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("id", wsId)
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/app/workspace-settings/billing?checkout=success`,
      cancel_url: `${appUrl}/app/workspace-settings/billing?checkout=cancelled`,
      subscription_data: {
        metadata: {
          workspace_id: wsId,
        },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[billing/checkout]", err)
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    )
  }
}
