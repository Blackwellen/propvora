"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyDetailCtx } from "../layout"
import { useJobs } from "@/hooks/useJobs"
import { useTasks } from "@/hooks/useTasks"
import { WorkTab } from "@/components/portfolio/property-detail/WorkTab"

export default function PropertyWorkPage() {
  const { propertyId } = usePropertyDetailCtx()
  const { workspace } = useWorkspace()
  const { data: jobs = [] } = useJobs(workspace?.id, { property_id: propertyId })
  const { data: tasks = [] } = useTasks(workspace?.id, { property_id: propertyId })
  return <WorkTab jobs={jobs} tasks={tasks} propertyId={propertyId} />
}
