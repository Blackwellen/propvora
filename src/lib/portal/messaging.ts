"use client"

import { createClient } from "@/lib/supabase/client"

// ============================================================
// Portal messaging — aligned to the LIVE schema:
//   message_threads (id, workspace_id, title, type, related_type,
//                    related_id, archived, created_by, created_at, updated_at)
//   messages        (id, thread_id, workspace_id, sender_id, sender_name,
//                    content, read_by, attachments, created_at, ...)
//
// The portal pages (tenant / landlord / supplier) previously queried an
// imagined `conversations` table with `body`/`sender_type` columns that do
// not exist, so every query silently 42P01/42703-failed → permanently empty
// inboxes. This module is the single, correct data layer for all three.
//
// Threads are scoped to a portal user by the set of related ids they own
// (their tenancy/contact/property ids), matched against message_threads
// (related_id, related_type). 42P01/42703-safe — returns [] rather than throw.
// ============================================================

export interface PortalThread {
  id: string
  subject: string | null
  last_message_at: string | null
  created_at: string
}

export interface PortalMessage {
  id: string
  thread_id: string
  sender_id: string | null
  sender_name: string | null
  content: string
  created_at: string
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

/**
 * List message threads visible to a portal user, scoped to the set of related
 * ids they own (tenancy ids, contact id, property ids…). Returns [] if the
 * workspace or id set is empty, or on any tolerated schema error.
 */
export async function listPortalThreads(
  workspaceId: string | null,
  relatedIds: string[]
): Promise<PortalThread[]> {
  const ids = relatedIds.filter(Boolean)
  if (!workspaceId || ids.length === 0) return []
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from("message_threads")
      .select("id, title, related_id, archived, updated_at, created_at")
      .eq("workspace_id", workspaceId)
      .in("related_id", ids)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
    if (error) return []
    return (data ?? [])
      .filter((r) => !(r as { archived?: boolean }).archived)
      .map((r) => {
        const row = r as { id: string; title: string | null; updated_at: string | null; created_at: string }
        return {
          id: row.id,
          subject: row.title ?? null,
          last_message_at: row.updated_at ?? null,
          created_at: row.created_at,
        }
      })
  } catch {
    return []
  }
}

/** Messages in a thread, oldest-first. 42P01-safe. */
export async function listThreadMessages(threadId: string): Promise<PortalMessage[]> {
  if (!threadId) return []
  const supabase = createClient()
  try {
    // Bound the read: newest 200 (descending) restored to chronological order.
    // Caps worst-case payload on long portal threads; no change for normal ones.
    const { data, error } = await supabase
      .from("messages")
      .select("id, thread_id, sender_id, sender_name, content, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(200)
    if (error && code(error) !== "42P01") return []
    return ((data ?? []) as PortalMessage[]).slice().reverse()
  } catch {
    return []
  }
}

/** Send a message into a thread as the current portal user. Throws on error. */
export async function sendThreadMessage(args: {
  threadId: string
  workspaceId: string
  senderId: string | null
  senderName: string
  content: string
}): Promise<PortalMessage | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: args.threadId,
      workspace_id: args.workspaceId,
      sender_id: args.senderId,
      sender_name: args.senderName,
      content: args.content.trim(),
    })
    .select("id, thread_id, sender_id, sender_name, content, created_at")
    .single()
  if (error) throw error
  // Bump the thread so it sorts to the top next load (best-effort).
  try {
    await supabase
      .from("message_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", args.threadId)
  } catch {
    /* non-fatal */
  }
  return (data as PortalMessage) ?? null
}
