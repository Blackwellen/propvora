import { redirect } from "next/navigation"
import SupplierWorkspaceShell from "@/components/shells/SupplierWorkspaceShell"
import { createClient } from "@/lib/supabase/server"
import { WorkspaceLocaleProvider } from "@/lib/i18n/WorkspaceLocaleProvider"

/**
 * Supplier workspace layout (v2, first-class supplier-type workspace).
 *
 * This is NOT the V1 invited supplier-portal (`/supplier-portal`) — it is the
 * dedicated supplier workspace where a supplier manages their profile,
 * marketplace listings, quotes, jobs, earnings and reviews.
 *
 * Access is gated purely by real product membership (NO feature flags):
 * the signed-in user must be a member of a supplier-type workspace
 * (`supplier_workspace_members`), mirroring how `(customer)/layout.tsx` gates
 * on `customer_workspace_members`. Tolerant: if the membership table is not
 * present yet, the group simply isn't reachable and we redirect to /app.
 */
export default async function SupplierWorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/supplier")

  // Core gate: must belong to a supplier workspace.
  let workspaceId: string | null = null
  try {
    const { data } = await supabase
      .from("supplier_workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
    workspaceId = data?.workspace_id ?? null
  } catch {
    workspaceId = null
  }
  if (!workspaceId) redirect("/app")

  // Resolve a friendly display name (tolerant — falls back to "Supplier").
  let supplierName = "Supplier"
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .maybeSingle()
    if (ws?.name) supplierName = ws.name
  } catch {
    // keep default
  }

  // Fetch workspace member count server-side so the shell can conditionally
  // show the Team nav item (only when the workspace has 2+ members).
  // Uses workspace_members (the general membership table). Tolerant: falls
  // back to 1 (solo) if the query fails so the Team item simply stays hidden.
  let teamMemberCount = 1
  try {
    const { count } = await supabase
      .from("workspace_members")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
    teamMemberCount = count ?? 1
  } catch {
    // keep default — solo
  }

  let wsLocale = "en-GB"
  let wsCurrency = "GBP"
  let wsTimezone = "Europe/London"
  let wsDateFormat = "DD/MM/YYYY"
  try {
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
    // tolerate missing table
  }

  return (
    <WorkspaceLocaleProvider locale={wsLocale} currency={wsCurrency} timezone={wsTimezone} dateFormat={wsDateFormat}>
      <SupplierWorkspaceShell
        supplierName={supplierName}
        workspaceId={workspaceId}
        teamMemberCount={teamMemberCount}
      >
        {children}
      </SupplierWorkspaceShell>
    </WorkspaceLocaleProvider>
  )
}
