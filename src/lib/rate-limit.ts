import { createAdminClient } from "@/lib/supabase/admin"

// ============================================================================
// Application-side rate limiting (MAX-RELEASE items 51-54).
//
// A generic Supabase-backed fixed-window limiter for sensitive endpoints
// (login, signup, password reset, OTP/magic-link, invite creation, account
// data-requests). Mirrors the pattern in src/lib/ai/metering.ts:
//
//   * Service-role client (createAdminClient) writes to public.app_rate_limits,
//     which is RLS deny-all so it is never reachable from the browser.
//   * Fixed window keyed by (key, window_start).
//   * Fails OPEN on ANY store error — a logging/store hiccup must never lock a
//     legitimate user out — but enforces the limit whenever the store works.
//
// Requires migration supabase/migrations/20260613000004_app_rate_limits.sql to
// be applied:  node scripts/_apply_migration.mjs supabase/migrations/20260613000004_app_rate_limits.sql
// ============================================================================

export interface RateLimitOptions {
  /** Stable identifier for the caller, e.g. "login:203.0.113.7". */
  key: string
  /** Max requests allowed per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  /** True if the request is under the limit (or the store failed → fail-open). */
  allowed: boolean
  /** Requests remaining in the current window (best-effort). */
  remaining: number
  /** Seconds until the current window resets (for a Retry-After hint). */
  retryAfterSec: number
}

/**
 * Fixed-window rate check against public.app_rate_limits using the service-role
 * client. Best-effort: on any store error we allow the request (fail-open) so
 * store problems never lock users out.
 */
export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts
  const now = Date.now()
  const windowStartMs = Math.floor(now / windowMs) * windowMs
  const windowStart = new Date(windowStartMs).toISOString()
  const retryAfterSec = Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000))

  // Missing service-role config (e.g. local/preview without secrets) → fail open.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { allowed: true, remaining: limit, retryAfterSec }
  }

  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("app_rate_limits")
      .select("count")
      .eq("key", key)
      .eq("window_start", windowStart)
      .maybeSingle()
    if (error) return { allowed: true, remaining: limit, retryAfterSec }

    const current = (data?.count as number | undefined) ?? 0
    if (current >= limit) {
      return { allowed: false, remaining: 0, retryAfterSec }
    }

    // Increment (upsert) — best-effort. A small race here can over-count by a
    // request or two under heavy concurrency; that is acceptable for an
    // abuse-throttle and always errs on the side of letting users through.
    await supabase
      .from("app_rate_limits")
      .upsert(
        { key, window_start: windowStart, count: current + 1, updated_at: new Date().toISOString() },
        { onConflict: "key,window_start" }
      )

    return { allowed: true, remaining: Math.max(0, limit - current - 1), retryAfterSec }
  } catch {
    return { allowed: true, remaining: limit, retryAfterSec }
  }
}

/**
 * Derive a best-effort client identifier from a Request for use as a rate-limit
 * key. Combines a route tag with the caller's IP (first hop of x-forwarded-for,
 * falling back to x-real-ip).
 *
 * NOTE: the IP is best-effort. Behind Vercel / Cloudflare the left-most
 * x-forwarded-for entry is the original client, but proxies can be misconfigured
 * or spoofed by direct callers, so this is a soft abuse throttle — not a hard
 * security boundary. When no IP can be determined we fall back to a shared
 * "unknown" bucket so the limit still applies in aggregate.
 */
export function clientKey(request: Request, routeTag: string): string {
  const xff = request.headers.get("x-forwarded-for")
  const firstHop = xff?.split(",")[0]?.trim()
  const ip = firstHop || request.headers.get("x-real-ip")?.trim() || "unknown"
  return `${routeTag}:${ip}`
}

/** Sensible per-IP+route defaults for the protected endpoints. */
export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 5 * 60 * 1000 },
  signup: { limit: 5, windowMs: 10 * 60 * 1000 },
  passwordReset: { limit: 5, windowMs: 15 * 60 * 1000 },
  otp: { limit: 5, windowMs: 15 * 60 * 1000 },
  invite: { limit: 20, windowMs: 10 * 60 * 1000 },
  accountRequest: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const
