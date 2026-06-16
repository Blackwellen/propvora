import "server-only"
import { createClient } from "@/lib/supabase/server"

/**
 * Membership check for a supplier WORKSPACE. The owner is bootstrapped into
 * `workspace_members`; team members live in `supplier_workspace_members` — a
 * caller in EITHER table may manage the workspace's verification. Tolerant: a
 * missing table never throws.
 */
export async function isSupplierWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
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

/** Resolve the authed user + assert supplier-workspace membership. */
export async function requireSupplierMember(
  workspaceId: string
): Promise<{ ok: true; userId: string } | { ok: false; status: number; error: string }> {
  if (!workspaceId) return { ok: false, status: 400, error: "workspaceId is required" }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, error: "Not authenticated" }
  const member = await isSupplierWorkspaceMember(supabase, workspaceId, user.id)
  if (!member) return { ok: false, status: 403, error: "Not a member of this supplier workspace" }
  return { ok: true, userId: user.id }
}
