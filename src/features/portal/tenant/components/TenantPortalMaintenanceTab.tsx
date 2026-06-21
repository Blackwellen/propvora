import { Wrench } from "lucide-react"
import { PortalPageHeader, PortalButtonLink } from "@/components/portals/portal-ui"
import PortalMaintenanceClient, { type MaintRow } from "@/components/portals/PortalMaintenanceClient"

interface TenantPortalMaintenanceTabProps {
  rows: MaintRow[]
  base: string
}

export function TenantPortalMaintenanceTab({ rows, base }: TenantPortalMaintenanceTabProps) {
  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Maintenance requests"
        subtitle="Report repairs and track every issue on your home."
        backHref={base}
        actions={
          <PortalButtonLink href={`${base}/maintenance/report`} variant="primary" icon={Wrench}>
            Report a repair
          </PortalButtonLink>
        }
      />
      <PortalMaintenanceClient rows={rows} base={base} />
    </div>
  )
}
