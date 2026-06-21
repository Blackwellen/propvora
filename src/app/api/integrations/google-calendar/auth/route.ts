// OAuth initiation for Google Calendar. Uses Google's OAuth 2.0 flow.
// Requires GOOGLE_CLIENT_ID to be set.
export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return Response.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID in your environment variables." },
      { status: 503 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${appUrl}/api/integrations/google-calendar/callback`,
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state: crypto.randomUUID(),
  })

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
