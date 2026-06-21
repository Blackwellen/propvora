import { ComplianceTabNav } from "@/components/compliance/ComplianceTabNav"
import { createClient } from "@/lib/supabase/server"
import { getCountryPack } from "@/lib/i18n/country-packs"
import type { CountryPackTabVisibility } from "@/lib/i18n/country-packs"

export const dynamic = "force-dynamic"

async function getWorkspaceCountryCode(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return "GB"
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()
    const wsId = (profile as { current_workspace_id?: string } | null)?.current_workspace_id
    if (!wsId) return "GB"
    // Try preferences_json first (from the workspace settings page)
    const { data: ws } = await supabase
      .from("workspace_settings")
      .select("preferences_json")
      .eq("workspace_id", wsId)
      .maybeSingle()
    const prefs = (ws as { preferences_json?: Record<string, string> } | null)?.preferences_json
    if (prefs?.countryCode) return prefs.countryCode
    // Fall back to workspaces.business_country_code
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("business_country_code")
      .eq("id", wsId)
      .maybeSingle()
    return (workspace as { business_country_code?: string } | null)?.business_country_code ?? "GB"
  } catch {
    return "GB"
  }
}

export default async function ComplianceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const countryCode = await getWorkspaceCountryCode()
  const pack = getCountryPack(countryCode)
  const tabVisibility: CountryPackTabVisibility = pack.tabVisibility

  return (
    <div className="bg-slate-50 min-h-screen -mx-6 -mt-6">
      {/* Canonical section header: title above the persistent tab rail */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Compliance</h1>
        <p className="mt-1 text-sm text-slate-500">Risk, renewals and evidence control centre.</p>
      </div>
      <ComplianceTabNav tabVisibility={tabVisibility} />
      <div className="px-6 pt-0">{children}</div>
    </div>
  )
}
