"use client"

import { useParams } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUnit, useUpdateUnit } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { useContacts } from "@/hooks/useContacts"
import { UnitOverviewTab } from "@/components/portfolio/unit-detail/UnitOverviewTab"

export default function UnitOverviewPage() {
  const params = useParams()
  const unitId = params.id as string
  const { workspace } = useWorkspace()
  const { data: unit } = useUnit(workspace?.id, unitId)
  const { data: tenancies = [] } = useTenancies(workspace?.id)
  const { data: contacts = [] } = useContacts(workspace?.id)
  const updateUnit = useUpdateUnit()

  const unitTenancies = tenancies.filter(t => t.unit_id === unitId)
  const tenancy = unitTenancies.find(t => t.status === "active") ?? unitTenancies[0] ?? null
  const tenant = tenancy?.tenant_contact_id
    ? contacts.find(c => c.id === tenancy.tenant_contact_id) ?? null
    : null

  async function save(field: string, value: unknown) {
    if (!workspace?.id || !unit) return
    await updateUnit.mutateAsync({ id: unitId, workspaceId: workspace.id, payload: { [field]: value } })
  }

  if (!unit) return null
  return <UnitOverviewTab unit={unit} tenancy={tenancy} tenant={tenant} onSave={save} />
}
