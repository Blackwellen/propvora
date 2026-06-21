import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"

const ALLOWED_REDIRECTS = ["/property-manager", "/user", "/supplier", "/app", "/admin", "/supplier-portal"]

function safeRedirect(url: string): string {
  return ALLOWED_REDIRECTS.some((allowed) => url.startsWith(allowed)) ? url : "/property-manager"
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeRedirect(searchParams.get("next") ?? "/property-manager")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // SEC-030: Audit log for successful OAuth/magic-link login.
      // Best-effort — never blocks the redirect.
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("current_workspace_id")
            .eq("id", user.id)
            .maybeSingle()
          const workspaceId = (profile?.current_workspace_id as string | null) ?? null
          await recordAudit(supabase, {
            workspaceId,
            userId: user.id,
            action: AUDIT_ACTIONS.AUTH_LOGIN,
            resourceType: "user",
            resourceId: user.id,
            metadata: { email: user.email, provider: "oauth_callback" },
          })
        }
      } catch {
        // Swallow — audit never blocks auth flow.
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error — redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
