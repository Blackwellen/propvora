import { Wrench } from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getTenantMaintenance } from "@/lib/portal/data"
import { PortalPageHeader, PortalButtonLink } from "@/components/portals/portal-ui"
import PortalMaintenanceClient, { type MaintRow } from "@/components/portals/PortalMaintenanceClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function TenantMaintenancePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`
  const jobs = (await getTenantMaintenance(session)) as MaintRow[]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Maintenance requests" subtitle="Report repairs and track every issue on your home." backHref={base}
        actions={<PortalButtonLink href={`${base}/maintenance/report`} variant="primary" icon={Wrench}>Report a repair</PortalButtonLink>}
      />
      <PortalMaintenanceClient rows={jobs} base={base} />
    </div>
  )
}
