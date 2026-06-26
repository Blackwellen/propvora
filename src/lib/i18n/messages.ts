/**
 * ============================================================================
 * Propvora i18n — MESSAGE CATALOGUE + t()
 * ============================================================================
 *
 * A tiny, dependency-free message layer. Catalogues are nested JSON keyed by
 * dotted path ("actions.save"). `t()` does a three-step fallback so it can
 * NEVER throw and never surface a raw missing-key crash:
 *
 *     1. active locale catalogue
 *     2. en-GB (DEFAULT_LOCALE) catalogue
 *     3. the key string itself
 *
 * Interpolation: "{name}" placeholders are replaced from a params object.
 * Unsupplied placeholders are left intact (so a missing param is visible, not
 * a crash). All catalogues are bundled statically — no async/await, works in
 * Server Components, Client Components and plain modules alike.
 * ============================================================================
 */

import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "./config"

import enGB from "./locales/en-GB.json"
import enUS from "./locales/en-US.json"
import frFR from "./locales/fr-FR.json"
import deDE from "./locales/de-DE.json"
import esES from "./locales/es-ES.json"
import itIT from "./locales/it-IT.json"
import nlNL from "./locales/nl-NL.json"
import svSE from "./locales/sv-SE.json"
import fiFI from "./locales/fi-FI.json"
import daDK from "./locales/da-DK.json"
import csCZ from "./locales/cs-CZ.json"
import hrHR from "./locales/hr-HR.json"
import huHU from "./locales/hu-HU.json"
import ptBR from "./locales/pt-BR.json"
import jaJP from "./locales/ja-JP.json"
import thTH from "./locales/th-TH.json"
import trTR from "./locales/tr-TR.json"

/** A nested catalogue: string leaves, object branches. */
type Messages = { [key: string]: string | Messages }

// Core UI vocabulary is translated for all 22 locales; any untranslated key
// falls back to en-GB via t(). Legal/statutory strings are NOT machine-translated
// here — they are gated to qualified legal translators (see the i18n posture).
const CATALOGUES: Record<Locale, Messages> = {
  "en-GB": enGB as Messages,
  "en-US": enUS as Messages,
  "en-AU": enGB as Messages,
  "en-NZ": enGB as Messages,
  "en-IE": enGB as Messages,
  "en-CA": enGB as Messages,
  "fr-CA": frFR as Messages,
  "fr-FR": frFR as Messages,
  "de-DE": deDE as Messages,
  "es-ES": esES as Messages,
  "it-IT": itIT as Messages,
  "nl-NL": nlNL as Messages,
  "sv-SE": svSE as Messages,
  "fi-FI": fiFI as Messages,
  "da-DK": daDK as Messages,
  "cs-CZ": csCZ as Messages,
  "hr-HR": hrHR as Messages,
  "hu-HU": huHU as Messages,
  "pt-BR": ptBR as Messages,
  "ja-JP": jaJP as Messages,
  "th-TH": thTH as Messages,
  "tr-TR": trTR as Messages,
}

export type TParams = Record<string, string | number>

/** Resolve a dotted key against one catalogue. Returns null if absent. */
function lookup(catalogue: Messages, key: string): string | null {
  const parts = key.split(".")
  let node: string | Messages | undefined = catalogue
  for (const part of parts) {
    if (node == null || typeof node === "string") return null
    node = node[part]
  }
  return typeof node === "string" ? node : null
}

/** Replace {placeholder} tokens; leaves unknown placeholders untouched. */
function interpolate(template: string, params?: TParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  )
}

/**
 * Translate `key` for `locale`, interpolating `params`.
 *
 * Fallback chain: active locale → en-GB → the key itself. Never throws.
 *
 * @example t("en-GB", "actions.save")              // "Save"
 * @example t("fr-FR", "actions.delete")            // "Supprimer"
 * @example t("fr-FR", "actions.upload")            // "Upload"  (en-GB fallback)
 * @example t("en-GB", "common.greeting", { name }) // "Welcome back, Sam"
 * @example t("en-GB", "totally.unknown")           // "totally.unknown" (key fallback)
 */
export function t(
  locale: string | null | undefined,
  key: string,
  params?: TParams
): string {
  const active: Locale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE

  const fromActive = lookup(CATALOGUES[active], key)
  if (fromActive != null) return interpolate(fromActive, params)

  if (active !== DEFAULT_LOCALE) {
    const fromDefault = lookup(CATALOGUES[DEFAULT_LOCALE], key)
    if (fromDefault != null) return interpolate(fromDefault, params)
  }

  // Key fallback — visible, never a crash.
  return key
}

/** A bound translator for a fixed locale (used by the provider/hooks). */
export type Translator = (key: string, params?: TParams) => string

/** Build a `t`-style function bound to one locale. */
export function createTranslator(locale: string | null | undefined): Translator {
  const active: Locale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
  return (key, params) => t(active, key, params)
}

/** Expose the raw catalogue for a locale (e.g. to hydrate a client provider). */
export function getCatalogue(locale: string | null | undefined): Messages {
  return isSupportedLocale(locale) ? CATALOGUES[locale] : CATALOGUES[DEFAULT_LOCALE]
}
