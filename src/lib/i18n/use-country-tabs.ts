"use client"

import { useCountryCode } from "@/hooks/useWorkspaceJurisdiction"
import {
  getTabsForCountry,
  COMPLIANCE_TABS,
  MONEY_TABS,
  PORTFOLIO_TABS,
  LEGAL_TABS,
  type TabDef,
  type SectionName,
} from "./tab-config"

const SECTION_TABS: Record<SectionName, TabDef[]> = {
  compliance: COMPLIANCE_TABS,
  money: MONEY_TABS,
  portfolio: PORTFOLIO_TABS,
  legal: LEGAL_TABS,
  work: [],    // work tabs are universal
  planning: [], // planning tabs are universal
}

/**
 * Returns the filtered + sorted tabs for the given section based on the
 * workspace's current country code. Defaults to GB (all UK tabs visible).
 */
export function useCountryTabs(section: SectionName): TabDef[] {
  const countryCode = useCountryCode()
  return getTabsForCountry(SECTION_TABS[section], countryCode)
}
