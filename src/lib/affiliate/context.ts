import "server-only"

// ============================================================================
// Standalone AFFILIATE portal context.
//
// The affiliate experience is available to the GENERAL PUBLIC via the
// feature-flagged /affiliate portal + /affiliate-login — independent of the
// customer/supplier workspace flags. Affiliate earnings are keyed to a
// workspace_id; an affiliate account reuses a (customer-type) workspace, so
// when the customer flag is later switched on the SAME account shares one
// affiliate ledger across both the customer area and this portal.
//
// requireAffiliateContext():
//   - requires an authenticated session (else → /affiliate-login)
//   - ensures the account has a workspace (bootstraps a customer workspace if
//     the user has none — e.g. a pure affiliate signup)
//   - enforces the `affiliateEnabled` flag (else → /affiliate-programme)
// ============================================================================
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"
import { bootstrapCustomerWorkspace } from "@/lib/actions/workspace"

export interface AffiliateContext {
  userId: string
  email: string | null
  workspaceId: string
}

async function resolveWorkspaceId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<string | null> {
  // Prefer the account's current workspace, else any membership.
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", userId)
    .maybeSingle()
  if (profile?.current_workspace_id) return profile.current_workspace_id as string

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()
  return (membership?.workspace_id as string | undefined) ?? null
}

export async function requireAffiliateContext(): Promise<AffiliateContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/affiliate-login")

  let workspaceId = await resolveWorkspaceId(supabase, user.id)
  if (!workspaceId) {
    // Pure affiliate signup with no workspace yet → give them a (customer)
    // home so their referral ledger has somewhere to live.
    try {
      const res = await bootstrapCustomerWorkspace()
      if (res?.ok && res.data?.workspaceId) workspaceId = res.data.workspaceId
    } catch {
      /* fall through */
    }
    if (!workspaceId) workspaceId = await resolveWorkspaceId(supabase, user.id)
  }
  if (!workspaceId) redirect("/affiliate-login?error=no_workspace")

  const enabled = await isFeatureEnabled("affiliateEnabled", { supabase, workspaceId })
  if (!enabled) redirect("/affiliate-programme")

  return { userId: user.id, email: user.email ?? null, workspaceId }
}
