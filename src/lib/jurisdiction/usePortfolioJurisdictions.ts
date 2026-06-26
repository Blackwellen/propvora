"use client"

/**
 * usePortfolioJurisdictions — the distinct jurisdictions actually present in the
 * workspace's portfolio. Powers the section-lens switcher options (so the
 * operator only sees jurisdictions they hold property in) and the grouped views.
 */

import { useMemo } from "react"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { getCountryPack } from "@/lib/i18n/country-packs"

export interface PortfolioJurisdiction {
  countryCode: string
  region: string | null
  /** Display name (pack name; region label handled by JurisdictionChip). */
  name: string
  /** How many properties sit in this jurisdiction. */
  count: number
}

export function usePortfolioJurisdictions(): {
  jurisdictions: PortfolioJurisdiction[]
  isLoading: boolean
} {
  const { workspace } = useWorkspace()
  const ws = useWorkspaceJurisdiction()
  const { data: properties = [], isLoading } = useProperties(workspace?.id)

  const jurisdictions = useMemo(() => {
    const byKey = new Map<string, PortfolioJurisdiction>()
    for (const p of properties as { country_code?: string | null; region_code?: string | null }[]) {
      const cc = (p.country_code ?? "").toUpperCase().trim()
      if (!cc) continue
      const region = (p.region_code ?? "").toUpperCase().trim() || null
      const key = `${cc}:${region ?? ""}`
      const existing = byKey.get(key)
      if (existing) {
        existing.count += 1
      } else {
        byKey.set(key, { countryCode: cc, region, name: getCountryPack(cc).name, count: 1 })
      }
    }
    // Always include the workspace default so the lens has at least one option
    // even on an empty portfolio.
    if (byKey.size === 0) {
      const cc = ws.countryCode
      byKey.set(`${cc}:`, { countryCode: cc, region: null, name: getCountryPack(cc).name, count: 0 })
    }
    return [...byKey.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [properties, ws.countryCode])

  return { jurisdictions, isLoading }
}
