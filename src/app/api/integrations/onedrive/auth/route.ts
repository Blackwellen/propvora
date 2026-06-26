import { createOAuthState, resolveWorkspaceId } from "@/lib/integrations/oauth"

export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const tenantId = process.env.MICROSOFT_TENANT_ID ?? "common"
  if (!clientId) {
    return Response.json(
      { error: "Microsoft OAuth not configured. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to your environment variables." },
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
    redirect_uri: `${appUrl}/api/integrations/onedrive/callback`,
    scope: "offline_access Files.ReadWrite.All User.Read",
    response_mode: "query",
    state,
  })

  return Response.redirect(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`,
  )
}
