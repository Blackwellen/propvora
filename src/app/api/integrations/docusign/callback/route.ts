import { parseOAuthState, storeTokens, oauthErrorRedirect, oauthSuccessRedirect } from "@/lib/integrations/oauth"
import { Buffer } from "buffer"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) return oauthErrorRedirect(appUrl, "docusign", error)
  if (!code || !state) return oauthErrorRedirect(appUrl, "docusign", "missing_code_or_state")

  const parsed = parseOAuthState(state)
  if (!parsed) return oauthErrorRedirect(appUrl, "docusign", "invalid_state")

  const clientId = process.env.DOCUSIGN_CLIENT_ID
  const clientSecret = process.env.DOCUSIGN_CLIENT_SECRET
  if (!clientId || !clientSecret) return oauthErrorRedirect(appUrl, "docusign", "not_configured")

  const baseUrl = process.env.DOCUSIGN_ENV === "sandbox"
    ? "https://account-d.docusign.com"
    : "https://account.docusign.com"

  try {
    // DocuSign uses Basic auth for token exchange
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/integrations/docusign/callback`,
    })
    const res = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`DocuSign token exchange failed: ${text}`)
    }
    const tokens = await res.json() as {
      access_token: string
      refresh_token?: string
      expires_in?: number
      token_type?: string
    }

    // Get account info for display label
    let accountLabel = "DocuSign"
    try {
      const userRes = await fetch(`${baseUrl}/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (userRes.ok) {
        const user = await userRes.json() as { name?: string; email?: string; accounts?: Array<{ account_name?: string }> }
        accountLabel = user.accounts?.[0]?.account_name ?? user.name ?? user.email ?? "DocuSign"
      }
    } catch { /* non-critical */ }

    await storeTokens({
      workspaceId: parsed.workspaceId,
      provider: "docusign",
      category: "communications",
      name: `DocuSign — ${accountLabel}`,
      tokens,
      accountLabel,
    })

    return oauthSuccessRedirect(appUrl, "docusign")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error"
    return oauthErrorRedirect(appUrl, "docusign", msg)
  }
}
