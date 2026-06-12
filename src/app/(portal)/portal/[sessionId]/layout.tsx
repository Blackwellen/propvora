import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { isExternalPortalEnabled } from "@/lib/portal/flags"
import { getSessionForRoute } from "@/lib/portal/session"
import PortalShell from "@/components/shells/PortalShell"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// The [sessionId] layout is the server-side gate for the rendered portal.
// It validates the session cookie AND asserts it matches the URL's sessionId
// (a valid cookie for session A cannot render session B). Any failure
// redirects to /portal/login. The validated session drives the shell brand.
export default async function PortalSessionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ sessionId: string }>
}) {
  if (!isExternalPortalEnabled()) {
    redirect("/portal/expired")
  }

  const { sessionId } = await params
  const session = await getSessionForRoute(sessionId)
  if (!session) {
    redirect("/portal/login")
  }

  // Resolve a friendly display name for the signed-in external contact.
  let displayName =
    session.portalType === "landlord"
      ? "Landlord"
      : session.portalType === "tenant"
        ? "Tenant"
        : "Supplier"
  if (session.contactId) {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from("contacts")
        .select("display_name, company")
        .eq("id", session.contactId)
        .eq("workspace_id", session.workspaceId)
        .maybeSingle()
      if (data) {
        displayName =
          (data.company as string) ||
          (data.display_name as string) ||
          displayName
      }
    } catch {
      /* tolerate — keep generic name */
    }
  }

  return (
    <PortalShell
      sessionId={session.id}
      kind={session.portalType}
      workspaceName={session.workspaceName}
      displayName={displayName}
    >
      {children}
    </PortalShell>
  )
}
