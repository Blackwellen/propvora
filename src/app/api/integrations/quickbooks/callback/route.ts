import { parseOAuthState, exchangeCodeBasicAuth, storeTokens, oauthErrorRedirect, oauthSuccessRedirect } from "@/lib/integrations/oauth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const realmId = searchParams.get("realmId") // QuickBooks company ID
  const error = searchParams.get("error")

  if (error) return oauthErrorRedirect(appUrl, "quickbooks", error)
  if (!code || !state) return oauthErrorRedirect(appUrl, "quickbooks", "missing_code_or_state")

  const parsed = parseOAuthState(state)
  if (!parsed) return oauthErrorRedirect(appUrl, "quickbooks", "invalid_state")

  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
  if (!clientId || !clientSecret) return oauthErrorRedirect(appUrl, "quickbooks", "not_configured")

  try {
    const tokens = await exchangeCodeBasicAuth({
      tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      code,
      redirectUri: `${appUrl}/api/integrations/quickbooks/callback`,
      clientId,
      clientSecret,
    })

    await storeTokens({
      workspaceId: parsed.workspaceId,
      provider: "quickbooks",
      category: "accounting",
      name: `QuickBooks Online${realmId ? ` — ${realmId}` : ""}`,
      tokens: { ...tokens, extra: { realmId } },
      accountLabel: realmId ?? "QuickBooks",
    })

    return oauthSuccessRedirect(appUrl, "quickbooks")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error"
    return oauthErrorRedirect(appUrl, "quickbooks", msg)
  }
}
