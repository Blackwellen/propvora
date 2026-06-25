'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message } from '@/types/database'
import { notifyMessageReceived } from '@/lib/notifications/emitters'

/**
 * Shared messaging data layer for the Inbox.
 *
 * Single source of truth for BOTH:
 *   - the top-level Messages section (/app/messages)
 *   - the contextual "recent messages" preview on the contact detail page
 *
 * The LIVE schema is `message_threads` + `messages` — there is no
 * `conversations` table and `messages` has no `body`/`sender_type`/
 * `conversation_id` columns. This hook reads the real columns:
 *   message_threads (id, workspace_id, title, type, related_type, related_id,
 *                    archived, created_at, updated_at)
 *   messages        (id, thread_id, workspace_id, sender_id, sender_name,
 *                    content, read_by, attachments, created_at, updated_at)
 * …and normalises them to the UI-facing Conversation / Message shapes so the
 * pages stay unchanged. A thread is linked to a contact when
 * related_type = 'contact' and related_id = contacts.id.
 *
 * Every query is 42P01-safe: if a messaging table is missing or empty the
 * caller receives [] and renders an honest empty state — never fabricated.
 */

const CONV_KEY = 'conversations'
const MSG_KEY = 'messages'

export interface ConversationWithContact extends Conversation {
  contact: { id: string; full_name: string; contact_type: string } | null
}

function is42P01(error: { code?: string } | null): boolean {
  return error?.code === '42P01'
}

/** Current auth user id (cached briefly) — used to derive "us vs them". */
async function currentUserId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

/** Normalise a live `messages` row to the UI Message shape. */
function toUiMessage(row: Record<string, any>, meId: string | null): Message {
  const senderId = (row.sender_id ?? null) as string | null
  return {
    id: row.id,
    conversation_id: row.thread_id,
    workspace_id: row.workspace_id,
    sender_id: senderId,
    sender_type: senderId && meId && senderId === meId ? 'user' : 'contact',
    body: (row.content ?? '') as string,
    read_at: null,
    is_demo: Boolean(row.demo),
    created_at: row.created_at,
  }
}

/** All conversations in a workspace, newest activity first, with contact join. */
export function useConversations(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<ConversationWithContact[]>({
    queryKey: [CONV_KEY, workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      // 1) threads
      const { data: threads, error: tErr } = await supabase
        .from('message_threads')
        .select('id, workspace_id, title, type, related_type, related_id, archived, created_at, updated_at')
        .eq('workspace_id', workspaceId!)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (tErr) {
        if (is42P01(tErr)) return []
        throw tErr
      }
      const liveThreads = (threads ?? []).filter((t: Record<string, any>) => !t.archived)
      if (liveThreads.length === 0) return []

      const threadIds = liveThreads.map((t: Record<string, any>) => t.id)
      const contactIds = liveThreads
        .filter((t: Record<string, any>) => t.related_type === 'contact' && t.related_id)
        .map((t: Record<string, any>) => t.related_id as string)

      // 2) contacts referenced by these threads
      const contactMap = new Map<string, { id: string; full_name: string; contact_type: string }>()
      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, display_name, type')
          .eq('workspace_id', workspaceId!)
          .in('id', contactIds)
        for (const c of (contacts ?? []) as Array<Record<string, any>>) {
          contactMap.set(c.id, {
            id: c.id,
            full_name: (c.display_name as string) ?? 'Unknown',
            contact_type: (c.type as string) ?? 'other',
          })
        }
      }

      // 3) message stats per thread (last activity + unread for me)
      const meId = await currentUserId(supabase)
      const lastAt = new Map<string, string>()
      const unread = new Map<string, number>()
      const { data: msgs } = await supabase
        .from('messages')
        .select('thread_id, sender_id, read_by, created_at')
        .eq('workspace_id', workspaceId!)
        .in('thread_id', threadIds)
      for (const m of (msgs ?? []) as Array<Record<string, any>>) {
        const tid = m.thread_id as string
        if (!lastAt.has(tid) || m.created_at > (lastAt.get(tid) as string)) lastAt.set(tid, m.created_at)
        const readBy = Array.isArray(m.read_by) ? (m.read_by as string[]) : []
        const fromMe = meId && m.sender_id === meId
        const readByMe = meId ? readBy.includes(meId) : true
        if (!fromMe && !readByMe) unread.set(tid, (unread.get(tid) ?? 0) + 1)
      }

      return liveThreads.map((t: Record<string, any>): ConversationWithContact => {
        const contact = t.related_type === 'contact' && t.related_id ? contactMap.get(t.related_id) ?? null : null
        return {
          id: t.id,
          workspace_id: t.workspace_id,
          contact_id: contact?.id ?? null,
          subject: (t.title as string) ?? null,
          last_message_at: lastAt.get(t.id) ?? t.updated_at ?? null,
          unread_count: unread.get(t.id) ?? 0,
          is_demo: false,
          created_at: t.created_at,
          contact,
        }
      })
    },
    staleTime: 30 * 1000,
  })
}

