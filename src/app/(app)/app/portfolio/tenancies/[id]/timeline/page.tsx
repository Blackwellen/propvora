"use client"

import { useParams } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancyActivity } from "@/components/portfolio/tenancy-detail/shared"
import { TimelineTab } from "@/components/portfolio/tenancy-detail/TimelineTab"

export default function TenancyTimelinePage() {
  const params = useParams()
  const { workspace } = useWorkspace()
  const { events, loaded } = useTenancyActivity(workspace?.id, params.id as string)
  return <TimelineTab events={events} loaded={loaded} />
}
