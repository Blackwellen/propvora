// OAuth callback for Xero. Receives the authorisation code and exchanges it
// for access + refresh tokens. Stores them in workspace_integrations.
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return Response.json({ error: `Xero authorisation denied: ${error}` }, { status: 400 })
  }
  if (!code) {
    return Response.json({ error: "No authorisation code received from Xero." }, { status: 400 })
  }

  const clientId = process.env.XERO_CLIENT_ID
  const clientSecret = process.env.XERO_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return Response.json(
      { error: "Xero OAuth not configured. Token exchange requires XERO_CLIENT_ID and XERO_CLIENT_SECRET." },
      { status: 503 },
    )
  }

  // TODO: exchange `code` for tokens when Xero app is registered in https://developer.xero.com
  // POST https://identity.xero.com/connect/token with:
  //   grant_type=authorization_code, code, redirect_uri, client_id, client_secret
  // Then store { access_token, refresh_token, expires_in } in workspace_integrations.oauth_tokens

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return Response.redirect(`${appUrl}/property-manager/automations?integration=xero&status=pending_token_exchange`)
}
