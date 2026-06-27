import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isExternalPortalEnabled,
  isExtendedPortalProfilesEnabled,
} from "@/lib/portal/flags"
import { getSessionForRoute } from "@/lib/portal/session"
import { PORTAL_KIND_LABEL } from "@/components/shells/portal/portal-nav"
import PortalShell from "@/components/shells/PortalShell"
import { resolveBrand, brandCssVars } from "@/lib/branding/theme"
import { resolveWhiteLabel } from "@/lib/branding/white-label-core"

/** Extended profiles only render when the extended-profiles flag is enabled. */
const EXTENDED_PORTAL_TYPES = ["applicant", "accountant", "solicitor", "generic"] as const

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

  // Extended profiles (applicant / accountant / solicitor / generic) only
  // render when the extended-profiles flag is on. Fail closed: route a
  // flagged-off recipient to the expired surface rather than leaking the view.
  if (
    (EXTENDED_PORTAL_TYPES as readonly string[]).includes(session.portalType) &&
    !isExtendedPortalProfilesEnabled()
  ) {
    redirect("/portal/expired")
  }

  // Resolve a friendly display name for the signed-in external contact, plus the
  // owning workspace's branding + white-label config (drives portal colour, brand
  // name, and whether the "Powered by Propvora" footer shows).
  let displayName = PORTAL_KIND_LABEL[session.portalType] ?? "Portal"
  let brandColor: string | null = null
  let brandColours: Record<string, string> | null = null
  let whiteLabelSettings: Record<string, unknown> | null = null
  try {
    const admin = createAdminClient()
    const { data: ws } = await admin
      .from("workspaces")
      .select("brand_color, brand_colours, white_label_settings")
      .eq("id", session.workspaceId)
      .maybeSingle()
    if (ws) {
      brandColor = (ws.brand_color as string | null) ?? null
      brandColours = (ws.brand_colours as Record<string, string> | null) ?? null
      whiteLabelSettings = (ws.white_label_settings as Record<string, unknown> | null) ?? null
    }
    if (session.contactId) {
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
    }
  } catch {
    /* tolerate — keep generic name + Propvora defaults */
  }

  const wl = resolveWhiteLabel(whiteLabelSettings, session.workspaceName)
  const brandVars = brandCssVars(resolveBrand(brandColor, brandColours))

  return (
    <PortalShell
      sessionId={session.id}
      kind={session.portalType}
      workspaceName={wl.brandName}
      displayName={displayName}
      brandVars={brandVars}
      hidePoweredBy={wl.hidePoweredBy}
    >
      {children}
    </PortalShell>
  )
}
