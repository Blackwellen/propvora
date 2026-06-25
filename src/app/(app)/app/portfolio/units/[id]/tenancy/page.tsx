"use client"

import { useParams } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancies } from "@/hooks/useTenancies"
import { useContacts } from "@/hooks/useContacts"
import { UnitTenancyTab } from "@/components/portfolio/unit-detail/UnitTenancyTab"

export default function UnitTenancyPage() {
  const params = useParams()
  const unitId = params.id as string
  const { workspace } = useWorkspace()
  const { data: tenancies = [] } = useTenancies(workspace?.id)
  const { data: contacts = [] } = useContacts(workspace?.id)

  const unitTenancies = tenancies.filter(t => t.unit_id === unitId)
  const tenancy = unitTenancies.find(t => t.status === "active") ?? unitTenancies[0] ?? null
  const tenant = tenancy?.tenant_contact_id
    ? contacts.find(c => c.id === tenancy.tenant_contact_id) ?? null
    : null

  return <UnitTenancyTab unitId={unitId} tenancy={tenancy} tenant={tenant} />
}
