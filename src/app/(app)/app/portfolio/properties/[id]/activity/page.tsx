"use client"

import React from "react"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { useActivityLog } from "@/components/portfolio/property-detail/shared"
import { ActivityTab } from "@/components/portfolio/property-detail/ActivityTab"

export default function PropertyActivityPage() {
  const { propertyId } = usePropertyDetailCtx()
  const { workspace } = useWorkspace()
  const { data: units = [] } = useUnits(workspace?.id, propertyId)
  const { data: tenancies = [] } = useTenancies(workspace?.id, propertyId)

  const activityIds = React.useMemo(
    () => [propertyId, ...units.map((u) => u.id), ...tenancies.map((t) => t.id)],
    [propertyId, units, tenancies]
  )
  const { events, loaded } = useActivityLog(workspace?.id, activityIds)
  return <ActivityTab events={events} loaded={loaded} />
}
