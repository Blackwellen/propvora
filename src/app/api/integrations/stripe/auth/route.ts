// OAuth initiation for Stripe Connect. Redirects to Stripe's authorisation
// page when STRIPE_CLIENT_ID is configured, or returns 503 if not set.
export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.STRIPE_CLIENT_ID
  if (!clientId) {
    return Response.json(
      { error: "Stripe Connect not configured. Set STRIPE_CLIENT_ID in your environment variables." },
      { status: 503 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    redirect_uri: `${appUrl}/api/integrations/stripe/callback`,
    state: crypto.randomUUID(),
  })

  return Response.redirect(`https://connect.stripe.com/oauth/authorize?${params.toString()}`)
}
