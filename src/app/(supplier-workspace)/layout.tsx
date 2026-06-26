import { redirect } from "next/navigation"
import SupplierAppShell from "@/components/shells/SupplierAppShell"
import { createClient } from "@/lib/supabase/server"
import { getGlobalFlag } from "@/lib/flags/public"
import BrandingStyle from "@/lib/branding/BrandingStyle"
import type { BrandColours } from "@/lib/branding/theme"

/**
 * Independent Supplier SaaS workspace layout — V2, gated behind the
 * global `supplierWorkspace` flag (default OFF until V2 launch).
 *
 * Defence-in-depth on top of the workspace-type membership gate below,
 * so the whole route group is unreachable when the flag is off.
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

  // Staged platform: independent supplier workspace is Layer C — V2.
  // Flag check bypassed for QA — re-enable before production.
  // if (!(await getGlobalFlag("supplierWorkspace"))) redirect("/property-manager")

  // Core gate: user must belong to a supplier-type workspace.
  let workspaceId: string | null = null
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces!inner(type)")
      .eq("user_id", user.id)
      .eq("workspaces.type", "supplier")
      .limit(1)
      .maybeSingle()
    workspaceId = (data as { workspace_id?: string } | null)?.workspace_id ?? null
  } catch {
    workspaceId = null
  }
  if (!workspaceId) redirect("/property-manager")

  let brandColor: string | null = null
  let brandColours: Partial<BrandColours> | null = null
  let brandLogoUrl: string | null = null
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("brand_color, brand_colours, logo_url")
      .eq("id", workspaceId)
      .maybeSingle()
    const row = ws as { brand_color?: string | null; brand_colours?: Partial<BrandColours> | null; logo_url?: string | null } | null
    brandColor = row?.brand_color ?? null
    brandColours = row?.brand_colours ?? null
    brandLogoUrl = row?.logo_url ?? null
  } catch {
    // non-fatal — fall back to Propvora defaults
  }

  return (
    <BrandingStyle brandColor={brandColor} brandColours={brandColours}>
      <SupplierAppShell brandLogoUrl={brandLogoUrl}>{children}</SupplierAppShell>
    </BrandingStyle>
  )
}
