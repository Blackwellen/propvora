import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error — redirect to login with error message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
