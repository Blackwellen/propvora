import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimit, clientKey } from "@/lib/rate-limit"
import {
  clampString,
  sanitiseContext,
  BUG_KINDS,
  type BugKind,
  MAX_MESSAGE_LEN,
  MAX_ROUTE_LEN,
  MAX_DIGEST_LEN,
  MAX_UA_LEN,
} from "@/lib/bugs/sanitise"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/bug-report — capture a bug report (MAX-RELEASE item 197).
 *
 * Accepts { kind, route, message, digest?, context? } from:
 *   * the client error boundaries (kind:'error', fire-and-forget), and
 *   * user-submitted bug reports (kind:'user_report').
 *
 * SAFETY: we never store secrets, tokens, or full stack traces — only a short
 * `digest` plus a length-capped message, and a secret-stripped context. Writes
 * go through the service-role client to a deny-all table. The route is
 * deliberately robust: it always returns a generic 200 and never throws, so a
 * reporting failure can never surface as a second error to the user.
 */
export async function POST(request: NextRequest) {
  // Generic success response — used for every non-throttled outcome so we never
  // leak whether a write actually happened.
  const ok = () => NextResponse.json({ ok: true })

  try {
    // Soft per-IP throttle to blunt abuse. Fail-open by design (rateLimit never
    // throws and allows on store errors), so legitimate reports are never lost.
    const rl = await rateLimit({
      key: clientKey(request, "bug-report"),
      limit: 20,
      windowMs: 10 * 60 * 1000,
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      )
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== "object") return ok()

    // Kind — default to 'error', only accept the known values.
    const rawKind = typeof body.kind === "string" ? body.kind : "error"
    const kind: BugKind = (BUG_KINDS as readonly string[]).includes(rawKind)
      ? (rawKind as BugKind)
      : "error"

    const route = clampString(body.route, MAX_ROUTE_LEN)
    const message = clampString(body.message, MAX_MESSAGE_LEN)
    const digest = clampString(body.digest, MAX_DIGEST_LEN)
    const context = sanitiseContext(body.context)

    // Nothing meaningful to record → still return generic success.
    if (!message && !digest && !context && !route) return ok()

    // User-agent from the request header (capped). Never trust a client-supplied UA.
    const userAgent = clampString(request.headers.get("user-agent"), MAX_UA_LEN)

    // Best-effort: resolve the signed-in user + their current workspace. Anonymous
    // error reports are allowed (user_id / workspace_id stay null).
    let userId: string | null = null
    let workspaceId: string | null = null
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()
        workspaceId = (profile?.current_workspace_id as string | null) ?? null
      }
    } catch {
      // Session resolution is best-effort — never block a report on it.
    }

    // Missing service-role config (local/preview without secrets) → no-op success.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return ok()
    }

    try {
      const admin = createAdminClient()
      await admin.from("bug_reports").insert({
        kind,
        route,
        message,
        digest,
        context,
        user_agent: userAgent,
        user_id: userId,
        workspace_id: workspaceId,
        status: "new",
      })
    } catch {
      // Swallow store errors — reporting is best-effort and must never throw.
    }

    return ok()
  } catch {
    // Absolute backstop: never let the reporter itself error out.
    return NextResponse.json({ ok: true })
  }
}
