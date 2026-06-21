// OAuth callback for Google Drive. Exchanges the authorisation code
// for access and refresh tokens, then stores them.
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return Response.json({ error: `Google authorisation denied: ${error}` }, { status: 400 })
  }
  if (!code) {
    return Response.json({ error: "No authorisation code received from Google." }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return Response.json({ error: "Google OAuth not fully configured." }, { status: 503 })
  }

  // TODO: exchange code for tokens
  // POST https://oauth2.googleapis.com/token with:
  //   code, client_id, client_secret, redirect_uri, grant_type=authorization_code
  // Returns: { access_token, refresh_token, expires_in }
  // Store in workspace_integrations.oauth_tokens

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return Response.redirect(`${appUrl}/property-manager/automations?integration=google_drive&status=pending_token_exchange`)
}
