// ============================================================================
// Resolve the BUYER workspace for an operator purchasing on the marketplace.
// Returns the caller's first operator workspace id, or null when there's no
// authed operator (the book page then falls back to the modelled checkout).
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export async function resolveOperatorBuyerWorkspace(
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces(type)")
      .eq("user_id", user.id)
    const match = (data ?? []).find((r) => {
      const w = (r as { workspaces?: { type?: string } | { type?: string }[] }).workspaces
      const t = Array.isArray(w) ? w[0]?.type : w?.type
      return t === "operator"
    })
    return (match?.workspace_id as string | undefined) ?? null
  } catch {
    return null
  }
}
