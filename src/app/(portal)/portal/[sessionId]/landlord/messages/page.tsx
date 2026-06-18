import { requirePortalSession } from "../../_guard"
import { loadPortalInbox } from "@/lib/portal/messaging-server"
import PortalMessages from "@/components/portals/PortalMessages"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function LandlordPortalMessages({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const inbox = await loadPortalInbox(session)
  return <PortalMessages {...inbox} />
}
