'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ============================================================
// In-app messaging for a tenancy.
//
// A tenancy conversation is a `message_threads` row with
//   type='tenant', related_type='tenancy', related_id=<tenancy id>
// and its messages live in `messages` (thread_id/sender_id/sender_name/content).
// This mirrors the shapes used by src/hooks/useMessages.ts.
//
// Reads are 42P01-safe. The thread is created lazily on the first send so we
// don't litter empty threads for tenancies nobody has messaged.
// ============================================================

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export interface ThreadMessage {
  id: string
  thread_id: string
  workspace_id: string
  sender_id: string | null
  sender_name: string
  content: string
  created_at: string
  mine: boolean
}

async function currentUser(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.auth.getUser()
  const user = data.user
  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    'You'
  return { id: user?.id ?? null, name }
}

/** Resolve the existing tenancy thread id (does not create one). */
async function findThreadId(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  tenancyId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('message_threads')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('related_type', 'tenancy')
    .eq('related_id', tenancyId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) {
    if (code(error) === '42P01') return null
    throw error
  }
  return (data?.id as string | undefined) ?? null
}

/** Messages for a tenancy's thread, chronological. Empty until a thread exists. */
export function useTenancyMessages(
  workspaceId: string | undefined,
  tenancyId: string | undefined
) {
  const supabase = createClient()
  return useQuery<ThreadMessage[]>({
    queryKey: ['tenancy-messages', workspaceId, tenancyId],
    enabled: !!workspaceId && !!tenancyId,
    staleTime: 10_000,
    queryFn: async () => {
      const threadId = await findThreadId(supabase, workspaceId!, tenancyId!)
      if (!threadId) return []
      const me = await currentUser(supabase)
      // Bound the thread read: newest 200 (descending) restored to chronological
      // order. Caps worst-case payload on long threads; no change for normal ones.
      const { data, error } = await supabase
        .from('messages')
        .select('id, thread_id, workspace_id, sender_id, sender_name, content, created_at')
        .eq('workspace_id', workspaceId!)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) {
        if (code(error) === '42P01') return []
        throw error
      }
      return (data ?? []).slice().reverse().map((r: Record<string, unknown>) => ({
        id: r.id as string,
        thread_id: r.thread_id as string,
        workspace_id: r.workspace_id as string,
        sender_id: (r.sender_id as string | null) ?? null,
        sender_name: (r.sender_name as string) ?? 'Unknown',
        content: (r.content as string) ?? '',
        created_at: r.created_at as string,
        mine: !!me.id && r.sender_id === me.id,
      }))
    },
  })
}

/** Send a message; lazily creates the tenancy thread on first send. */
export function useSendTenancyMessage() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation<
    ThreadMessage,
    Error,
    { workspaceId: string; tenancyId: string; title: string; body: string }
  >({
    mutationFn: async ({ workspaceId, tenancyId, title, body }) => {
      const me = await currentUser(supabase)

      // Find or create the tenancy thread.
      let threadId = await findThreadId(supabase, workspaceId, tenancyId)
      if (!threadId) {
        const { data: created, error: tErr } = await supabase
          .from('message_threads')
          .insert({
            workspace_id: workspaceId,
            title: title.slice(0, 200),
            type: 'tenant',
            related_type: 'tenancy',
            related_id: tenancyId,
            created_by: me.id,
          })
          .select('id')
          .single()
        if (tErr) throw tErr
        threadId = created.id as string
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          workspace_id: workspaceId,
          sender_id: me.id,
          sender_name: me.name,
          content: body.trim(),
        })
        .select('id, thread_id, workspace_id, sender_id, sender_name, content, created_at')
        .single()
      if (error) throw error

      // Bump the thread so it sorts to the top of the inbox (best-effort).
      try {
        await supabase
          .from('message_threads')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', threadId)
      } catch {
        /* non-fatal */
      }

      return {
        id: data.id as string,
        thread_id: data.thread_id as string,
        workspace_id: data.workspace_id as string,
        sender_id: (data.sender_id as string | null) ?? null,
        sender_name: data.sender_name as string,
        content: data.content as string,
        created_at: data.created_at as string,
        mine: true,
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tenancy-messages', vars.workspaceId, vars.tenancyId] })
    },
  })
}
