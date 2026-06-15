import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { welcomeEmail } from "@/lib/emails/welcome"
import { rateLimit, clientKey, RATE_LIMITS } from "@/lib/rate-limit"

/**
 * POST /api/email/welcome
 *
 * Called client-side after a successful supabase.auth.signUp().
 * Sends a welcome email to the new user.
 *
 * Security: this endpoint is intentionally unauthenticated because it runs in
 * the brief window right after sign-up (before a confirmed session exists), so
 * it cannot require an authed session without breaking the welcome flow.
 * Instead it is protected by:
 *   - strict per-IP rate limiting (reuses the app's Supabase-backed limiter), to
 *     stop it being used as an open email-spam relay, and
 *   - tight input validation (well-formed email, bounded name lengths).
 *
 * Body: { email: string; userName?: string; workspaceName?: string }
 */

// Basic, conservative email shape check (defence-in-depth, not full RFC5322).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LEN = 254
const MAX_NAME_LEN = 200

export async function POST(request: NextRequest) {
  try {
    // Per-IP throttle FIRST — before any work — so the route can't be abused as
    // a spam relay. Uses the signup limit profile (5 / 10 min per IP).
    const rl = await rateLimit({
      key: clientKey(request, "email-welcome"),
      ...RATE_LIMITS.signup,
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      )
    }

    const body = await request.json().catch(() => null) as {
      email?: unknown
      userName?: unknown
      workspaceName?: unknown
    } | null

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { email, userName, workspaceName } = body

    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : ""
    if (!cleanEmail || cleanEmail.length > MAX_EMAIL_LEN || !EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      )
    }

    const cleanUserName =
      typeof userName === "string" ? userName.slice(0, MAX_NAME_LEN) : ""
    const cleanWorkspaceName =
      typeof workspaceName === "string" ? workspaceName.slice(0, MAX_NAME_LEN) : ""

    const { subject, html } = welcomeEmail({
      userName: cleanUserName,
      workspaceName: cleanWorkspaceName,
    })

    const result = await sendEmail({ to: cleanEmail, subject, html })

    if (result.error) {
      // Log but don't surface details to client — welcome email is non-critical
      console.error("[api/email/welcome] Send failed:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: result.id ?? null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("[api/email/welcome] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
