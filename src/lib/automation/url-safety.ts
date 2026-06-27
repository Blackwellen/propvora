// SSRF guard for outbound webhook destinations.
//
// Outbound webhooks let a workspace POST to an arbitrary URL. Without a guard,
// a URL pointing at an internal/private/loopback/link-local address could be
// used to probe or call services inside our network (Server-Side Request
// Forgery). This enforces: https only, public hostnames only — no localhost,
// no private RFC1918 ranges, no link-local/metadata (169.254.x, fd00::/8), no
// `.internal`/`.local` suffixes, no bare-IP loopback.
//
// Checklist §17 (599–600): webhook actions must validate destination URLs and
// block unsafe/internal addresses.

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
  "metadata.google.internal",
])

const BLOCKED_SUFFIXES = [".internal", ".local", ".localhost"]

/** True if an IPv4 literal sits in a private / loopback / link-local range. */
function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  if (a === 10) return true // 10.0.0.0/8
  if (a === 127) return true // loopback
  if (a === 169 && b === 254) return true // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT 100.64.0.0/10
  if (a === 0) return true // 0.0.0.0/8
  return false
}

/** True if an IPv6 literal is loopback / unique-local / link-local. */
function isPrivateIPv6(host: string): boolean {
  const h = host.replace(/^\[/, "").replace(/\]$/, "").toLowerCase()
  if (h === "::1" || h === "::") return true
  if (h.startsWith("fc") || h.startsWith("fd")) return true // unique local fc00::/7
  if (h.startsWith("fe80")) return true // link-local
  return false
}

export interface UrlSafetyResult {
  ok: boolean
  reason?: string
}

/**
 * Validate an outbound webhook URL. Returns ok=false with a reason for any
 * non-https scheme or any private/internal/loopback/link-local destination.
 */
export function assertSafeWebhookUrl(raw: string): UrlSafetyResult {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, reason: "Not a valid URL." }
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "Webhook URLs must use HTTPS." }
  }
  const host = url.hostname.toLowerCase()
  if (!host) return { ok: false, reason: "URL has no host." }
  if (BLOCKED_HOSTNAMES.has(host)) {
    return { ok: false, reason: "Internal/loopback addresses are not allowed." }
  }
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    return { ok: false, reason: "Internal hostnames (.internal/.local) are not allowed." }
  }
  if (isPrivateIPv4(host) || isPrivateIPv6(host)) {
    return { ok: false, reason: "Private or link-local IP addresses are not allowed." }
  }
  return { ok: true }
}
