"use client"

import { useParams } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancyDetailCtx } from "../layout"
import { useTenancyActivity } from "@/components/portfolio/tenancy-detail/shared"
import { OverviewTab } from "@/components/portfolio/tenancy-detail/OverviewTab"

export default function TenancyOverviewPage() {
  const { t, save } = useTenancyDetailCtx()
  const params = useParams()
  const tenancyId = params.id as string
  const { workspace } = useWorkspace()
  const { events, loaded } = useTenancyActivity(workspace?.id, tenancyId)
  if (!t) return null
  return <OverviewTab t={t} activity={events} activityLoaded={loaded} onSave={save} />
}
