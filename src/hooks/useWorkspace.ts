'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Workspace, WorkspaceMember } from '@/types/database'

/**
 * Fetches the user's active workspace, respecting profiles.current_workspace_id.
 * Falls back to oldest membership if no preference is stored.
 * AuthProvider.switchWorkspace() calls queryClient.clear() after persisting the
 * choice, so this query automatically re-fetches with the updated profile value.
 */
export function useWorkspace() {
  const supabase = createClient()

  return useQuery<Workspace | null>({
    queryKey: ['workspace'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // 1. Prefer profiles.current_workspace_id (set by switchWorkspace action)
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', user.id)
        .maybeSingle()

      let workspaceId: string | null = profile?.current_workspace_id ?? null

      // 2. Fall back to oldest membership
      if (!workspaceId) {
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        workspaceId = membership?.workspace_id ?? null
      }

      if (!workspaceId) return null

      const { data: ws, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .maybeSingle()

      if (error || !ws) return null
      return ws as Workspace
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Returns the current workspace ID from the first membership.
 * Convenience wrapper around useWorkspace.
 */
export function useWorkspaceId(): string | undefined {
  const { data } = useWorkspace()
  return data?.id
}

/**
 * Fetches all members of the given workspace.
 */
export function useWorkspaceMembers(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<WorkspaceMember[]>({
    queryKey: ['workspace-members', workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        // live schema orders by created_at — there is no `joined_at` column
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    staleTime: 2 * 60 * 1000,
  })
}
