import "server-only"
import type { createClient } from "@/lib/supabase/server"

// ============================================================================
// Shared supplier-workspace API gate.
//
// A supplier-workspace user is a member of BOTH `workspace_members` and
// `supplier_workspace_members` for their workspace (verified against the live
// schema). We accept either so operator-style and supplier-only memberships both
// pass. Tolerant: a missing table is treated as "not a member via that path".
// ============================================================================

type Client = Awaited<ReturnType<typeof createClient>>

export async function isSupplierWorkspaceMember(
  supabase: Client,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  if (!workspaceId || !userId) return false
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    if (data) return true
  } catch {
    /* fall through */
  }
  try {
    const { data } = await supabase
      .from("supplier_workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}
