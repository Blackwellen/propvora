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
import { usePropertyJurisdiction } from "@/lib/jurisdiction/usePropertyJurisdiction"
import { getComplianceJurisdiction, type ComplianceRequirementDef, type ComplianceJurisdictionNote } from "./requirements"
import { fetchCustomRequirements, mergeRequirements, type CustomRequirementRow } from "./customRequirements"

export interface UseComplianceRequirementsResult {
  requirements: ComplianceRequirementDef[]
  note: ComplianceJurisdictionNote
  customRows: CustomRequirementRow[]
  loading: boolean
}

export function useComplianceRequirements(
  /**
   * Optional jurisdiction override. When omitted, resolves to the workspace
   * default (back-compat). Pass a property's `country_code`/`region_code` to get
   * that PROPERTY's requirement set — a German property shows DE certs even in a
   * UK workspace. Use `usePropertyComplianceRequirements(propertyId)` for the
   * common case.
   */
  override?: { countryCode?: string | null; region?: string | null },
): UseComplianceRequirementsResult {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const ws = useWorkspaceJurisdiction()
  const countryCode = (override?.countryCode || ws.countryCode) as string
  const region = override?.region ?? (ws.settings as { region?: string }).region

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

/**
 * Property-scoped compliance requirements — resolves the property's record-true
 * jurisdiction and returns that property's certificate set (not the workspace
 * default). Use on Property ▸ Compliance and the per-property cert wizards.
 */
export function usePropertyComplianceRequirements(
  propertyId: string | undefined,
): UseComplianceRequirementsResult {
  const jur = usePropertyJurisdiction(propertyId)
  return useComplianceRequirements({ countryCode: jur.countryCode, region: jur.region })
}