/** Messages within a single conversation (thread), chronological. */
export function useConversationMessages(
  workspaceId: string | undefined,
  conversationId: string | undefined
) {
  const supabase = createClient()
  return useQuery<Message[]>({
    queryKey: [MSG_KEY, workspaceId, conversationId],
    enabled: !!workspaceId && !!conversationId,
    queryFn: async () => {
      const meId = await currentUserId(supabase)
      // Bound the thread read: fetch the newest 200 (descending) then restore
      // chronological order in memory. Caps worst-case payload on very long
      // threads while preserving the oldest→newest display for normal ones.
      const { data, error } = await supabase
        .from('messages')
        .select('id, thread_id, workspace_id, sender_id, content, demo, created_at')
        .eq('workspace_id', workspaceId!)
        .eq('thread_id', conversationId!)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        if (is42P01(error)) return []
        throw error
      }
      return (data ?? [])
        .slice()
        .reverse()
        .map((r: Record<string, any>) => toUiMessage(r, meId))
    },
    staleTime: 15 * 1000,
  })
}

/**
 * Recent messages tied to a specific contact (across all of that contact's
 * threads). Used by the contact detail "recent messages" preview so it stays
 * in parity with the Inbox — same tables, same shapes.
 */
export function useContactMessages(
  workspaceId: string | undefined,
  contactId: string | undefined,
  limit = 5
) {
  const supabase = createClient()
  return useQuery<Message[]>({
    queryKey: [MSG_KEY, 'by-contact', workspaceId, contactId, limit],
    enabled: !!workspaceId && !!contactId,
    queryFn: async () => {
      // 1) threads related to this contact
      const { data: threads, error: tErr } = await supabase
        .from('message_threads')
        .select('id')
        .eq('workspace_id', workspaceId!)
        .eq('related_type', 'contact')
        .eq('related_id', contactId!)

      if (tErr) {
        if (is42P01(tErr)) return []
        throw tErr
      }
      const threadIds = (threads ?? []).map((t: { id: string }) => t.id)
      if (threadIds.length === 0) return []

      // 2) recent messages across those threads
      const meId = await currentUserId(supabase)
      const { data, error } = await supabase
        .from('messages')
        .select('id, thread_id, workspace_id, sender_id, content, demo, created_at')
        .eq('workspace_id', workspaceId!)
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        if (is42P01(error)) return []
        throw error
      }
      return (data ?? []).map((r: Record<string, any>) => toUiMessage(r, meId))
    },
    staleTime: 15 * 1000,
  })
}

/**
 * Total unread messages across the workspace (for the side-nav badge).
 *
 * Reuses the shared `useConversations` cache (so it adds no extra inbox query)
 * and subscribes to workspace-scoped `messages` INSERTs to keep the badge live
 * without a manual refresh. The subscription is workspace-scoped and cleaned up
 * on unmount / workspace switch. Returns 0 while loading or when empty.
 */
export function useUnreadMessagesCount(workspaceId: string | undefined): number {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { data: conversations = [] } = useConversations(workspaceId)

  useEffect(() => {
    if (!workspaceId) return
    const channel = supabase
      .channel(`ws-messages:${workspaceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `workspace_id=eq.${workspaceId}` },
        () => { queryClient.invalidateQueries({ queryKey: [CONV_KEY, workspaceId] }) },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  return conversations.reduce((acc, c) => acc + (c.unread_count ?? 0), 0)
}

/**
 * Live thread subscription for the open conversation. On any new message in the
 * thread, refresh the message list and the inbox (last-activity + unread). The
 * channel is thread-scoped and cleaned up on unmount / conversation change.
 */
export function useThreadRealtime(
  workspaceId: string | undefined,
  conversationId: string | undefined,
) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!workspaceId || !conversationId) return
    const channel = supabase
      .channel(`thread:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: [MSG_KEY, workspaceId, conversationId] })
          queryClient.invalidateQueries({ queryKey: [CONV_KEY, workspaceId] })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, conversationId])
}

/**
 * Mark every inbound message in a thread as read by the current user.
 *
 * The inbox derives a thread's unread count from `messages.read_by` (an array
 * of user ids) — a message is "unread for me" when it isn't from me and my id
 * isn't in its `read_by`. Opening a conversation must therefore stamp my id
 * into the `read_by` of the inbound messages so the inbox badge and side-nav
 * count clear. Best-effort + 42P01-safe; only touches rows that actually need
 * it, and invalidates the inbox so the badge updates without a manual refresh.
 */
