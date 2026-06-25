"use client"

/**
 * useLegalJurisdiction — the merged (built-in + workspace-custom) legal
 * jurisdiction for the active workspace. Single hook the Legal UI uses so
 * customisations made in Legal Settings flow into the section gate, the
 * Overview cards and the jurisdiction panel. Parity with
 * useComplianceRequirements.
 */

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { getLegalJurisdiction } from "@/lib/legal/jurisdiction"
import {
  fetchCustomLegalModules,
  mergeLegalModules,
  type CustomLegalModuleRow,
  type MergedLegalJurisdiction,
} from "@/lib/legal/customModules"

export interface UseLegalJurisdictionResult {
  jurisdiction: MergedLegalJurisdiction
  customRows: CustomLegalModuleRow[]
  loading: boolean
}

export function useLegalJurisdiction(): UseLegalJurisdictionResult {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { countryCode, settings, isLoading } = useWorkspaceJurisdiction()
  const region = (settings as { region?: string }).region

  const base = getLegalJurisdiction(countryCode, region)

  const { data: customRows = [], isLoading: rowsLoading } = useQuery({
    queryKey: ["legal-custom-modules", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as CustomLegalModuleRow[]
      return fetchCustomLegalModules(createClient(), workspaceId)
    },
    enabled: !!workspaceId,
  })

  return {
    jurisdiction: mergeLegalModules(base, customRows),
    customRows,
    loading: isLoading || rowsLoading,
  }
}
