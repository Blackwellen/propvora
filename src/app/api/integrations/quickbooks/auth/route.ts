import { createOAuthState, resolveWorkspaceId } from "@/lib/integrations/oauth"

export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  if (!clientId) {
    return Response.json(
      { error: "QuickBooks OAuth not configured. Add QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET to your environment variables." },
      { status: 503 },
    )
  }

  const workspaceId = await resolveWorkspaceId()
  if (!workspaceId) return Response.json({ error: "Not authenticated." }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const state = createOAuthState(workspaceId)

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${appUrl}/api/integrations/quickbooks/callback`,
    scope: "com.intuit.quickbooks.accounting",
    state,
  })

  return Response.redirect(`https://appcenter.intuit.com/connect/oauth2?${params.toString()}`)
}
