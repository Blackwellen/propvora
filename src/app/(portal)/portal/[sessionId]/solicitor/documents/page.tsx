import { requirePortalSession } from "../../_guard"
import { getLinkedPropertyDocuments } from "@/lib/portal/data"
import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function SolicitorDocumentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "solicitor")
  const base = `/portal/${session.id}/solicitor`

  const docs = (await getLinkedPropertyDocuments(session)) as unknown as PortalDoc[]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Legal documents"
        subtitle="Conveyancing, tenancy, possession and compliance documents shared for your matters."
        backHref={base}
      />
      <PortalDocumentsClient
        docs={docs} base={base}
        filters={["All", "Legal", "Tenancy", "Compliance", "Certificates", "Other"]}
      />
    </div>
  )
}
