import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import AppShell from "@/components/shell/AppShell"
import BrandingStyle from "@/lib/branding/BrandingStyle"
import { createClient } from "@/lib/supabase/server"
import { resolveNavFlags, resolveFlags } from "@/lib/flags"
import { normaliseTier, PLAN_DISPLAY } from "@/lib/billing/plans"
import type { BrandColours } from "@/lib/branding/theme"
import { WorkspaceLocaleProvider } from "@/lib/i18n/WorkspaceLocaleProvider"
import { LocaleProvider } from "@/components/i18n/LocaleProvider"
import { getServerLocale } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/config"
import { JurisdictionContextProvider } from "@/lib/jurisdiction/context"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fetch the workspace plan server-side so feature gates are enforced here,
  // never on the client. Default to 'trial' if not resolvable.
  let aiCopilotEnabled = false
  /** True when plan = 'trial': AI + automations blocked, inbox stays open. */
  let isTrial = false
  let brandColor: string | null = null
  let brandColours: Partial<BrandColours> | null = null
  let wsLocale: Locale = "en-GB"
  const wsCurrency = "GBP"
  const wsTimezone = "Europe/London"
  const wsDateFormat = "DD/MM/YYYY"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Unauthenticated → sign in.
  if (!user) {
    redirect("/login?redirectTo=/property-manager")
  }

  // Resolve the user's active workspace; route to onboarding if they have none.
  let workspaceId: string | null = null
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()

    workspaceId = profile?.current_workspace_id ?? null

    if (!workspaceId) {
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()
      workspaceId = membership?.workspace_id ?? null
    }
  } catch {
    // Non-fatal — treat as no workspace below.
  }

  if (!workspaceId) {
    redirect("/onboarding")
  }

  // Resolve nav-relevant feature flags server-side (workspace override → global
  // → registry default OFF) and apply parent/child dependency rules. Passed to
  // the shell so V2/V1.5 surfaces never appear in the operator nav while off.
  const navFlags = await resolveNavFlags({ supabase, workspaceId })

  // Escrow / holds / marketplace-disputes are marketplace-payment (Layer D)
  // surfaces that happen to live under Money. Money BASICS stay in V1, but these
  // sub-routes are gated behind their flags (which themselves require the
  // marketplace master + payments via the dependency rules). Redirect to Money
  // when off so there's no V2 surface leak by direct URL.
  const v2Gates = await resolveFlags(
    ["marketplaceEscrow", "marketplaceDisputes", "accountingGl", "automationsFull"],
    { supabase, workspaceId }
  )
  let pathname = ""
  try {
    pathname = (await headers()).get("x-pathname") ?? ""
  } catch {
    pathname = ""
  }
  const inEscrow = pathname.startsWith("/property-manager/money/escrow") || pathname.startsWith("/property-manager/money/holds")
  const inDisputes = pathname.startsWith("/property-manager/money/disputes") || pathname.startsWith("/property-manager/bookings/disputes")
  // Full double-entry GL is Layer D — Money basics stay in V1, the GL is gated.
  const inGl = pathname.startsWith("/property-manager/accounting")
  // Full automation canvas/webhooks/integrations are Layer D; automations-lite stays.
  const inCanvas =
    pathname.startsWith("/property-manager/automations/canvas") ||
    pathname.startsWith("/property-manager/automations/builder") ||
    pathname.startsWith("/property-manager/automations/webhooks") ||
    pathname.startsWith("/property-manager/automations/integrations")
  if (inEscrow && !v2Gates.marketplaceEscrow) redirect("/property-manager/money")
  if (inDisputes && !v2Gates.marketplaceDisputes) redirect("/property-manager/money")
  if (inGl && !v2Gates.accountingGl) redirect("/property-manager/money")
  if (inCanvas && !v2Gates.automationsFull) redirect("/property-manager/automations")

  try {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("plan, plan_status, brand_color, brand_colours")
      .eq("id", workspaceId)
      .maybeSingle()

    if (workspace?.plan) {
      const rawPlan = workspace.plan as string
      // Free-trial workspaces: AI and automations are gated; only inbox stays open.
      isTrial = rawPlan.toLowerCase() === "trial"
      // Use the V2-authoritative normaliseTier + PLAN_DISPLAY so that V2 plan
      // names (starter/operator/scale/pro_agency/enterprise) stored in the DB
      // are handled correctly. The legacy canAccess() only knew V1 names and
      // would return false for any V2 plan name.
      const tier = normaliseTier(rawPlan)
      aiCopilotEnabled = PLAN_DISPLAY[tier].features.aiCopilot
    }
    brandColor = (workspace?.brand_color as string | null) ?? null
    brandColours = (workspace?.brand_colours as Partial<BrandColours> | null) ?? null

    // Enforce subscription status — canceled/suspended workspaces are redirected
    // to the subscription page. Allow /workspace-settings/* through so operators
    // can reactivate without being stuck in a loop.
    const planStatus = (workspace as Record<string, unknown> | null)?.plan_status as string | null
    if (planStatus === "canceled" || planStatus === "suspended") {
      const h = await headers()
      const pathname = h.get("x-pathname") ?? ""
      const SETTINGS_PREFIX = "/property-manager/workspace-settings"
      if (!pathname.startsWith(SETTINGS_PREFIX)) {
        redirect(`${SETTINGS_PREFIX}/subscription`)
      }
    }

    // Workspace locale/currency defaults are NOT columns on workspace_settings in
    // the live schema (it carries feature-config jsonb blobs instead), so we use
    // the app defaults declared above. Per-user locale lives on `profiles`.
  } catch {
    // Non-fatal — default to restricted access + default branding.
  }

  // Resolve the active locale for this request: user preference → workspace default
  // → Accept-Language → en-GB. This drives both LocaleProvider (useT() strings)
  // and WorkspaceLocaleProvider (money/date formatting).
  try {
    wsLocale = await getServerLocale() as Locale
  } catch {
    // Non-fatal — keep en-GB default.
  }

  return (
    <BrandingStyle brandColor={brandColor} brandColours={brandColours}>
      <LocaleProvider locale={wsLocale}>
        <WorkspaceLocaleProvider
          locale={wsLocale}
          currency={wsCurrency}
          timezone={wsTimezone}
          dateFormat={wsDateFormat}
        >
          <JurisdictionContextProvider>
            <AppShell aiCopilotEnabled={aiCopilotEnabled} isTrial={isTrial} navFlags={navFlags}>{children}</AppShell>
          </JurisdictionContextProvider>
        </WorkspaceLocaleProvider>
      </LocaleProvider>
    </BrandingStyle>
  )
}
