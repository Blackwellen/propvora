"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { FinancesTab } from "@/components/portfolio/property-detail/FinancesTab"

export default function PropertyFinancesPage() {
  const { propertyId, prop } = usePropertyDetailCtx()
  const { workspace } = useWorkspace()
  const { data: units = [] } = useUnits(workspace?.id, propertyId)
  const { data: tenancies = [] } = useTenancies(workspace?.id, propertyId)
  if (!prop) return null
  return <FinancesTab tenanciesList={tenancies} unitsList={units} prop={prop} />
}
