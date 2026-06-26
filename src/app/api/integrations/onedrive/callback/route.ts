import { parseOAuthState, exchangeCodeBodyAuth, storeTokens, oauthErrorRedirect, oauthSuccessRedirect } from "@/lib/integrations/oauth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) return oauthErrorRedirect(appUrl, "onedrive", error)
  if (!code || !state) return oauthErrorRedirect(appUrl, "onedrive", "missing_code_or_state")

  const parsed = parseOAuthState(state)
  if (!parsed) return oauthErrorRedirect(appUrl, "onedrive", "invalid_state")

  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  const tenantId = process.env.MICROSOFT_TENANT_ID ?? "common"
  if (!clientId || !clientSecret) return oauthErrorRedirect(appUrl, "onedrive", "not_configured")

  try {
    const tokens = await exchangeCodeBodyAuth({
      tokenUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      code,
      redirectUri: `${appUrl}/api/integrations/onedrive/callback`,
      clientId,
      clientSecret,
      extraBody: { scope: "offline_access Files.ReadWrite.All User.Read" },
    })

    let accountLabel = "OneDrive"
    try {
      const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (meRes.ok) {
        const me = await meRes.json() as { mail?: string; userPrincipalName?: string }
        accountLabel = me.mail ?? me.userPrincipalName ?? "OneDrive"
      }
    } catch { /* non-critical */ }

    await storeTokens({
      workspaceId: parsed.workspaceId,
      provider: "onedrive",
      category: "storage",
      name: `OneDrive — ${accountLabel}`,
      tokens,
      accountLabel,
    })

    return oauthSuccessRedirect(appUrl, "onedrive")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error"
    return oauthErrorRedirect(appUrl, "onedrive", msg)
  }
}
