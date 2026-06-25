"use client"

import { useCountryCode } from "@/hooks/useWorkspaceJurisdiction"
import {
  getTabsForCountry,
  COMPLIANCE_TABS,
  MONEY_TABS,
  PORTFOLIO_TABS,
  LEGAL_TABS,
  UNIT_DETAIL_TABS,
  TENANCY_DETAIL_TABS,
  PROPERTY_DETAIL_TABS,
  type TabDef,
  type TabDefI18n,
  type SectionName,
} from "./tab-config"

const SECTION_TABS: Record<SectionName, TabDef[]> = {
  compliance: COMPLIANCE_TABS,
  money: MONEY_TABS,
  portfolio: PORTFOLIO_TABS,
  legal: LEGAL_TABS,
  work: [],         // work tabs are universal
  planning: [],     // planning tabs are universal
  unit_detail: UNIT_DETAIL_TABS,
  tenancy_detail: TENANCY_DETAIL_TABS,
  property_detail: PROPERTY_DETAIL_TABS,
}

/**
 * Returns the filtered + sorted tabs for the given section based on the
 * workspace's current country code. Defaults to GB (all UK tabs visible).
 */
export function useCountryTabs(section: SectionName): TabDef[] {
  const countryCode = useCountryCode()
  return getTabsForCountry(SECTION_TABS[section], countryCode)
}

/**
 * Like useCountryTabs but also resolves the localised label for i18n-aware
 * sections (unit_detail, tenancy_detail). Returns tabs with their display
 * label already resolved for the workspace locale.
 */
export function useI18nTabs(section: SectionName): { key: string; label: string }[] {
  const countryCode = useCountryCode().toUpperCase()
  const filtered = getTabsForCountry(SECTION_TABS[section], countryCode)
  return filtered.map((t) => {
    const tab = t as TabDefI18n
    const label = tab.localizedLabels?.[countryCode] ?? tab.label
    return { key: tab.key, label }
  })
}
