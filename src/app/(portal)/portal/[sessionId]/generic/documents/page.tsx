import { requirePortalSession } from "../../_guard"
import { getLinkedPropertyDocuments } from "@/lib/portal/data"
import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function GenericDocumentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "generic")
  const base = `/portal/${session.id}/generic`

  const docs = (await getLinkedPropertyDocuments(session)) as unknown as PortalDoc[]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Documents"
        subtitle={`Files shared with you by ${session.workspaceName}.`}
        backHref={base}
      />
      <PortalDocumentsClient
        docs={docs} base={base}
        filters={["All", "Statements", "Compliance", "Legal", "Other"]}
      />
    </div>
  )
}
