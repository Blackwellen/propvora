"use client"

import { useParams } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancies } from "@/hooks/useTenancies"
import { useActivityLog } from "@/components/portfolio/unit-detail/shared"
import { UnitActivityTab } from "@/components/portfolio/unit-detail/UnitActivityTab"

export default function UnitActivityPage() {
  const params = useParams()
  const unitId = params.id as string
  const { workspace } = useWorkspace()
  const { data: tenancies = [] } = useTenancies(workspace?.id)
  const tenancy = tenancies.find(t => t.unit_id === unitId && t.status === "active") ?? tenancies.find(t => t.unit_id === unitId) ?? null
  const { events, loaded } = useActivityLog(workspace?.id, [unitId, ...(tenancy ? [tenancy.id] : [])])
  return <UnitActivityTab events={events} loaded={loaded} />
}
