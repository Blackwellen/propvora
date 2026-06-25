"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { TenanciesTab } from "@/components/portfolio/property-detail/TenanciesTab"

export default function PropertyTenanciesPage() {
  const { propertyId } = usePropertyDetailCtx()
  const { workspace } = useWorkspace()
  const { data: units = [] } = useUnits(workspace?.id, propertyId)
  const { data: tenancies = [] } = useTenancies(workspace?.id, propertyId)
  return <TenanciesTab propertyId={propertyId} tenanciesList={tenancies} unitsList={units} />
}
