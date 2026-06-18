import "server-only"
import { createClient } from "@/lib/supabase/server"

/* Resolve the viewer's session for public marketplace pages. Anon → signedIn
   false. When signed in, also resolve the active workspace so the checkout CTA
   and quote form can pre-fill the buyer workspace. Tolerant. */

export interface PublicSession {
  signedIn: boolean
  email: string | null
  name: string | null
  buyerWorkspaceId: string | null
}

export async function resolvePublicSession(): Promise<PublicSession> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { signedIn: false, email: null, name: null, buyerWorkspaceId: null }

    let buyerWorkspaceId: string | null = null
    let name: string | null = null
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_workspace_id, full_name:display_name")
        .eq("id", user.id)
        .maybeSingle()
      buyerWorkspaceId = (profile?.current_workspace_id as string | undefined) ?? null
      name = (profile?.full_name as string | undefined) ?? null
      if (!buyerWorkspaceId) {
        const { data: m } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .order("joined_at", { ascending: true })
          .limit(1)
          .maybeSingle()
        buyerWorkspaceId = (m?.workspace_id as string | undefined) ?? null
      }
    } catch {
      /* tolerate */
    }
    return { signedIn: true, email: user.email ?? null, name, buyerWorkspaceId }
  } catch {
    return { signedIn: false, email: null, name: null, buyerWorkspaceId: null }
  }
}
