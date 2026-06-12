import { createAdminClient } from "@/lib/supabase/admin"
import { sha256 } from "./session"

// ============================================================================
// Rate limiting for /api/portal/verify.
//
// Primary defence is an in-memory fixed-window counter (per server instance):
// fast, no DB round-trip on the hot path. We ALSO best-effort increment a
// durable `portal_verify_attempts` row so limits survive across instances /
// restarts where that table exists. Either layer alone is enough to block a
// brute-force; both failing open is the only way through, which we accept as
// a soft-fail (the token space is 256-bit, so brute force is infeasible
// regardless — the limiter mainly stops log/credential-stuffing noise).
// ============================================================================

const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 10

interface Bucket {
  count: number
  windowStart: number
}
const memory = new Map<string, Bucket>()

function bucketKey(ip: string | null, rawToken: string): string {
  // Hash the bucket so we never store raw tokens or raw IPs in memory/table.
  const tokenPrefix = rawToken.slice(0, 8)
  return sha256(`${ip ?? "noip"}|${tokenPrefix}`)
}

/** Returns true if the attempt is allowed, false if rate-limited. */
export async function checkVerifyRateLimit(
  ip: string | null,
  rawToken: string
): Promise<boolean> {
  const key = bucketKey(ip, rawToken)
  const now = Date.now()

  // ---- in-memory layer ----
  const existing = memory.get(key)
  if (!existing || now - existing.windowStart > WINDOW_MS) {
    memory.set(key, { count: 1, windowStart: now })
  } else {
    existing.count += 1
    if (existing.count > MAX_ATTEMPTS) {
      void recordDurable(key) // still record the over-limit attempt
      return false
    }
  }

  // periodic cleanup to bound memory
  if (memory.size > 5000) {
    for (const [k, b] of memory) {
      if (now - b.windowStart > WINDOW_MS) memory.delete(k)
    }
  }

  // ---- durable layer (best-effort) ----
  const durableOk = await recordDurable(key)
  return durableOk
}

/**
 * Best-effort durable counter. Returns false only when we can positively
 * confirm the bucket is over the limit; on any error it returns true
 * (the in-memory layer remains the guard).
 */
async function recordDurable(key: string): Promise<boolean> {
  const admin = createAdminClient()
  const now = new Date()
  try {
    const { data, error } = await admin
      .from("portal_verify_attempts")
      .select("attempts, window_start")
      .eq("bucket", key)
      .maybeSingle()
    if (error) return true // table absent / unreadable => rely on memory

    if (!data) {
      await admin.from("portal_verify_attempts").insert({
        bucket: key,
        attempts: 1,
        window_start: now.toISOString(),
        last_at: now.toISOString(),
      })
      return true
    }

    const windowStart = new Date(data.window_start as string).getTime()
    if (now.getTime() - windowStart > WINDOW_MS) {
      await admin
        .from("portal_verify_attempts")
        .update({ attempts: 1, window_start: now.toISOString(), last_at: now.toISOString() })
        .eq("bucket", key)
      return true
    }

    const attempts = ((data.attempts as number) ?? 0) + 1
    await admin
      .from("portal_verify_attempts")
      .update({ attempts, last_at: now.toISOString() })
      .eq("bucket", key)
    return attempts <= MAX_ATTEMPTS
  } catch {
    return true
  }
}
