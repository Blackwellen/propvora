"use client"

/**
 * usePropertyJurisdiction — the RECORD-TRUE jurisdiction of a single property.
 *
 * A property in Dubai is governed by UAE law even when the managing workspace
 * sits in the UK. So detail pages, wizards-on-a-property, possession cases,
 * certificates and invoices-on-a-property resolve their jurisdiction from the
 * PROPERTY's own country_code/region_code — NOT the workspace default. This is
 * the spine of the per-property internationalisation model.
 *
 * It layers on the existing packs:
 *   - getLegalJurisdiction(country, region)  → legal framework + disclaimer
 *   - getCountryPack(country)                → terminology, tabs, currency, format
 *
 * Falls back to the workspace default jurisdiction when the property has no
 * country set yet (legacy rows), and to GB-EW as the final backstop.
 */

import { useWorkspace } from "@/providers/AuthProvider"
import { useProperty } from "@/hooks/useProperties"
import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { getLegalJurisdiction } from "@/lib/legal/jurisdiction"
import { getCountryPack, type CountryPack } from "@/lib/i18n/country-packs"

export interface PropertyJurisdiction {
  /** ISO-3166-1 alpha-2 (e.g. "GB", "AE"). */
  countryCode: string
  /** Optional sub-jurisdiction (GB: "EW" | "SCT" | "NI"). */
  region: string | null
  /** Currency for this property (its country's, falling back to the pack). */
  currency: string
  /** BCP-47 locale for formatting in this property's context. */
  locale: string
  /** Legal framework + disclaimer for the property's jurisdiction. */
  legal: ReturnType<typeof getLegalJurisdiction>
  /** Country (property-law) pack: terminology, tab visibility, property types. */
  pack: CountryPack
  /**
   * True when the jurisdiction came from the property's own country_code.
   * False when we fell back to the workspace default (legacy/unset rows) — the
   * UI can prompt "set this property's country" in that case.
   */
  isRecordTrue: boolean
  isLoading: boolean
}

/**
 * Resolve a property's record-true jurisdiction.
 * Pass the property's id; the workspace is read from context.
 */
export function usePropertyJurisdiction(propertyId: string | undefined): PropertyJurisdiction {
  const { workspace } = useWorkspace()
  const ws = useWorkspaceJurisdiction()
  const { data: property, isLoading } = useProperty(workspace?.id, propertyId)

  // The adapter surfaces country_code/region_code from the live columns. Legacy
  // rows may have neither — fall back to the workspace default jurisdiction.
  const p = property as { country_code?: string | null; region_code?: string | null; currency?: string | null } | null
  const propCountry = (p?.country_code ?? "").toUpperCase().trim() || null
  const propRegion = (p?.region_code ?? "").toUpperCase().trim() || null

  const isRecordTrue = !!propCountry
  const countryCode = propCountry ?? ws.countryCode
  const region = propRegion ?? (isRecordTrue ? null : ((ws.settings as { region?: string }).region ?? null))

  const legal = getLegalJurisdiction(countryCode, region ?? undefined)
  const pack = getCountryPack(countryCode)
  const currency = (p?.currency ?? "").toUpperCase().trim() || pack.currency || ws.currency

  return {
    countryCode,
    region,
    currency,
    locale: pack.locale || ws.locale,
    legal,
    pack,
    isRecordTrue,
    isLoading,
  }
}
