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

  // Platform-level role (best-effort; column may not exist on older schemas).
  // The real column is `profiles.platform_role` (value 'admin' for platform
  // admins) — mirrors the authoritative guard in src/proxy.ts and
  // src/lib/admin/guard.ts. There is NO `role` or `is_platform_admin` column.
  const profile = await safeRow<{ platform_role?: string }>(() =>
    supabase.from("profiles").select("platform_role").eq("id", userId).maybeSingle()
  )
  let isPlatformAdmin = false
  if (profile) {
    base.role = profile.platform_role ?? null
    isPlatformAdmin = profile.platform_role === "admin"
  }

  // Secondary grant path: the platform_admins table (explicit grants), matching
  // the fallback in proxy.ts / admin guard. Best-effort; table may not exist.
  if (!isPlatformAdmin) {
    const grant = await safeRow<{ user_id?: string }>(() =>
      supabase.from("platform_admins").select("user_id").eq("user_id", userId as string).maybeSingle()
    )
    if (grant?.user_id) isPlatformAdmin = true
  }
  base.isPlatformAdmin = isPlatformAdmin

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
