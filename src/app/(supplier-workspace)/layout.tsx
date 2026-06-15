import { redirect } from "next/navigation"
import SupplierWorkspaceShell from "@/components/shells/SupplierWorkspaceShell"
import { createClient } from "@/lib/supabase/server"

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

  return (
    <SupplierWorkspaceShell supplierName={supplierName}>{children}</SupplierWorkspaceShell>
  )
}
