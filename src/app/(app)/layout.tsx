import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import AppShell from "@/components/shell/AppShell"
import BrandingStyle from "@/lib/branding/BrandingStyle"
import { createClient } from "@/lib/supabase/server"
import { normaliseTier, PLAN_DISPLAY } from "@/lib/billing/plans"
import type { BrandColours } from "@/lib/branding/theme"
import { WorkspaceLocaleProvider } from "@/lib/i18n/WorkspaceLocaleProvider"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fetch the workspace plan server-side so feature gates are enforced here,
  // never on the client. Default to 'trial' if not resolvable.
  let aiCopilotEnabled = false
  let brandColor: string | null = null
  let brandColours: Partial<BrandColours> | null = null
  let wsLocale = "en-GB"
  let wsCurrency = "GBP"
  let wsTimezone = "Europe/London"
  let wsDateFormat = "DD/MM/YYYY"

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

  try {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("plan, plan_status, brand_color, brand_colours")
      .eq("id", workspaceId)
      .maybeSingle()

    if (workspace?.plan) {
      // Use the V2-authoritative normaliseTier + PLAN_DISPLAY so that V2 plan
      // names (starter/operator/scale/pro_agency/enterprise) stored in the DB
      // are handled correctly. The legacy canAccess() only knew V1 names and
      // would return false for any V2 plan name.
      const tier = normaliseTier(workspace.plan as string)
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

    // Load workspace locale settings (42P01-safe).
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("default_locale, default_currency, default_timezone, default_date_format")
      .eq("workspace_id", workspaceId)
      .maybeSingle()

    if (settings) {
      wsLocale = (settings.default_locale as string | null) ?? wsLocale
      wsCurrency = (settings.default_currency as string | null) ?? wsCurrency
      wsTimezone = (settings.default_timezone as string | null) ?? wsTimezone
      wsDateFormat = (settings.default_date_format as string | null) ?? wsDateFormat
    }
  } catch {
    // Non-fatal — default to restricted access + default branding.
  }

  return (
    <BrandingStyle brandColor={brandColor} brandColours={brandColours}>
      <WorkspaceLocaleProvider
        locale={wsLocale}
        currency={wsCurrency}
        timezone={wsTimezone}
        dateFormat={wsDateFormat}
      >
        <AppShell aiCopilotEnabled={aiCopilotEnabled}>{children}</AppShell>
      </WorkspaceLocaleProvider>
    </BrandingStyle>
  )
}
