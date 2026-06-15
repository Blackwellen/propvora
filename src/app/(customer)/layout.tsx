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
  let isCustomer = false
  try {
    const { data } = await supabase
      .from("customer_workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
    isCustomer = Boolean(data)
  } catch {
    isCustomer = false
  }
  if (!isCustomer) redirect("/app")

  return <CustomerShell>{children}</CustomerShell>
}
