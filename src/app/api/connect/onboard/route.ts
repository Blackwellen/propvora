import { NextResponse } from "next/server"
import { stripeSecretKey } from "@/lib/payments/stripe-keys"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { connectEnabled, statusFromAccount } from "@/lib/billing/connect"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/connect/onboard — create (or resume) Stripe Connect Standard
 * onboarding for the caller's CURRENT workspace and return a hosted onboarding
 * URL. Owner-only. Feature-flagged. The connected account is the OWNER's own
 * Stripe account; Propvora never custodies these funds.
 */
export async function POST(request: NextRequest) {
  if (!connectEnabled()) {
    return NextResponse.json({ error: "Payments via your own Stripe account aren't enabled yet." }, { status: 403 })
  }
  const secretKey = stripeSecretKey()
  if (!secretKey) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = createAdminClient()

  // Resolve current workspace + verify the caller is its OWNER.
  const { data: profile } = await supabase
    .from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
  const wsId = profile?.current_workspace_id as string | undefined
  if (!wsId) return NextResponse.json({ error: "No workspace selected" }, { status: 404 })

  const { data: ws } = await admin
    .from("workspaces").select("id, name, owner_user_id").eq("id", wsId).maybeSingle()
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
  if (ws.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Only the workspace owner can connect a payout account." }, { status: 403 })
  }

  const Stripe = (await import("stripe")).default
  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-05-27.dahlia" as const,
  })

  // Reuse an existing connected account or create a new Standard one.
  const { data: existing } = await admin
    .from("stripe_connect_accounts").select("stripe_account_id").eq("workspace_id", wsId).maybeSingle()

  let accountId = existing?.stripe_account_id as string | undefined
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "standard",
      email: user.email ?? undefined,
      metadata: { workspace_id: wsId, owner_user_id: user.id },
    })
    accountId = account.id
    const s = statusFromAccount(account)
    await admin.from("stripe_connect_accounts").insert({
      workspace_id: wsId,
      stripe_account_id: accountId,
      account_type: "standard",
      status: s.status,
      charges_enabled: s.charges,
      payouts_enabled: s.payouts,
      details_submitted: s.details,
      country: account.country ?? null,
      created_by: user.id,
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/app/workspace-settings/billing?connect=refresh`,
    return_url: `${appUrl}/app/workspace-settings/billing?connect=done`,
    type: "account_onboarding",
  })

  return NextResponse.json({ url: link.url })
}
