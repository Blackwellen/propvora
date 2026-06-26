"use client"

/**
 * JurisdictionContextProvider + useActiveJurisdiction — the SECTION-LENS layer.
 *
 * Section overviews (Compliance, Legal, Money, Portfolio, Home, Calendar) are
 * not tied to one property — an operator works ACROSS jurisdictions in a single
 * session ("UAE one minute, UK the next"). So these surfaces use a switchable
 * LENS: the operator picks a jurisdiction to focus, or "All (grouped)" to see
 * every regime in a mixed portfolio. The default is the workspace's default
 * jurisdiction.
 *
 * This is distinct from usePropertyJurisdiction (record-true, locked to the
 * asset). Both compose: a Compliance overview is lens-driven; each property row
 * inside it is record-true.
 *
 * Persistence: V1 stores the lens per user+section in localStorage so "show me
 * UAE compliance" sticks until switched back. The cross-device
 * user_section_jurisdiction_lens table is a later enhancement.
 *
 * Mount this provider inside AppShell (operator) below WorkspaceLocaleProvider.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { getLegalJurisdiction } from "@/lib/legal/jurisdiction"
import { getCountryPack, type CountryPack } from "@/lib/i18n/country-packs"

/** "ALL" = grouped view across every jurisdiction in the portfolio. */
export type SectionLens = { countryCode: string; region: string | null } | "ALL"

interface JurisdictionContextValue {
  /** Workspace default country/region (the fallback lens). */
  defaultCountryCode: string
  defaultRegion: string | null
  /** Per-section lens map (section key → lens). */
  lenses: Record<string, SectionLens>
  setLens: (sectionKey: string, lens: SectionLens) => void
}

const JurisdictionContext = createContext<JurisdictionContextValue | null>(null)

const STORAGE_KEY = "propvora.jurisdiction.lenses.v1"

function readStored(): Record<string, SectionLens> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, SectionLens>) : {}
  } catch {
    return {}
  }
}

export function JurisdictionContextProvider({ children }: { children: ReactNode }) {
  const ws = useWorkspaceJurisdiction()
  const defaultRegion = (ws.settings as { region?: string }).region ?? null
  const [lenses, setLenses] = useState<Record<string, SectionLens>>({})

  // Hydrate persisted lenses on mount (client-only; avoids SSR mismatch).
  useEffect(() => {
    setLenses(readStored())
  }, [])

  const setLens = useCallback((sectionKey: string, lens: SectionLens) => {
    setLenses((prev) => {
      const next = { ...prev, [sectionKey]: lens }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable (private mode) — in-memory only */
      }
      return next
    })
  }, [])

  const value = useMemo<JurisdictionContextValue>(
    () => ({
      defaultCountryCode: ws.countryCode,
      defaultRegion,
      lenses,
      setLens,
    }),
    [ws.countryCode, defaultRegion, lenses, setLens],
  )

  return <JurisdictionContext.Provider value={value}>{children}</JurisdictionContext.Provider>
}

export interface ActiveJurisdiction {
  /** The lens: a specific jurisdiction or "ALL" (grouped). */
  lens: SectionLens
  /** Resolved country code when the lens is a single jurisdiction; null when "ALL". */
  countryCode: string | null
  region: string | null
  /** True when the operator is viewing all jurisdictions grouped. */
  isGrouped: boolean
  /** Legal framework for the focused jurisdiction (null when grouped). */
  legal: ReturnType<typeof getLegalJurisdiction> | null
  /** Country pack for the focused jurisdiction (null when grouped). */
  pack: CountryPack | null
  /** Switch the lens for this section (persists). */
  setLens: (lens: SectionLens) => void
}

/**
 * The active section lens. Provide a stable `sectionKey` (e.g. "compliance").
 * `defaultToGrouped` makes the section start in "All (grouped)" mode (used by
 * Compliance + Legal so a mixed portfolio shows every regime by default).
 */
export function useActiveJurisdiction(opts: {
  sectionKey: string
  defaultToGrouped?: boolean
}): ActiveJurisdiction {
  const ctx = useContext(JurisdictionContext)
  // Graceful fallback when used outside the provider (e.g. isolated render):
  // resolve to workspace default with no persistence.
  const ws = useWorkspaceJurisdiction()
  const fallbackRegion = (ws.settings as { region?: string }).region ?? null

  const stored = ctx?.lenses[opts.sectionKey]
  const lens: SectionLens =
    stored ??
    (opts.defaultToGrouped
      ? "ALL"
      : { countryCode: ctx?.defaultCountryCode ?? ws.countryCode, region: ctx?.defaultRegion ?? fallbackRegion })

  const setLens = useCallback(
    (next: SectionLens) => ctx?.setLens(opts.sectionKey, next),
    [ctx, opts.sectionKey],
  )

  if (lens === "ALL") {
    return { lens, countryCode: null, region: null, isGrouped: true, legal: null, pack: null, setLens }
  }

  return {
    lens,
    countryCode: lens.countryCode,
    region: lens.region,
    isGrouped: false,
    legal: getLegalJurisdiction(lens.countryCode, lens.region ?? undefined),
    pack: getCountryPack(lens.countryCode),
    setLens,
  }
}
