import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier WORKSPACE team roster data layer (P3 deep).
//
// Backed by `supplier_workspace_members` (workspace_id, user_id, role) — the
// canonical membership table for a supplier workspace. The roster is enriched
// with the member's profile (name/email/avatar) where available. Read +
// role-update + remove. 42P01-tolerant.
//
// Inviting a brand-new user by email is intentionally NOT done here: that is an
// account-provisioning concern handled by the operator-side invite flow; the
// supplier workspace manages roles of users who already exist.
// ============================================================================

export type SupplierTeamRole = "owner" | "admin" | "member"

export interface SupplierTeamMember {
  id: string
  workspace_id: string
  user_id: string
  role: string
  created_at: string
  name: string | null
  email: string | null
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function tolerable(e: unknown): boolean {
  const c = code(e)
  return c === "42P01" || c === "42703" || c === "PGRST205"
}

/** List the supplier workspace roster, enriched with profile name/email. */
export async function listTeam(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<SupplierTeamMember[]> {
  if (!workspaceId) return []
  try {
    const { data, error } = await supabase
      .from("supplier_workspace_members")
      .select("id, workspace_id, user_id, role, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
    if (error) {
      if (tolerable(error)) return []
      throw error
    }
    const rows = (data as Array<{ id: string; workspace_id: string; user_id: string; role: string; created_at: string }>) ?? []
    if (rows.length === 0) return []

    // Enrich with profiles (best-effort; tolerate a missing profiles table).
    // `profiles` carries display_name / first_name / last_name (no email column —
    // email lives in auth.users and is not read here from the user's client).
    const ids = Array.from(new Set(rows.map((r) => r.user_id))).filter(Boolean)
    const profileMap = new Map<string, { name: string | null }>()
    if (ids.length > 0) {
      try {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, first_name, last_name")
          .in("id", ids)
        for (const p of (profs as Array<{ id: string; display_name: string | null; first_name: string | null; last_name: string | null }>) ?? []) {
          const composed = [p.first_name, p.last_name].filter(Boolean).join(" ").trim()
          profileMap.set(p.id, { name: p.display_name || composed || null })
        }
      } catch {
        /* tolerate */
      }
    }

    return rows.map((r) => ({
      ...r,
      name: profileMap.get(r.user_id)?.name ?? null,
      email: null,
    }))
  } catch (e) {
    if (tolerable(e)) return []
    throw e
  }
}

/** Update a roster member's role (workspace-scoped). */
export async function updateTeamRole(
  supabase: SupabaseClient,
  workspaceId: string,
  memberId: string,
  role: SupplierTeamRole
): Promise<boolean> {
  if (!workspaceId || !memberId) return false
  try {
    const { error } = await supabase
      .from("supplier_workspace_members")
      .update({ role })
      .eq("id", memberId)
      .eq("workspace_id", workspaceId)
    if (error) {
      if (tolerable(error)) return false
      throw error
    }
    return true
  } catch (e) {
    if (tolerable(e)) return false
    throw e
  }
}

/** Remove a member from the workspace (workspace-scoped). */
export async function removeTeamMember(
  supabase: SupabaseClient,
  workspaceId: string,
  memberId: string
): Promise<boolean> {
  if (!workspaceId || !memberId) return false
  try {
    const { error } = await supabase
      .from("supplier_workspace_members")
      .delete()
      .eq("id", memberId)
      .eq("workspace_id", workspaceId)
    if (error) {
      if (tolerable(error)) return false
      throw error
    }
    return true
  } catch (e) {
    if (tolerable(e)) return false
    throw e
  }
}
