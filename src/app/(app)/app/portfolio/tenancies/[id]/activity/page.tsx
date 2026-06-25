"use client"

import { useParams } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancyActivity } from "@/components/portfolio/tenancy-detail/shared"
import { ActivityTab } from "@/components/portfolio/tenancy-detail/ActivityTab"

export default function TenancyActivityPage() {
  const params = useParams()
  const { workspace } = useWorkspace()
  const { events, loaded } = useTenancyActivity(workspace?.id, params.id as string)
  return <ActivityTab events={events} loaded={loaded} />
}
