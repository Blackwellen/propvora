/**
 * ============================================================================
 * Propvora i18n — PUBLIC API
 * ============================================================================
 *
 * Lightweight, dependency-free internationalisation built on native `Intl`.
 * Default locale is en-GB; with no locale configured every formatter and
 * message lookup resolves exactly as the app does today.
 *
 * Server usage:
 *   import { getServerLocale, t, formatMoney } from "@/lib/i18n"
 *   const locale = await getServerLocale({ workspaceLocale, profileLocale })
 *   t(locale, "actions.save")            // → "Save"
 *   formatMoney(123456, "GBP", locale)   // → "£1,234.56"
 *
 * Client usage (via the provider — see components/i18n/LocaleProvider):
 *   const t = useT(); const locale = useLocale()
 * ============================================================================
 */

export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_META,
  isSupportedLocale,
  localeMeta,
  type Locale,
  type LocaleMeta,
  type MeasurementSystem,
} from "./config"

export {
  formatMoney,
  formatMoneyMajor,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  minorUnitExponent,
} from "./format"

export {
  t,
  createTranslator,
  getCatalogue,
  type Translator,
  type TParams,
} from "./messages"

export {
  resolveLocale,
  negotiateAcceptLanguage,
  getServerLocale,
  getClientLocale,
  type ResolveLocaleArgs,
} from "./locale"
