// OAuth initiation for Microsoft Outlook / Microsoft 365 Calendar.
// Uses the Microsoft identity platform (Azure AD) OAuth 2.0 flow.
export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const tenantId = process.env.MICROSOFT_TENANT_ID ?? "common"
  if (!clientId) {
    return Response.json(
      { error: "Microsoft OAuth not configured. Set MICROSOFT_CLIENT_ID in your environment variables." },
      { status: 503 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${appUrl}/api/integrations/outlook/callback`,
    scope: "offline_access Calendars.ReadWrite User.Read",
    response_mode: "query",
    state: crypto.randomUUID(),
  })

  return Response.redirect(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`,
  )
}
