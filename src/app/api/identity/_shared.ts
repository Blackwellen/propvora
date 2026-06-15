import { createClient } from "@/lib/supabase/server"

/* ──────────────────────────────────────────────────────────────────────────
   Shared helpers for the /api/identity/* routes — workspace resolution,
   membership checks and a tolerant dynamic loader for the sibling-owned
   identity data layer (`@/lib/identity/*`). No Stripe calls live here.
─────────────────────────────────────────────────────────────────────────── */

export type SupabaseServer = Awaited<ReturnType<typeof createClient>>

/** Resolve the workspace the caller is acting in: an explicit (membership-
 *  checked) id, else the profile's current workspace. */
export async function resolveWorkspaceId(
  supabase: SupabaseServer,
  userId: string,
  explicit?: string | null
): Promise<string | null> {
  if (explicit && explicit.trim()) return explicit.trim()
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", userId)
    .maybeSingle()
  return profile?.current_workspace_id ?? null
}

/** Membership across the standard + supplier membership tables. Tolerant. */
export async function isMember(
  supabase: SupabaseServer,
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

/**
 * Dynamically load a named export from the sibling identity lib. Returns
 * undefined (never throws) when the module/symbol is absent so routes can
 * respond with a clean not-provisioned state.
 */
export async function loadIdentityFn<T>(
  module: "verification" | "documents" | "screening",
  name: string
): Promise<T | undefined> {
  try {
    const mod = (await import(`@/lib/identity/${module}`)) as Record<string, unknown>
    const fn = mod[name]
    return typeof fn === "function" ? (fn as T) : undefined
  } catch {
    return undefined
  }
}
