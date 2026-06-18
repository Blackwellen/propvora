import { requirePortalSession } from "../../_guard"
import { getTenantDocuments } from "@/lib/portal/data"
import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function TenantDocumentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`
  const documents = (await getTenantDocuments(session)) as PortalDoc[]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Documents"
        subtitle="Your tenancy agreement, certificates, reports and shared records in one place."
        backHref={base}
      />
      <PortalDocumentsClient docs={documents} base={base} />
    </div>
  )
}
