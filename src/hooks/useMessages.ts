'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message } from '@/types/database'

/**
 * Shared messaging data layer for the Inbox.
 *
 * Single source of truth for BOTH:
 *   - the top-level Messages section (/app/messages)
 *   - the contextual "recent messages" preview on the contact detail page
 *
 * Reads the live `conversations` + `messages` schema (contact-linked via
 * conversations.contact_id). Every query is 42P01-safe: if the messaging
 * tables do not yet exist (or are empty) callers receive [] and render an
 * honest empty state — never fabricated threads.
 */

const CONV_KEY = 'conversations'
const MSG_KEY = 'messages'

export interface ConversationWithContact extends Conversation {
  contact: { id: string; full_name: string; contact_type: string } | null
}

/** All conversations in a workspace, newest activity first, with contact join. */
export function useConversations(workspaceId: string | undefined) {
  const supabase = createClient()
  return useQuery<ConversationWithContact[]>({
    queryKey: [CONV_KEY, workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, contact:contacts(id, display_name, type)')
        .eq('workspace_id', workspaceId!)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []).map((r: Record<string, unknown>) => {
        const c = Array.isArray(r.contact) ? r.contact[0] : r.contact
        const contact = c
          ? {
              id: (c as Record<string, unknown>).id as string,
              full_name: ((c as Record<string, unknown>).display_name as string) ?? 'Unknown',
              contact_type: ((c as Record<string, unknown>).type as string) ?? 'other',
            }
          : null
        return { ...(r as unknown as Conversation), contact }
      })
    },
    staleTime: 30 * 1000,
  })
}

/** Messages within a single conversation, chronological. */
export function useConversationMessages(
  workspaceId: string | undefined,
  conversationId: string | undefined
) {
  const supabase = createClient()
  return useQuery<Message[]>({
    queryKey: [MSG_KEY, workspaceId, conversationId],
    enabled: !!workspaceId && !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })

      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []) as Message[]
    },
    staleTime: 15 * 1000,
  })
}

/**
 * Recent messages tied to a specific contact (across all of that contact's
 * conversations). Used by the contact detail "recent messages" preview so it
 * stays in parity with the Inbox — same tables, same shapes.
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
      // 1) find conversations for this contact
      const { data: convs, error: convErr } = await supabase
        .from('conversations')
        .select('id')
        .eq('workspace_id', workspaceId!)
        .eq('contact_id', contactId!)

      if (convErr) {
        if (convErr.code === '42P01') return []
        throw convErr
      }
      const convIds = (convs ?? []).map((c: { id: string }) => c.id)
      if (convIds.length === 0) return []

      // 2) recent messages across those conversations
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []) as Message[]
    },
    staleTime: 15 * 1000,
  })
}

/** Send a message into an existing conversation. */
export function useSendMessage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation<
    Message,
    Error,
    { workspaceId: string; conversationId: string; body: string }
  >({
    mutationFn: async ({ workspaceId, conversationId, body }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          workspace_id: workspaceId,
          conversation_id: conversationId,
          sender_type: 'user',
          body,
          is_demo: false,
        })
        .select()
        .single()
      if (error) throw error
      return data as Message
    },
    onSuccess: (_data, { workspaceId, conversationId }) => {
      queryClient.invalidateQueries({ queryKey: [MSG_KEY, workspaceId, conversationId] })
      queryClient.invalidateQueries({ queryKey: [CONV_KEY, workspaceId] })
      queryClient.invalidateQueries({ queryKey: [MSG_KEY, 'by-contact', workspaceId] })
    },
  })
}
