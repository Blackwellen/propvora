import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { rateLimit, clientKey, RATE_LIMITS } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ============================================================================
// Server-side rate gate for the (client-rendered) auth flows.
//
// Login / signup / password-reset / OTP run in the browser against Supabase
// auth directly, so they cannot call the service-role limiter themselves. Those
// forms POST here FIRST; we throttle per-IP+action and return 429 when the
// caller is over the limit. Fail-OPEN: any store error allows the request.
//
// This is an application-side abuse throttle layered on top of Supabase's own
// auth rate limits — not a replacement for edge/WAF protection.
// ============================================================================

const ACTIONS = {
  login: RATE_LIMITS.login,
  signup: RATE_LIMITS.signup,
  "password-reset": RATE_LIMITS.passwordReset,
  otp: RATE_LIMITS.otp,
} as const

type ActionName = keyof typeof ACTIONS

export async function POST(request: NextRequest) {
  let action: string | undefined
  try {
    const body = (await request.json()) as { action?: unknown }
    action = typeof body.action === "string" ? body.action : undefined
  } catch {
    action = undefined
  }

  if (!action || !(action in ACTIONS)) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 })
  }

  const cfg = ACTIONS[action as ActionName]
  const rl = await rateLimit({ key: clientKey(request, action), ...cfg })

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  return NextResponse.json({ ok: true })
}
