"use client"

import { useParams } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUnit, useUpdateUnit } from "@/hooks/useUnits"
import { useUnitComplianceItems } from "@/components/portfolio/unit-detail/shared"
import { UnitSpecificationsTab } from "@/components/portfolio/unit-detail/UnitSpecificationsTab"

export default function UnitSpecificationsPage() {
  const params = useParams()
  const unitId = params.id as string
  const { workspace } = useWorkspace()
  const { data: unit } = useUnit(workspace?.id, unitId)
  const { items: complianceItems, loaded: complianceLoaded } = useUnitComplianceItems(workspace?.id, unitId)
  const updateUnit = useUpdateUnit()

  async function save(field: string, value: unknown) {
    if (!workspace?.id || !unit) return
    await updateUnit.mutateAsync({ id: unitId, workspaceId: workspace.id, payload: { [field]: value } })
  }

  if (!unit) return null
  return <UnitSpecificationsTab unit={unit} complianceItems={complianceItems} complianceLoaded={complianceLoaded} onSave={save} />
}
