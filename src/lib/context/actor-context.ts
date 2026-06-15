import type { SupabaseClient } from "@supabase/supabase-js"
import type { ActorContext } from "./context-types"
import { safeRow } from "./_safe"

/**
 * Resolve the ACTOR block: who is acting, and their role globally + within the
 * resolved workspace.
 *
 * Degrades safely: an unauthenticated session, or unmigrated membership/role
 * tables, yields a null/anonymous actor rather than throwing.
 */
export async function resolveActorContext(
  supabase: SupabaseClient,
  opts: { actorId?: string | null; workspaceId?: string | null }
): Promise<ActorContext> {
  let userId = opts.actorId ?? null

  // Fall back to the signed-in user when no explicit actor was passed.
  if (!userId) {
    try {
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null
    } catch {
      userId = null
    }
  }

  const base: ActorContext = {
    userId,
    role: null,
    workspaceRole: null,
    isPlatformAdmin: false,
  }

  if (!userId) return base

  // Platform-level role (best-effort; table/column may not exist).
  const profile = await safeRow<{ role?: string; is_platform_admin?: boolean }>(() =>
    supabase.from("profiles").select("role, is_platform_admin").eq("id", userId).maybeSingle()
  )
  if (profile) {
    base.role = profile.role ?? null
    base.isPlatformAdmin =
      profile.is_platform_admin === true || profile.role === "platform_admin"
  }

  // Role within the resolved workspace (best-effort).
  if (opts.workspaceId) {
    const member = await safeRow<{ role?: string }>(() =>
      supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", opts.workspaceId as string)
        .eq("user_id", userId as string)
        .maybeSingle()
    )
    if (member?.role) base.workspaceRole = member.role
  }

  return base
}
