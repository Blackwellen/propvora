// Bug-report sanitisation (MAX-RELEASE item 197).
//
// This module is the single place that decides what is safe to persist from a
// bug report. The golden rules:
//   * NEVER store secrets, tokens, passwords, cookies, or auth headers.
//   * NEVER store full stack traces — only a short `digest` + a truncated message.
//   * Cap every free-text field and the JSON context so a malicious/buggy client
//     cannot dump unbounded data into the store.

/** Max length we persist for the human-readable message. */
export const MAX_MESSAGE_LEN = 2000
/** Max length we persist for a route/pathname. */
export const MAX_ROUTE_LEN = 512
/** Max length we persist for the digest. */
export const MAX_DIGEST_LEN = 128
/** Max length we persist for the user-agent. */
export const MAX_UA_LEN = 512
/** Max number of keys we keep from a context object. */
export const MAX_CONTEXT_KEYS = 30
/** Max length of any single stringified context value. */
export const MAX_CONTEXT_VALUE_LEN = 500

export const BUG_KINDS = ["error", "user_report"] as const
export type BugKind = (typeof BUG_KINDS)[number]

/**
 * Substrings that, if present in a context key, mean the value is likely a
 * secret or sensitive personal datum and must be dropped entirely. Matched
 * case-insensitively against the key name.
 */
const SECRET_KEY_PATTERNS = [
  "password",
  "passwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "auth",
  "authorization",
  "cookie",
  "session",
  "credential",
  "private",
  "ssn",
  "card",
  "cvv",
  "pin",
  "bearer",
  "jwt",
  "otp",
  "key", // catch-all for *_key / publicKey etc.
]

function looksSecret(key: string): boolean {
  const k = key.toLowerCase()
  return SECRET_KEY_PATTERNS.some((p) => k.includes(p))
}

/** Clamp a string to a max length, trimming and returning null when empty. */
export function clampString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed
}

/**
 * Produce a shallow, secret-stripped copy of an arbitrary context object.
 * - Only plain string/number/boolean values are kept (no nested objects/arrays,
 *   which could smuggle large or sensitive blobs through).
 * - Keys that look secret are dropped entirely.
 * - String values are clamped.
 * - The number of keys is capped.
 * Returns null when nothing safe remains.
 */
export function sanitiseContext(input: unknown): Record<string, string | number | boolean> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null

  const out: Record<string, string | number | boolean> = {}
  let kept = 0

  for (const [rawKey, rawVal] of Object.entries(input as Record<string, unknown>)) {
    if (kept >= MAX_CONTEXT_KEYS) break
    const key = rawKey.slice(0, 64)
    if (looksSecret(key)) continue

    if (typeof rawVal === "string") {
      const v = rawVal.trim()
      if (!v) continue
      out[key] = v.length > MAX_CONTEXT_VALUE_LEN ? v.slice(0, MAX_CONTEXT_VALUE_LEN) : v
      kept++
    } else if (typeof rawVal === "number" && Number.isFinite(rawVal)) {
      out[key] = rawVal
      kept++
    } else if (typeof rawVal === "boolean") {
      out[key] = rawVal
      kept++
    }
    // Everything else (objects, arrays, null, functions) is intentionally dropped.
  }

  return kept > 0 ? out : null
}
