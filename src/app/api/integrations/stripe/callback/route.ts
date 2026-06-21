// OAuth callback for Stripe Connect. Exchanges the code for the connected
// account's access token and stores it in workspace_integrations.
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return Response.json({ error: `Stripe authorisation denied: ${error}` }, { status: 400 })
  }
  if (!code) {
    return Response.json({ error: "No authorisation code received from Stripe." }, { status: 400 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return Response.json({ error: "Stripe secret key not configured." }, { status: 503 })
  }

  // TODO: exchange code for access_token
  // POST https://connect.stripe.com/oauth/token with:
  //   grant_type=authorization_code, code, client_secret=STRIPE_SECRET_KEY
  // Returns: { access_token, stripe_user_id, refresh_token, ... }
  // Store in workspace_integrations.oauth_tokens

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return Response.redirect(`${appUrl}/property-manager/automations?integration=stripe&status=pending_token_exchange`)
}
