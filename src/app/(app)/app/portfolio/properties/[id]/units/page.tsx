"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { useUnits } from "@/hooks/useUnits"
import { UnitsTab } from "@/components/portfolio/property-detail/UnitsTab"

export default function PropertyUnitsPage() {
  const { propertyId } = usePropertyDetailCtx()
  const { workspace } = useWorkspace()
  const { data: units = [] } = useUnits(workspace?.id, propertyId)
  return <UnitsTab unitsList={units} propertyId={propertyId} />
}
