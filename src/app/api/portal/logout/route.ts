import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  PORTAL_COOKIE_NAME,
  readPortalSessionToken,
  sha256,
  portalCookieOptions,
} from "@/lib/portal/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/portal/logout
// Marks the current portal_sessions row revoked and clears the cookie.
// Idempotent and fail-safe: even if the DB update fails we still clear the
// cookie so the browser cannot present the session again.
export async function POST(req: NextRequest) {
  const token = await readPortalSessionToken()
  if (token) {
    try {
      const admin = createAdminClient()
      await admin
        .from("portal_sessions")
        .update({ revoked: true })
        .eq("session_token_hash", sha256(token))
    } catch {
      /* tolerate — cookie clear below still logs the user out */
    }
  }

  const res = NextResponse.redirect(new URL("/portal/login", req.url), { status: 303 })
  // Expire the cookie immediately.
  res.cookies.set(PORTAL_COOKIE_NAME, "", { ...portalCookieOptions(0), maxAge: 0 })
  return res
}
