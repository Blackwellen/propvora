"use client"

/**
 * ============================================================================
 * Propvora i18n — LOCALE SWITCHER
 * ============================================================================
 *
 * A settings control for choosing the active language / regional format.
 * Dependency-free (native <select>) so it has no coupling to a specific design
 * primitive and works anywhere.
 *
 * PERSISTENCE: the switcher does not assume an endpoint. Pass `onChange` to wire
 * persistence (e.g. PATCH the profile/workspace `default_language`). If
 * `persistUrl` is supplied, the component PATCHes `{ default_language }` to it
 * as a convenience — but the host stays in control of where the value lives.
 * After a successful change the page is refreshed so server-resolved locale and
 * formatting update everywhere.
 * ============================================================================
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  SUPPORTED_LOCALES,
  LOCALE_META,
  isSupportedLocale,
  type Locale,
} from "@/lib/i18n/config"
import { useLocale, useT } from "./LocaleProvider"

export interface LocaleSwitcherProps {
  /** Current value (defaults to the provider's active locale). */
  value?: Locale
  /** Called with the chosen locale. Wire persistence here. */
  onChange?: (locale: Locale) => void | Promise<void>
  /**
   * Optional convenience endpoint. When set, the switcher PATCHes
   * `{ default_language: locale }` to this URL on change.
   */
  persistUrl?: string
  /** Refresh the route after a successful change (default true). */
  refreshOnChange?: boolean
  /** Hide the field label (when a parent renders its own). */
  hideLabel?: boolean
  className?: string
}

export function LocaleSwitcher({
  value,
  onChange,
  persistUrl,
  refreshOnChange = true,
  hideLabel = false,
  className,
}: LocaleSwitcherProps) {
  const activeLocale = useLocale()
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const current = value ?? activeLocale

  async function handleChange(next: string) {
    if (!isSupportedLocale(next) || next === current) return
    setBusy(true)
    try {
      if (persistUrl) {
        await fetch(persistUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ default_language: next }),
        })
      }
      await onChange?.(next)
      if (refreshOnChange) startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  const disabled = busy || pending

  return (
    <div className={className}>
      {!hideLabel && (
        <label
          htmlFor="locale-switcher"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          {t("settings.language")}
        </label>
      )}
      <select
        id="locale-switcher"
        value={current}
        disabled={disabled}
        onChange={(e) => void handleChange(e.target.value)}
        aria-label={t("settings.language")}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {SUPPORTED_LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {LOCALE_META[loc].label}
          </option>
        ))}
      </select>
      {!hideLabel && (
        <p className="mt-1 text-xs text-slate-500">{t("settings.languageHint")}</p>
      )}
    </div>
  )
}
