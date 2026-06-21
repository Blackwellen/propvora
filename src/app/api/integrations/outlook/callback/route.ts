// OAuth callback for Microsoft Outlook / Microsoft 365.
// Exchanges the authorisation code for access and refresh tokens.
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return Response.json({ error: `Microsoft authorisation denied: ${error}` }, { status: 400 })
  }
  if (!code) {
    return Response.json({ error: "No authorisation code received from Microsoft." }, { status: 400 })
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  const tenantId = process.env.MICROSOFT_TENANT_ID ?? "common"
  if (!clientId || !clientSecret) {
    return Response.json({ error: "Microsoft OAuth not fully configured." }, { status: 503 })
  }

  // TODO: exchange code for tokens
  // POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token with:
  //   grant_type=authorization_code, code, client_id, client_secret, redirect_uri, scope
  // Returns: { access_token, refresh_token, expires_in }
  // Store in workspace_integrations.oauth_tokens

  void tenantId // used in token exchange URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return Response.redirect(`${appUrl}/property-manager/automations?integration=outlook&status=pending_token_exchange`)
}
