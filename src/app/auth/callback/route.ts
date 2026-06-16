import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { recordCoreAcceptances } from "@/lib/legal/acceptance"
import { bootstrapCustomerWorkspace } from "@/lib/actions/workspace"

const ALLOWED_REDIRECTS = ["/app", "/admin", "/supplier-portal", "/affiliate", "/onboarding", "/customer", "/supplier"]

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
  const intent = searchParams.get("intent")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // ── Legal-acceptance logging ──────────────────────────────────────────────
  // The register form requires ticking "I agree to the Terms & Privacy Policy"
  // before signup. This callback fires when the verification link is opened —
  // the first server-side moment we have an authenticated session — so we record
  // acceptance of the current Terms + Privacy versions here. Idempotent on
  // (user, document, version), so re-opening the link never duplicates. Best-
  // effort: never block the redirect on a logging failure.
  try {
    const {
      data: { user: acceptingUser },
    } = await supabase.auth.getUser()
    if (acceptingUser) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip")?.trim() ||
        null
      await recordCoreAcceptances(supabase, acceptingUser.id, {
        context: "signup",
        ip,
        userAgent: request.headers.get("user-agent"),
      })
    }
  } catch {
    /* non-fatal — acceptance logging must never block account verification */
  }

  // If the link carried an invite token, send them to accept it.
  if (inviteToken) {
    return NextResponse.redirect(`${origin}/invite/${encodeURIComponent(inviteToken)}`)
  }

  // Customer intent: bootstrap a customer workspace (no wizard) → /customer.
  if (intent === "customer") {
    try {
      await bootstrapCustomerWorkspace()
    } catch {
      // Non-fatal — they can create a workspace later.
    }
    return NextResponse.redirect(`${origin}/customer`)
  }

  // Supplier intent: send them through the supplier onboarding wizard.
  if (intent === "supplier") {
    return NextResponse.redirect(`${origin}/onboarding/supplier`)
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
