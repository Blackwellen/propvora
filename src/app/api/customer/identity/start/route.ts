import { NextResponse } from "next/server"
import type StripeNS from "stripe"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripeSecretKey } from "@/lib/payments/stripe-keys"
import { startVerification, buildVerificationSessionParams, linkProviderRef } from "@/lib/identity"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/customer/identity/start
 *
 * Starts a real automated KYC flow for the signed-in customer via Stripe Identity:
 *   1. records an `identity_verifications` row (subject_type 'user'),
 *   2. mints a Stripe Identity VerificationSession (document + selfie + liveness),
 *   3. links the session id back to the row (status → processing),
 *   4. returns the hosted `url` to redirect the customer to.
 *
 * The webhook (`/api/webhooks/stripe`, identity.verification_session.*) flips the
 * row to verified/rejected — KYC is never auto-approved here. Degrades to 503 if
 * Stripe (or Stripe Identity on the account) isn't available.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const secret = stripeSecretKey()
  if (!secret) {
    return NextResponse.json({ error: "Identity verification isn't available right now.", notReady: true }, { status: 503 })
  }

  // Resolve the customer's workspace (best-effort; the subject is the user).
  let workspaceId: string | null = null
  try {
    const { data } = await supabase
      .from("customer_workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
    workspaceId = (data as { workspace_id?: string } | null)?.workspace_id ?? null
  } catch { workspaceId = null }

  const admin = createAdminClient()

  // 1) Record the verification row (service role — this table is admin/webhook governed).
  let verificationId: string
  try {
    const row = await startVerification(admin, {
      subjectType: "user",
      subjectId: user.id,
      workspaceId,
      kind: "individual",
      provider: "stripe_identity",
      createdBy: user.id,
    })
    verificationId = row.id
  } catch {
    return NextResponse.json({ error: "Could not start verification." }, { status: 503 })
  }

  // 2) Mint the Stripe Identity session.
  try {
    const origin = new URL(request.url).origin
    const params = buildVerificationSessionParams({
      verificationId,
      subjectId: user.id,
      email: user.email ?? null,
      workspaceId,
      requireSelfie: true,
    })
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(secret, { apiVersion: "2026-05-27.dahlia" as const })
    const session = await stripe.identity.verificationSessions.create({
      ...(params as unknown as StripeNS.Identity.VerificationSessionCreateParams),
      return_url: `${origin}/customer/account-settings?tab=security&kyc=complete`,
    })

    // 3) Link the provider session id (moves the row to processing).
    try { await linkProviderRef(admin, verificationId, session.id) } catch { /* non-fatal */ }

    return NextResponse.json({ url: session.url ?? null, status: "processing", verificationId })
  } catch (e) {
    // Most commonly: Stripe Identity isn't enabled on the account.
    console.error("[customer/identity/start]", e)
    return NextResponse.json(
      { error: "Identity verification isn't enabled yet. Please try again later.", notReady: true },
      { status: 503 }
    )
  }
}
