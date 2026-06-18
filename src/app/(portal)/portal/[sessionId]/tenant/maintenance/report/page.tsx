import { requirePortalSession } from "../../../_guard"
import { getTenantTenancies } from "@/lib/portal/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { PortalPageHeader } from "@/components/portals/portal-ui"
import ReportRepairWizard from "@/components/portals/ReportRepairWizard"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function TenantReportRepairPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`

  const tenancies = await getTenantTenancies(session)
  const current = tenancies.find((t) => t.status === "active") ?? tenancies[0] ?? null
  let propertyLabel = "Your home"
  if (current?.property_id) {
    try {
      const admin = createAdminClient()
      const { data } = await admin.from("properties").select("nickname, address_line1, city").eq("id", current.property_id).eq("workspace_id", session.workspaceId).maybeSingle()
      if (data) propertyLabel = (data.nickname as string) || [data.address_line1, data.city].filter(Boolean).join(", ") || "Your home"
    } catch { /* tolerate */ }
  }

  return (
    <div className="space-y-5">
      <PortalPageHeader title="Report a repair" subtitle="Tell us about the issue and we'll get it sorted." backHref={`${base}/maintenance`} backLabel="Back to maintenance" />
      <ReportRepairWizard sessionId={session.id} base={base} propertyLabel={propertyLabel} />
    </div>
  )
}
