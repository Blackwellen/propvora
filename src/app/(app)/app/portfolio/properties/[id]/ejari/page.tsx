"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { HmoTab } from "@/components/portfolio/property-detail/HmoTab"

export default function PropertyEjariPage() {
  const { propertyId } = usePropertyDetailCtx()
  const { workspace } = useWorkspace()
  return <HmoTab propertyId={propertyId} workspaceId={workspace?.id} tabKey="ejari_prop" tabLabel="Ejari" />
}
