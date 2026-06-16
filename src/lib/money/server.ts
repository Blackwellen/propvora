import "server-only"
import { createClient } from "@/lib/supabase/server"

/**
 * P5+ — shared money-section server helpers: resolve the caller + active
 * workspace, and assert workspace membership. Used by the money API routes &
 * server components. Fail-closed: an unauthenticated caller resolves to null.
 */

type SB = Awaited<ReturnType<typeof createClient>>

export interface MoneyActor {
  userId: string
  email: string | null
  workspaceId: string | null
}

export async function resolveActiveWorkspaceId(supabase: SB, userId: string): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", userId)
      .maybeSingle()
    const fromProfile = (profile?.current_workspace_id as string | undefined) ?? null
    if (fromProfile) return fromProfile
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    return (membership?.workspace_id as string | undefined) ?? null
  } catch {
    return null
  }
}

export async function getMoneyActor(): Promise<MoneyActor | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const workspaceId = await resolveActiveWorkspaceId(supabase, user.id)
  return { userId: user.id, email: user.email ?? null, workspaceId }
}

/** Assert the caller is a member of `workspaceId` (fail-closed). */
export async function assertWorkspaceMember(supabase: SB, userId: string, workspaceId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}
