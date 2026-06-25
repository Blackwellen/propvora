"use client"

/**
 * useComplianceRequirements — the merged (built-in + workspace-custom) compliance
 * requirement set for the active workspace jurisdiction, plus the jurisdiction
 * note. This is the single hook the compliance UI should use to render requirement
 * pickers, so customisations made in Compliance Settings flow everywhere.
 */

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { getComplianceJurisdiction, type ComplianceRequirementDef, type ComplianceJurisdictionNote } from "./requirements"
import { fetchCustomRequirements, mergeRequirements, type CustomRequirementRow } from "./customRequirements"

export interface UseComplianceRequirementsResult {
  requirements: ComplianceRequirementDef[]
  note: ComplianceJurisdictionNote
  customRows: CustomRequirementRow[]
  loading: boolean
}

export function useComplianceRequirements(): UseComplianceRequirementsResult {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { countryCode, settings } = useWorkspaceJurisdiction()
  const region = (settings as { region?: string }).region

  const { reqs: builtIn, note } = getComplianceJurisdiction(countryCode, region)

  const { data: customRows = [], isLoading } = useQuery({
    queryKey: ["compliance-custom-requirements", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as CustomRequirementRow[]
      return fetchCustomRequirements(createClient(), workspaceId)
    },
    enabled: !!workspaceId,
  })

  return {
    requirements: mergeRequirements(builtIn, customRows),
    note,
    customRows,
    loading: isLoading,
  }
}
