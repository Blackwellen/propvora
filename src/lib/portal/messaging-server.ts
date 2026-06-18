import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PortalSession } from "./session"
import { getTenantTenancies, getLandlordPropertyIds } from "./data"

// ============================================================================
// SERVER-SIDE portal messaging — the only authorization-correct data layer for
// external (no-auth) portal users. RLS keys off workspace_members, which a
// magic-link recipient is NOT, so the browser client (src/lib/portal/messaging
// .ts) cannot read/write threads for them. Everything here uses the SERVICE
// ROLE client, STRICTLY scoped to the session: a thread is only visible/writable
// when its `related_id` is one the session owns (tenancy / property / job /
// contact ids). 42P01/42703-tolerant → empty, never a 500.
// ============================================================================

export interface PortalThread {
  id: string
  subject: string
  relatedId: string | null
  lastMessageAt: string | null
  createdAt: string
}
export interface PortalMessage {
  id: string
  threadId: string
  senderName: string
  content: string
  createdAt: string
  fromMe: boolean
}

/** The set of related ids a portal session owns — the scope for thread access. */
export async function getPortalRelatedIds(session: PortalSession): Promise<string[]> {
  const ids = new Set<string>()
  if (session.contactId) ids.add(session.contactId)

  if (session.portalType === "tenant") {
    const tenancies = await getTenantTenancies(session)
    for (const t of tenancies) {
      ids.add(t.id)
      if (t.property_id) ids.add(t.property_id)
    }
  } else if (session.portalType === "landlord") {
    for (const id of await getLandlordPropertyIds(session)) ids.add(id)
  } else {
    // supplier — threads attached to the supplier's assigned jobs
    if (session.contactId) {
      try {
        const admin = createAdminClient()
        const { data } = await admin
          .from("jobs")
          .select("id")
          .eq("workspace_id", session.workspaceId)
          .eq("supplier_contact_id", session.contactId)
        for (const j of (data ?? []) as { id: string }[]) ids.add(j.id)
      } catch { /* tolerate */ }
    }
  }
  return Array.from(ids)
}

/** The id this portal type attaches a NEW thread to (+ its related_type). */
export async function getPrimaryThreadTarget(
  session: PortalSession
): Promise<{ relatedId: string; relatedType: string } | null> {
  if (session.portalType === "tenant") {
    const tenancies = await getTenantTenancies(session)
    const t = tenancies.find((x) => x.status === "active") ?? tenancies[0]
    if (t) return { relatedId: t.id, relatedType: "tenancy" }
  } else if (session.portalType === "landlord") {
    const ids = await getLandlordPropertyIds(session)
    if (ids[0]) return { relatedId: ids[0], relatedType: "property" }
  }
  if (session.contactId) return { relatedId: session.contactId, relatedType: "contact" }
  return null
}

export async function getPortalThreads(session: PortalSession): Promise<PortalThread[]> {
  const related = await getPortalRelatedIds(session)
  if (related.length === 0) return []
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("message_threads")
      .select("id, title, related_id, archived, updated_at, created_at")
      .eq("workspace_id", session.workspaceId)
      .in("related_id", related)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
    if (error) return []
    return (data ?? [])
      .filter((r) => !(r as { archived?: boolean }).archived)
      .map((r) => {
        const row = r as { id: string; title: string | null; related_id: string | null; updated_at: string | null; created_at: string }
        return {
          id: row.id,
          subject: row.title || "Conversation",
          relatedId: row.related_id ?? null,
          lastMessageAt: row.updated_at ?? null,
          createdAt: row.created_at,
        }
      })
  } catch {
    return []
  }
}

/** Re-scope guard: is this thread one the session is allowed to see? */
export async function isPortalThreadInScope(session: PortalSession, threadId: string): Promise<boolean> {
  if (!threadId) return false
  const related = await getPortalRelatedIds(session)
  if (related.length === 0) return false
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("message_threads")
      .select("related_id")
      .eq("id", threadId)
      .eq("workspace_id", session.workspaceId)
      .maybeSingle()
    const rid = (data as { related_id?: string } | null)?.related_id
    return !!rid && related.includes(rid)
  } catch {
    return false
  }
}

export async function getPortalThreadMessages(session: PortalSession, threadId: string): Promise<PortalMessage[]> {
  if (!(await isPortalThreadInScope(session, threadId))) return []
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("messages")
      .select("id, thread_id, sender_id, sender_name, content, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(200)
    if (error) return []
    return ((data ?? []) as Record<string, unknown>[])
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id as string,
        threadId: m.thread_id as string,
        senderName: (m.sender_name as string) || "Property manager",
        content: (m.content as string) ?? "",
        createdAt: m.created_at as string,
        fromMe: (m.sender_id as string | null) === session.contactId,
      }))
  } catch {
    return []
  }
}

/** One-shot inbox load for the Messages page: threads + their messages + the
 *  manager (workspace) name. Pre-loads messages so thread switching is instant. */
export async function loadPortalInbox(session: PortalSession): Promise<{
  threads: PortalThread[]
  messagesByThread: Record<string, PortalMessage[]>
  managerName: string
}> {
  const threads = await getPortalThreads(session)
  const entries = await Promise.all(
    threads.map(async (t) => [t.id, await getPortalThreadMessages(session, t.id)] as const)
  )
  const messagesByThread: Record<string, PortalMessage[]> = {}
  for (const [id, msgs] of entries) messagesByThread[id] = msgs
  return { threads, messagesByThread, managerName: session.workspaceName || "your property manager" }
}

/** Resolve the portal contact's display name (for sender_name on send). */
export async function getPortalContactName(session: PortalSession): Promise<string> {
  if (!session.contactId) return "Portal user"
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("contacts")
      .select("display_name, company")
      .eq("id", session.contactId)
      .eq("workspace_id", session.workspaceId)
      .maybeSingle()
    const c = data as { display_name?: string; company?: string } | null
    return c?.display_name || c?.company || "Portal user"
  } catch {
    return "Portal user"
  }
}
