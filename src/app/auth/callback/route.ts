import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ALLOWED_REDIRECTS = ["/app", "/admin", "/supplier-portal", "/affiliate", "/onboarding"]

function safeRedirect(url: string): string {
  return ALLOWED_REDIRECTS.some((allowed) => url.startsWith(allowed)) ? url : "/app"
}

/**
 * Supabase auth callback for email verification / magic links / OAuth.
 *
 * Register sends `emailRedirectTo` here. After exchanging the code for a
 * session we route the user to the right place:
 *   - no workspace membership  → /onboarding
 *   - has a workspace          → /app (or the requested `next`)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const explicitNext = searchParams.get("next")
  const inviteToken = searchParams.get("invite")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // If the link carried an invite token, send them to accept it.
  if (inviteToken) {
    return NextResponse.redirect(`${origin}/invite/${encodeURIComponent(inviteToken)}`)
  }

  // Explicit, allow-listed destination wins.
  if (explicitNext) {
    return NextResponse.redirect(`${origin}${safeRedirect(explicitNext)}`)
  }

  // Otherwise decide based on whether the user already has a workspace.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_workspace_id")
        .eq("id", user.id)
        .maybeSingle()

      if (profile?.current_workspace_id) {
        return NextResponse.redirect(`${origin}/app`)
      }

      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()

      if (membership?.workspace_id) {
        return NextResponse.redirect(`${origin}/app`)
      }

      return NextResponse.redirect(`${origin}/onboarding`)
    }
  } catch {
    // Fall through to default.
  }

  return NextResponse.redirect(`${origin}/app`)
}
