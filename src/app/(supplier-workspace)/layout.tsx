import { redirect } from "next/navigation"
import SupplierAppShell from "@/components/shells/SupplierAppShell"
import { createClient } from "@/lib/supabase/server"
import { getGlobalFlag } from "@/lib/flags/public"

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
  // Keep the whole group unreachable until the flag is turned on.
  if (!(await getGlobalFlag("supplierWorkspace"))) redirect("/property-manager")

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

  return <SupplierAppShell>{children}</SupplierAppShell>
}
