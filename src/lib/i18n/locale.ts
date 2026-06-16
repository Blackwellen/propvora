/**
 * ============================================================================
 * Propvora i18n — LOCALE RESOLUTION
 * ============================================================================
 *
 * Resolve the ACTIVE locale from the available signals, in priority order:
 *
 *     1. URL locale prefix             (/fr-FR/app)
 *     2. explicit profile preference   (user picked a language)
 *     3. workspace default language    (workspace.default_language)
 *     4. country profile default       (country_profiles.default_locale)
 *     5. Accept-Language header         (browser preference; best-effort match)
 *     6. DEFAULT_LOCALE (en-GB)
 *
 * The result is ALWAYS a supported `Locale`. With no signal at all it is en-GB,
 * keeping the UK experience identical to today (the GB default invariant).
 *
 * This module is environment-agnostic (`resolveLocale` is pure). The server
 * helper reads the request headers; the client helper reads the browser. Both
 * funnel through `resolveLocale`, so behaviour is identical across runtimes.
 * ============================================================================
 */

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type Locale,
} from "./config"

export interface ResolveLocaleArgs {
  /** A locale from a URL prefix or proxy header. */
  urlLocale?: string | null
  /** A locale the user explicitly chose (highest priority). */
  profileLocale?: string | null
  /** The workspace's default language. */
  workspaceLocale?: string | null
  /** The resolved country profile's default locale. */
  countryLocale?: string | null
  /** Raw `Accept-Language` header value (best-effort negotiation). */
  acceptLanguage?: string | null
}

/**
 * Pure locale resolver. Tries each signal in priority order and returns the
 * first supported match; defaults to en-GB. Never throws.
 */
export function resolveLocale(args: ResolveLocaleArgs = {}): Locale {
  const { urlLocale, profileLocale, workspaceLocale, countryLocale, acceptLanguage } = args

  if (isSupportedLocale(urlLocale)) return urlLocale
  if (isSupportedLocale(profileLocale)) return profileLocale
  if (isSupportedLocale(workspaceLocale)) return workspaceLocale
  if (isSupportedLocale(countryLocale)) return countryLocale

  // Loose match: a profile/workspace value like "en" or "fr" maps to the first
  // supported locale sharing that primary language subtag.
  const loose =
    matchPrimary(urlLocale) ??
    matchPrimary(profileLocale) ??
    matchPrimary(workspaceLocale) ??
    matchPrimary(countryLocale)
  if (loose) return loose

  const fromHeader = negotiateAcceptLanguage(acceptLanguage)
  if (fromHeader) return fromHeader

  return DEFAULT_LOCALE
}

/**
 * Match a bare/region-mismatched tag (e.g. "en", "fr", "en-AU") to a supported
 * locale by primary language subtag. Returns null when nothing matches.
 */
function matchPrimary(value: string | null | undefined): Locale | null {
  if (!value || typeof value !== "string") return null
  const primary = value.toLowerCase().split("-")[0]
  return (
    SUPPORTED_LOCALES.find((l) => l.toLowerCase().split("-")[0] === primary) ??
    null
  )
}

/**
 * Best-effort `Accept-Language` negotiation. Parses the q-weighted list and
 * returns the highest-priority supported locale (exact, then primary-subtag).
 */
export function negotiateAcceptLanguage(
  header: string | null | undefined
): Locale | null {
  if (!header || typeof header !== "string") return null

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";")
      const qParam = params.find((p) => p.trim().startsWith("q="))
      const q = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1
      return { tag: tag.trim(), q: Number.isNaN(q) ? 1 : q }
    })
    .filter((entry) => entry.tag && entry.tag !== "*")
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    // For the `en` primary subtag, Accept-Language negotiation always resolves
    // to en-GB (the platform canonical). Individual en-* variants (en-AU,
    // en-CA, …) are only reachable via an explicit user profile preference, not
    // via browser header negotiation — the platform is GB-first.
    const primary = tag.toLowerCase().split("-")[0]
    if (primary === "en") {
      if (isSupportedLocale(tag) && tag === "en-GB") return "en-GB"
      continue
    }
    if (isSupportedLocale(tag)) return tag
  }
  for (const { tag } of ranked) {
    const matched = matchPrimary(tag)
    if (matched) return matched
  }
  return null
}

/**
 * SERVER helper. Resolve the active locale inside a Server Component / route
 * handler. Reads `Accept-Language` from request headers and layers the
 * (optional) profile/workspace preferences on top.
 *
 * `next/headers` is imported dynamically so this module stays importable from
 * client code (the client never reaches this branch).
 */
export async function getServerLocale(args: {
  urlLocale?: string | null
  profileLocale?: string | null
  workspaceLocale?: string | null
  countryLocale?: string | null
} = {}): Promise<Locale> {
  let acceptLanguage: string | null = null
  let urlLocale: string | null = args.urlLocale ?? null
  try {
    const { headers } = await import("next/headers")
    const h = await headers()
    acceptLanguage = h.get("accept-language")
    urlLocale = urlLocale ?? h.get("x-propvora-locale")
  } catch {
    // Outside a request scope (e.g. build/test) — fall through to defaults.
  }
  return resolveLocale({ ...args, urlLocale, acceptLanguage })
}

/**
 * CLIENT helper. Resolve the active locale in the browser from explicit
 * preferences plus `navigator.languages`. Safe to call during SSR (guards
 * `navigator`); returns en-GB until hydration provides the browser list.
 */
export function getClientLocale(args: {
  urlLocale?: string | null
  profileLocale?: string | null
  workspaceLocale?: string | null
  countryLocale?: string | null
} = {}): Locale {
  let acceptLanguage: string | null = null
  if (typeof navigator !== "undefined") {
    const langs = navigator.languages ?? [navigator.language]
    acceptLanguage = langs.filter(Boolean).join(",")
  }
  return resolveLocale({ ...args, acceptLanguage })
}
