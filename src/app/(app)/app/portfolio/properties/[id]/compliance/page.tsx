"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { useComplianceItems } from "@/components/portfolio/property-detail/shared"
import { ComplianceTab } from "@/components/portfolio/property-detail/ComplianceTab"

export default function PropertyCompliancePage() {
  const { propertyId } = usePropertyDetailCtx()
  const { workspace } = useWorkspace()
  const { items, loaded } = useComplianceItems(workspace?.id, propertyId)
  return <ComplianceTab items={items} loaded={loaded} propertyId={propertyId} />
}
