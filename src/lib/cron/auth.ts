// Cron authorisation — the single gate that proves a request came from the
// scheduler (Vercel Cron) and not the public internet.
//
// HOW VERCEL CRON AUTHENTICATES: when a cron job fires, Vercel invokes the
// endpoint with an `Authorization: Bearer <CRON_SECRET>` header, where
// CRON_SECRET is the value of the project's `CRON_SECRET` environment variable
// (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
// We verify that header here. There is NO authenticated user on a cron request —
// the secret IS the credential. Routes that pass this gate then use the
// service-role admin client.
//
// SECURITY POSTURE:
//   * FAIL CLOSED. If `CRON_SECRET` is not configured, every cron request is
//     rejected (we never run an unauthenticated, service-role job).
//   * Constant-time comparison to avoid leaking the secret via timing.
//   * The secret is server-only (env var); it is never returned in any response.
//
// ENV VAR TO SET (document): `CRON_SECRET` — a long random string. Set it in the
// Vercel project (Production + Preview). Vercel automatically attaches it as the
// Bearer token on scheduled invocations of routes listed in `vercel.json` crons.

import { timingSafeEqual } from "node:crypto"

/** Result of a cron authorisation check. */
export interface CronAuthResult {
  ok: boolean
  /** Why authorisation failed (for logging only — never returned to caller). */
  reason?: "not_configured" | "missing_bearer" | "mismatch"
}

/** Constant-time string compare that tolerates length differences. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8")
  const bb = Buffer.from(b, "utf8")
  // timingSafeEqual throws on length mismatch; compare against a fixed-length
  // digest-style buffer pair so length itself isn't a fast-path oracle.
  if (ab.length !== bb.length) {
    // Still burn a comparison to keep timing flat, then return false.
    try {
      timingSafeEqual(ab, Buffer.from(a, "utf8"))
    } catch {
      /* ignore */
    }
    return false
  }
  try {
    return timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

/**
 * Extract the presented bearer token from a request. Accepts the standard
 * `Authorization: Bearer <token>` header Vercel Cron sends.
 */
function bearerFrom(headers: Headers): string | null {
  const auth = headers.get("authorization") ?? headers.get("Authorization")
  if (!auth) return null
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim())
  return m ? m[1].trim() : null
}

/**
 * Authorise a cron request. Returns ok:true ONLY when CRON_SECRET is configured
 * and the request presents a matching `Authorization: Bearer <CRON_SECRET>`.
 * Fails closed otherwise.
 */
export function authorizeCron(request: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET
  if (!secret || !secret.trim()) return { ok: false, reason: "not_configured" }

  const presented = bearerFrom(request.headers)
  if (!presented) return { ok: false, reason: "missing_bearer" }

  if (!safeEqual(presented, secret)) return { ok: false, reason: "mismatch" }
  return { ok: true }
}
