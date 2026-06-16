import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Supplier MESSAGING data layer.
//
// `supplier_message_threads` anchors a conversation to a supplier workspace and
// (optionally) a job assignment or marketplace lead, with a counterparty label
// (operator / customer). `supplier_messages` carries an author_side so the UI
// renders left/right bubbles without a join to auth. A DB trigger keeps
// last_message_at + supplier_unread_count current.
//
// Workspace-scoped, RLS via is_supplier_workspace_member. No money here.
// 42P01/42703/PGRST205-tolerant.
// ============================================================================

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "42703"])

function isMissing(err: { code?: string } | null | undefined): boolean {
  return Boolean(err?.code && NOT_PROVISIONED.has(err.code))
}

export type CounterpartyKind = "operator" | "customer" | "platform"
export type AuthorSide = "supplier" | "counterparty" | "system"

export interface SupplierMessageThread {
  id: string
  workspace_id: string
  subject: string
  counterparty_kind: CounterpartyKind
  counterparty_name: string | null
  assignment_id: string | null
  lead_id: string | null
  last_message_at: string
  supplier_unread_count: number
  created_at: string
}

export interface SupplierMessage {
  id: string
  thread_id: string
  workspace_id: string
  author_side: AuthorSide
  author_user_id: string | null
  author_name: string | null
  body: string
  created_at: string
}

export interface ThreadInput {
  subject: string
  counterparty_kind?: CounterpartyKind
  counterparty_name?: string | null
  assignment_id?: string | null
  lead_id?: string | null
}

/** List threads for a workspace, most-recently-active first. */
export async function listThreads(
  supabase: SupabaseClient,
  workspaceId: string,
  opts?: { assignmentId?: string }
): Promise<SupplierMessageThread[]> {
  let query = supabase
    .from("supplier_message_threads")
    .select("*")
    .eq("workspace_id", workspaceId)
  if (opts?.assignmentId) query = query.eq("assignment_id", opts.assignmentId)
  const { data, error } = await query.order("last_message_at", { ascending: false })
  if (error) {
    if (isMissing(error)) return []
    throw error
  }
  return (data as SupplierMessageThread[]) ?? []
}

/** Load a single thread (RLS-scoped). */
export async function getThread(
  supabase: SupabaseClient,
  workspaceId: string,
  threadId: string
): Promise<SupplierMessageThread | null> {
  const { data, error } = await supabase
    .from("supplier_message_threads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", threadId)
    .maybeSingle()
  if (error) {
    if (isMissing(error)) return null
    throw error
  }
  return (data as SupplierMessageThread) ?? null
}

/** List messages in a thread, oldest first (chat order). */
export async function listMessages(
  supabase: SupabaseClient,
  workspaceId: string,
  threadId: string
): Promise<SupplierMessage[]> {
  const { data, error } = await supabase
    .from("supplier_messages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
  if (error) {
    if (isMissing(error)) return []
    throw error
  }
  return (data as SupplierMessage[]) ?? []
}

/** Create a thread. */
export async function createThread(
  supabase: SupabaseClient,
  workspaceId: string,
  input: ThreadInput
): Promise<SupplierMessageThread | null> {
  const { data, error } = await supabase
    .from("supplier_message_threads")
    .insert({
      workspace_id: workspaceId,
      subject: input.subject,
      counterparty_kind: input.counterparty_kind ?? "operator",
      counterparty_name: input.counterparty_name ?? null,
      assignment_id: input.assignment_id ?? null,
      lead_id: input.lead_id ?? null,
    })
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissing(error)) return null
    throw error
  }
  return (data as SupplierMessageThread) ?? null
}

/** Post a message. The DB trigger updates the thread's activity + unread. */
export async function postMessage(
  supabase: SupabaseClient,
  workspaceId: string,
  threadId: string,
  input: { body: string; author_side?: AuthorSide; author_user_id?: string | null; author_name?: string | null }
): Promise<SupplierMessage | null> {
  const { data, error } = await supabase
    .from("supplier_messages")
    .insert({
      workspace_id: workspaceId,
      thread_id: threadId,
      body: input.body,
      author_side: input.author_side ?? "supplier",
      author_user_id: input.author_user_id ?? null,
      author_name: input.author_name ?? null,
    })
    .select("*")
    .maybeSingle()
  if (error) {
    if (isMissing(error)) return null
    throw error
  }
  return (data as SupplierMessage) ?? null
}

/** Reset the supplier unread counter when the supplier opens a thread. */
export async function markThreadRead(
  supabase: SupabaseClient,
  workspaceId: string,
  threadId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("supplier_message_threads")
    .update({ supplier_unread_count: 0 })
    .eq("workspace_id", workspaceId)
    .eq("id", threadId)
  if (error && !isMissing(error)) throw error
  return !error
}

/** Total unread across all threads (bell badge contribution). */
export async function countThreadUnread(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<number> {
  const threads = await listThreads(supabase, workspaceId)
  return threads.reduce((n, t) => n + (t.supplier_unread_count ?? 0), 0)
}

/** Delete a thread (cascades messages). Used by the proof harness cleanup. */
export async function deleteThread(
  supabase: SupabaseClient,
  workspaceId: string,
  threadId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("supplier_message_threads")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", threadId)
  if (error && !isMissing(error)) throw error
  return !error
}
