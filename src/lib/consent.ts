/**
 * UK-GDPR / PECR cookie consent state model.
 *
 * Categories:
 *   - necessary  — strictly necessary cookies (auth, security, load balancing).
 *                  ALWAYS on; cannot be disabled; legally exempt from consent.
 *   - analytics  — usage measurement (e.g. GA / GTM). OFF until explicit opt-in.
 *   - marketing  — advertising / remarketing. OFF until explicit opt-in.
 *
 * Persistence: a first-party cookie (so SSR / future server code can read it)
 * PLUS localStorage (fast client reads). A `version` field lets us re-prompt
 * everyone when the cookie policy materially changes — bump CONSENT_VERSION.
 *
 * Everything here is SSR-safe: every browser API access guards `window`.
 *
 * ── HOW ANALYTICS / MARKETING SCRIPTS ARE GATED ─────────────────────────────
 * Google Analytics (GA4) is loaded by <Analytics/> (src/components/consent/
 * Analytics.tsx) ONLY after the `analytics` category is granted, and is
 * disabled again on withdrawal. Any future GTM / GA / pixel MUST follow the
 * same pattern — gated behind explicit consent, e.g.:
 *
 *   import { hasConsent, onConsentChange } from "@/lib/consent"
 *
 *   function maybeLoadAnalytics() {
 *     if (!hasConsent("analytics")) return        // do NOT inject the script
 *     // ...inject GTM/GA <script> here only now...
 *   }
 *   maybeLoadAnalytics()
 *   // Re-evaluate if the user changes preferences later:
 *   onConsentChange(maybeLoadAnalytics)
 *
 * Never load non-necessary tags before hasConsent(category) returns true.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type ConsentCategory = "necessary" | "analytics" | "marketing"

export interface ConsentPreferences {
  necessary: true
  analytics: boolean
  marketing: boolean
}

export interface ConsentRecord extends ConsentPreferences {
  /** Policy version this choice was made against. */
  version: number
  /** ISO timestamp of when the choice was recorded. */
  timestamp: string
}

/** Bump this when the cookie policy materially changes to re-prompt everyone. */
export const CONSENT_VERSION = 1

/** First-party cookie / localStorage key holding the consent record. */
export const CONSENT_COOKIE_NAME = "propvora_cookie_consent"

/** Anonymous, rotating client id used to evidence consent for logged-out users. */
const CONSENT_CLIENT_ID_KEY = "propvora_consent_cid"

/** Cookie lifetime: 6 months (ICO guidance for re-confirming consent). */
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

/** Window event dispatched whenever consent changes (same tab). */
export const CONSENT_CHANGED_EVENT = "propvora:consent-changed"

/** Window event a footer / settings link can dispatch to reopen preferences. */
export const OPEN_COOKIE_PREFERENCES_EVENT = "open-cookie-preferences"

const DEFAULT_PREFERENCES: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function readCookie(name: string): string | null {
  if (!isBrowser() || typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
  if (!match) return null
  return decodeURIComponent(match.slice(name.length + 1))
}

function writeCookie(name: string, value: string): void {
  if (!isBrowser() || typeof document === "undefined") return
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Max-Age=${CONSENT_MAX_AGE_SECONDS}` +
    `; Path=/; SameSite=Lax${secure}`
}

/**
 * Get (or lazily create) a stable anonymous client id used purely to associate
 * a logged-out visitor's consent-log rows. Not PII on its own. SSR-safe.
 */
function getOrCreateClientId(): string | null {
  if (!isBrowser()) return null
  try {
    let id = window.localStorage.getItem(CONSENT_CLIENT_ID_KEY)
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cid_${Date.now()}_${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(CONSENT_CLIENT_ID_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

/**
 * Best-effort, fire-and-forget mirror of a consent choice to the server for
 * PECR evidence. Never throws and never blocks the UI; the cookie/localStorage
 * copy remains the authoritative source for gating.
 */
function logConsentToServer(record: ConsentRecord): void {
  if (!isBrowser()) return
  try {
    void fetch("/api/consent/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        clientId: getOrCreateClientId(),
        policyVersion: record.version,
        analytics: record.analytics,
        marketing: record.marketing,
      }),
    }).catch(() => {})
  } catch {
    /* evidence logging is best-effort */
  }
}

function parseRecord(raw: string | null): ConsentRecord | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>
    if (typeof parsed !== "object" || parsed === null) return null
    if (parsed.version !== CONSENT_VERSION) return null // stale policy → re-prompt
    return {
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      version: CONSENT_VERSION,
      timestamp:
        typeof parsed.timestamp === "string"
          ? parsed.timestamp
          : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Read the stored consent record, or `null` if no valid choice exists for the
 * current policy version (caller should then show the banner). SSR-safe.
 */
export function getConsent(): ConsentRecord | null {
  if (!isBrowser()) return null
  // localStorage first (fast), fall back to cookie (survives storage clears).
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(CONSENT_COOKIE_NAME)
  } catch {
    raw = null
  }
  const fromStorage = parseRecord(raw)
  if (fromStorage) return fromStorage
  return parseRecord(readCookie(CONSENT_COOKIE_NAME))
}

/** True once the user has made any valid choice for the current policy version. */
export function hasStoredConsent(): boolean {
  return getConsent() !== null
}

/**
 * Whether a given category may be used right now.
 * `necessary` is always true. Non-necessary categories require a stored opt-in.
 */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === "necessary") return true
  const record = getConsent()
  if (!record) return false
  return record[category] === true
}

/**
 * Persist a consent choice to cookie + localStorage and notify listeners.
 * `necessary` is forced on regardless of input.
 */
export function setConsent(
  prefs: Partial<Omit<ConsentPreferences, "necessary">>,
): ConsentRecord {
  const record: ConsentRecord = {
    necessary: true,
    analytics: prefs.analytics === true,
    marketing: prefs.marketing === true,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  }
  if (isBrowser()) {
    const serialized = JSON.stringify(record)
    try {
      window.localStorage.setItem(CONSENT_COOKIE_NAME, serialized)
    } catch {
      /* storage may be unavailable (private mode) — cookie still persists */
    }
    writeCookie(CONSENT_COOKIE_NAME, serialized)
    window.dispatchEvent(
      new CustomEvent<ConsentRecord>(CONSENT_CHANGED_EVENT, { detail: record }),
    )
    // Mirror the choice to the server as durable PECR evidence (best-effort).
    logConsentToServer(record)
  }
  return record
}

/** Convenience: accept every category. */
export function acceptAll(): ConsentRecord {
  return setConsent({ analytics: true, marketing: true })
}

/** Convenience: reject everything non-essential. */
export function rejectNonEssential(): ConsentRecord {
  return setConsent({ analytics: false, marketing: false })
}

/** Default preferences object for an unconfigured user (necessary only). */
export function defaultPreferences(): ConsentPreferences {
  return { ...DEFAULT_PREFERENCES }
}

/**
 * Subscribe to consent changes (same tab). Returns an unsubscribe function.
 * Use this to re-evaluate whether to load analytics after a preference change.
 */
export function onConsentChange(
  handler: (record: ConsentRecord) => void,
): () => void {
  if (!isBrowser()) return () => {}
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<ConsentRecord>).detail
    if (detail) handler(detail)
  }
  window.addEventListener(CONSENT_CHANGED_EVENT, listener)
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, listener)
}

/** Dispatch the event that reopens the cookie preferences modal. */
export function openCookiePreferences(): void {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))
}
