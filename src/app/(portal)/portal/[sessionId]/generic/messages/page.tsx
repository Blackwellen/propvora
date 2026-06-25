import { requirePortalSession } from "../../_guard"
import { loadPortalInbox } from "@/lib/portal/messaging-server"
import PortalMessages from "@/components/portals/PortalMessages"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function GenericPortalMessages({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "generic")
  const inbox = await loadPortalInbox(session)
  return <PortalMessages {...inbox} />
}