export function useMarkThreadRead() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<number, Error, { workspaceId: string; conversationId: string }>({
    mutationFn: async ({ workspaceId, conversationId }) => {
      const meId = await currentUserId(supabase)
      if (!meId) return 0

      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, read_by')
        .eq('workspace_id', workspaceId)
        .eq('thread_id', conversationId)
      if (error) {
        if (is42P01(error)) return 0
        throw error
      }

      // Only inbound messages I haven't already read.
      const toMark = (data ?? []).filter((m: Record<string, any>) => {
        if (m.sender_id === meId) return false
        const readBy = Array.isArray(m.read_by) ? (m.read_by as string[]) : []
        return !readBy.includes(meId)
      })
      if (toMark.length === 0) return 0

      await Promise.all(
        toMark.map((m: Record<string, any>) => {
          const readBy = Array.isArray(m.read_by) ? (m.read_by as string[]) : []
          return supabase
            .from('messages')
            .update({ read_by: [...readBy, meId] })
            .eq('id', m.id)
        }),
      )
      return toMark.length
    },
    onSuccess: (marked, { workspaceId }) => {
      // Only refresh the inbox/counts when something actually changed.
      if (marked > 0) {
        queryClient.invalidateQueries({ queryKey: [CONV_KEY, workspaceId] })
      }
    },
  })
}

/** Send a message into an existing thread as the current user. */
export function useSendMessage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<
    Message,
    Error,
    { workspaceId: string; conversationId: string; body: string; clientToken?: string }
  >({
    mutationFn: async ({ workspaceId, conversationId, body, clientToken }) => {
      const { data: auth } = await supabase.auth.getUser()
      const meId = auth.user?.id ?? null
      const senderName =
        (auth.user?.user_metadata?.full_name as string | undefined) ??
        (auth.user?.user_metadata?.name as string | undefined) ??
        auth.user?.email ??
        'You'

      // Server-side idempotency: a uuid minted once per composed message. A
      // retried send (double-click / network retry / optimistic re-fire) hits
      // the partial unique index (thread_id, client_token) and raises 23505 —
      // we then fetch and return the already-stored row instead of inserting a
      // duplicate. `crypto.randomUUID` is available in all supported browsers.
      const token =
        clientToken ??
        (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : undefined)

      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: conversationId,
          workspace_id: workspaceId,
          sender_id: meId,
          sender_name: senderName,
          content: body.trim(),
          ...(token ? { client_token: token } : {}),
        })
        .select('id, thread_id, workspace_id, sender_id, content, demo, created_at')
        .single()
      if (error) {
        // 23505 = unique violation ⇒ this exact send already landed. Return the
        // existing row so the caller sees success (idempotent), not a duplicate.
        if (error.code === '23505' && token) {
          const { data: existing } = await supabase
            .from('messages')
            .select('id, thread_id, workspace_id, sender_id, content, demo, created_at')
            .eq('thread_id', conversationId)
            .eq('client_token', token)
            .single()
          if (existing) return toUiMessage(existing as Record<string, any>, meId)
        }
        throw error
      }

      // Bump the thread so it sorts to the top next load (best-effort).
      try {
        await supabase
          .from('message_threads')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId)
      } catch {
        /* non-fatal */
      }

      // EVENT: message received — notify the other thread participants (internal
      // users only). Best-effort and 42P01-safe; never blocks the send.
      try {
        const { data: parts } = await supabase
          .from('message_thread_participants')
          .select('user_id')
          .eq('thread_id', conversationId)
        const recipients = (parts ?? [])
          .map((p) => (p as { user_id: string | null }).user_id)
          .filter((uid): uid is string => !!uid && uid !== meId)
        if (recipients.length) {
          const preview = body.trim().slice(0, 120)
          // Fan out to every recipient. The emitter's dedupe key is per
          // (conversation, user), so a burst collapses to one ping each.
          await Promise.all(
            recipients.map((uid) =>
              notifyMessageReceived({
                workspaceId,
                conversationId,
                userId: uid,
                fromName: senderName,
                preview,
              }),
            ),
          )
        }
      } catch {
        /* non-fatal */
      }

      return toUiMessage(data as Record<string, any>, meId)
    },
    onSuccess: (_data, { workspaceId, conversationId }) => {
      queryClient.invalidateQueries({ queryKey: [MSG_KEY, workspaceId, conversationId] })
      queryClient.invalidateQueries({ queryKey: [CONV_KEY, workspaceId] })
      queryClient.invalidateQueries({ queryKey: [MSG_KEY, 'by-contact', workspaceId] })
    },
  })
}
