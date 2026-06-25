"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { HmoTab } from "@/components/portfolio/property-detail/HmoTab"

export default function PropertyBondPage() {
  const { propertyId } = usePropertyDetailCtx()
  const { workspace } = useWorkspace()
  return <HmoTab propertyId={propertyId} workspaceId={workspace?.id} tabKey="bond_au_prop" tabLabel="Bond" />
}
