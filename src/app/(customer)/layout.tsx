import { redirect } from "next/navigation"
import CustomerShell from "@/components/shells/CustomerShell"
import { createClient } from "@/lib/supabase/server"

/**
 * Customer workspace layout (v2, integrated into core — no feature flags).
 *
 * Access is gated by real product logic: the signed-in user must be a member
 * of a customer-type workspace (`customer_workspace_members`). Non-customers
 * are redirected to the operator app. Tolerant: if the membership table isn't
 * present yet, the group simply isn't reachable.
 */
export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/customer")

  // Core gate: must belong to a customer workspace.
  let workspaceId: string | null = null
  try {
    const { data } = await supabase
      .from("customer_workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
    workspaceId = (data as { workspace_id?: string } | null)?.workspace_id ?? null
  } catch {
    workspaceId = null
  }
  if (!workspaceId) redirect("/app")

  // Resolve a friendly display name (tolerant — falls back to the account email
  // then "Customer").
  let customerName = user.email ?? "Customer"
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .maybeSingle()
    if ((ws as { name?: string } | null)?.name) customerName = (ws as { name: string }).name
  } catch {
    // keep default
  }

  return <CustomerShell customerName={customerName}>{children}</CustomerShell>
}
