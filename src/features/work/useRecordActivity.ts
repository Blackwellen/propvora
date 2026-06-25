'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// Live activity history for a single record, read from the
// shared `activity_logs` table (workspace-scoped, RLS via
// "Members read activity"). Filtered by resource_type +
// resource_id. 42P01-safe → honest empty list if the table
// is missing. Detail pages merge these real rows with their
// derived lifecycle events (created / scheduled / completed)
// so the timeline shows real history when it exists.
//
//   activity_logs(id, workspace_id, user_id, action,
//                 description, resource_type, resource_id,
//                 metadata, created_at)
// ============================================================

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export interface RecordActivityRow {
  id: string
  action: string
  description: string | null
  created_at: string
}

export function useRecordActivity(
  workspaceId: string | undefined,
  resourceType: string,
  resourceId: string | undefined
) {
  const supabase = createClient()
  return useQuery<RecordActivityRow[]>({
    queryKey: ['record-activity', workspaceId, resourceType, resourceId],
    enabled: !!workspaceId && !!resourceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id, action, description, created_at')
        .eq('workspace_id', workspaceId!)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId!)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        if (code(error) === '42P01') return []
        throw error
      }
      return (data ?? []) as RecordActivityRow[]
    },
  })
}
