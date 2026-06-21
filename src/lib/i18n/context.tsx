"use client"

/**
 * i18n context: property-law country pack (terminology, compliance taxonomy,
 * tab visibility, property types) for the active workspace jurisdiction.
 *
 * This is separate from WorkspaceLocaleProvider (which handles money/date/number
 * formatting). Both can be composed together — this pack layer drives which UI
 * sections are shown and what legal labels read.
 *
 * Server components pass the pack down; client components call useI18n().
 */

import { createContext, useContext, type ReactNode } from "react"
import {
  getCountryPack,
  type CountryPack,
  type CountryPackTerms,
  type CountryPackTabVisibility,
  COUNTRY_PACKS,
} from "./country-packs"

const I18nContext = createContext<CountryPack>(COUNTRY_PACKS["GB"])

export function I18nProvider({
  countryCode,
  pack,
  children,
}: {
  countryCode?: string | null
  pack?: CountryPack
  children: ReactNode
}) {
  const resolved = pack ?? getCountryPack(countryCode)
  return <I18nContext.Provider value={resolved}>{children}</I18nContext.Provider>
}

/** Returns the active country pack. Falls back to GB when used outside the provider. */
export function useI18n(): CountryPack {
  return useContext(I18nContext)
}

/** Returns a single terminology string for the active pack. */
export function useTerm(key: keyof CountryPackTerms): string | null {
  const pack = useI18n()
  return pack.terms[key]
}

/** Returns whether a compliance/legal tab is visible in the active pack. */
export function useTabVisible(key: keyof CountryPackTabVisibility): boolean {
  const pack = useI18n()
  return pack.tabVisibility[key] ?? false
}
