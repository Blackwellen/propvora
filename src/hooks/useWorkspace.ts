'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Workspace, WorkspaceMember } from '@/types/database'

/**
 * Fetches the first workspace the current user belongs to.
 * For multi-workspace support, swap this with a workspace selector.
 */
export function useWorkspace() {
  const supabase = createClient()

  return useQuery<Workspace | null>({
    queryKey: ['workspace'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

      if (error || !data) return null
      return (data as unknown as { workspaces: Workspace }).workspaces
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        .eq('workspace_id', workspaceId!)
        .order('joined_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    staleTime: 2 * 60 * 1000,
  })
}
