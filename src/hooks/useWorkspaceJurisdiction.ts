"use client"

import { useQuery } from "@tanstack/react-query"
import { useWorkspace } from "@/providers/AuthProvider"

interface JurisdictionData {
  countryCode: string
  countryName: string | null
  currency: string | null
  locale: string | null
  effectiveStatus: string
  legalStatus: string
  taxStatus: string
  offerStatus: string | null
  packMissing: boolean
}

/**
 * Fetches the workspace's current jurisdiction (country code, currency, legal status).
 * Falls back to GB if the workspace or API is unavailable.
 */
export function useWorkspaceJurisdiction() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id

  return useQuery<JurisdictionData>({
    queryKey: ["workspace-jurisdiction", workspaceId],
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(
        `/api/workspace/jurisdiction?workspaceId=${encodeURIComponent(workspaceId!)}`,
        { credentials: "include" }
      )
      if (!res.ok) {
        // Non-fatal: fall back to GB defaults
        return {
          countryCode: "GB",
          countryName: "United Kingdom",
          currency: "GBP",
          locale: "en-GB",
          effectiveStatus: "reviewed",
          legalStatus: "reviewed",
          taxStatus: "reviewed",
          offerStatus: "offer",
          packMissing: false,
        }
      }
      const json = await res.json()
      // API returns { current: WorkspaceJurisdiction, countries, canEdit }
      const current = json.current as JurisdictionData | null
      if (!current) {
        return {
          countryCode: "GB",
          countryName: "United Kingdom",
          currency: "GBP",
          locale: "en-GB",
          effectiveStatus: "reviewed",
          legalStatus: "reviewed",
          taxStatus: "reviewed",
          offerStatus: "offer",
          packMissing: false,
        }
      }
      return current
    },
  })
}

/**
 * Returns just the country code, defaulting to 'GB'.
 */
export function useCountryCode(): string {
  const { data } = useWorkspaceJurisdiction()
  return data?.countryCode ?? "GB"
}
