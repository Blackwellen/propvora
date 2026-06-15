import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Customer workspace resolution (server-only).
//
// Resolves the signed-in user's customer workspace from
// `customer_workspace_members`, mirroring the (customer)/layout.tsx gate. Pages
// call this to get a workspace-scoped Supabase client + ids. If the user is not
// a customer member (or unauthenticated) we redirect, so no page ever renders
// another customer's data.
// ============================================================================

export interface CustomerContext {
  supabase: SupabaseClient
  userId: string
  /** The customer workspace the signed-in user belongs to. */
  workspaceId: string
  /** Their account email (used to also match guest bookings). */
  email: string | null
  /** Friendly display name (workspace name → email → "Customer"). */
  displayName: string
}

/**
 * Resolve the current customer context or redirect. Tolerant: a missing
 * membership table → not a customer → redirect to /app (same as the layout).
 */
export async function requireCustomerContext(): Promise<CustomerContext> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/customer")

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

  let displayName = "Customer"
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .maybeSingle()
    if ((ws as { name?: string } | null)?.name) displayName = (ws as { name: string }).name
  } catch {
    // keep default
  }
  if (displayName === "Customer" && user.email) displayName = user.email

  return {
    supabase,
    userId: user.id,
    workspaceId,
    email: user.email ?? null,
    displayName,
  }
}
