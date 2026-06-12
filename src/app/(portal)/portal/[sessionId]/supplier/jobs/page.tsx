import { requirePortalSession } from "../../_guard"
import { getSupplierJobs } from "@/lib/portal/data"
import JobsList from "./JobsList"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function SupplierJobsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const jobs = await getSupplierJobs(session)
  return <JobsList jobs={jobs} base={`/portal/${session.id}/supplier`} />
}
