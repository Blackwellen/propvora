import { redirect } from "next/navigation"
import CustomerShell from "@/components/shells/CustomerShell"
import { createClient } from "@/lib/supabase/server"
import {
  countCustomerUnreadNotifications,
  countCustomerUnreadMessages,
} from "@/lib/customer"

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
  if (!user) redirect("/login?redirectTo=/user")

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
  if (!workspaceId) redirect("/property-manager")

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

  // Avatar URL — check auth user_metadata first (e.g. from OAuth / profile),
  // then fall back to customer_profiles.avatar_url if present (tolerant).
  const metaAvatar =
    (user.user_metadata as { avatar_url?: string } | null)?.avatar_url ?? null
  let avatarUrl: string | null = metaAvatar
  if (!avatarUrl) {
    try {
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("avatar_url")
        .eq("workspace_id", workspaceId)
        .maybeSingle()
      avatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null
    } catch {
      // tolerate missing column
    }
  }

  const [unreadNotifications, unreadMessages] = await Promise.all([
    countCustomerUnreadNotifications(supabase, workspaceId),
    countCustomerUnreadMessages(supabase, workspaceId),
  ])

  return (
    <CustomerShell
      customerName={customerName}
      customerEmail={user.email ?? undefined}
      avatarUrl={avatarUrl}
      unreadNotifications={unreadNotifications}
      unreadMessages={unreadMessages}
    >
      {children}
    </CustomerShell>
  )
}
