/* ──────────────────────────────────────────────────────────────────────────
   Supplier Inbox — thread-detail domain types + 42P01-safe seed.

   The thread detail (manifest images 38 & 39) reads from supplier_message_threads
   + supplier_messages once those relations exist. Until the live read is wired,
   these seeds render a convincing 3-column inbox so the surface is exercisable.
   Money is integer pence; timestamps are ISO.
─────────────────────────────────────────────────────────────────────────── */

export type ThreadChannel = "job" | "quote" | "request" | "general"
export type MessageAuthor = "supplier" | "customer" | "system"

export interface InboxMessage {
  id: string
  author: MessageAuthor
  authorName: string
  body: string
  createdAt: string
  /** Optional attachment chips. */
  attachments?: { name: string; kind: "photo" | "document" }[]
}

export interface InboxThreadSummary {
  id: string
  channel: ThreadChannel
  /** Counterparty (customer / operator) name. */
  name: string
  company: string | null
  subject: string
  preview: string
  lastAt: string
  unread: number
  /** SLA deadline for the supplier's next reply (ISO) — null if none. */
  slaDueAt: string | null
}

export interface LinkedRecord {
  kind: "job" | "quote" | "request"
  ref: string
  title: string
  href: string
  status: string
  valuePence: number | null
  scheduledAt: string | null
  address: string | null
}

export interface InboxThreadDetail extends InboxThreadSummary {
  messages: InboxMessage[]
  linked: LinkedRecord | null
  customer: { name: string; phone: string | null; email: string | null; returning: boolean }
  quickReplies: string[]
}
