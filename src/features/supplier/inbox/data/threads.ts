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

const HOUR = 3_600_000

function iso(offsetMs: number): string {
  return new Date(Date.now() - offsetMs).toISOString()
}

export const SEED_THREADS: InboxThreadSummary[] = [
  {
    id: "thr-1001",
    channel: "job",
    name: "Priya Nair",
    company: "Priya & Co Property Management",
    subject: "Boiler service — 14 Maple Street",
    preview: "Great, the access code is 4821. The tenant will be in after 9am.",
    lastAt: iso(0.4 * HOUR),
    unread: 2,
    slaDueAt: iso(-3 * HOUR),
  },
  {
    id: "thr-1002",
    channel: "quote",
    name: "Daniel Osei",
    company: "Osei Lettings",
    subject: "Quote QT-2025-0188 — Communal lighting",
    preview: "Can you confirm the warranty period on the LED fittings?",
    lastAt: iso(5 * HOUR),
    unread: 0,
    slaDueAt: iso(-20 * HOUR),
  },
  {
    id: "thr-1003",
    channel: "request",
    name: "Sarah Mitchell",
    company: null,
    subject: "Leaking tap — urgent",
    preview: "You: I can come tomorrow morning between 8 and 10.",
    lastAt: iso(26 * HOUR),
    unread: 0,
    slaDueAt: null,
  },
]

export const SEED_THREAD_DETAILS: Record<string, InboxThreadDetail> = {
  "thr-1001": {
    ...SEED_THREADS[0],
    customer: { name: "Priya Nair", phone: "+44 7700 900145", email: "priya@priyaco.co.uk", returning: true },
    quickReplies: ["On my way", "Running 15 min late", "Job complete — uploading evidence", "Can you confirm access?"],
    linked: {
      kind: "job",
      ref: "JOB-2025-0421",
      title: "Annual boiler service",
      href: "/supplier/jobs/JOB-2025-0421",
      status: "scheduled",
      valuePence: 16500,
      scheduledAt: iso(-18 * HOUR),
      address: "14 Maple Street, Manchester M14 5TP",
    },
    messages: [
      { id: "m1", author: "system", authorName: "Propvora", body: "Job JOB-2025-0421 assigned to you.", createdAt: iso(30 * HOUR) },
      { id: "m2", author: "customer", authorName: "Priya Nair", body: "Hi — are you still able to do the boiler service this week?", createdAt: iso(28 * HOUR) },
      { id: "m3", author: "supplier", authorName: "You", body: "Yes, I can come Thursday morning. Does the tenant need notice?", createdAt: iso(27 * HOUR) },
      { id: "m4", author: "customer", authorName: "Priya Nair", body: "Great, the access code is 4821. The tenant will be in after 9am.", createdAt: iso(0.4 * HOUR), attachments: [{ name: "access-note.pdf", kind: "document" }] },
    ],
  },
  "thr-1002": {
    ...SEED_THREADS[1],
    customer: { name: "Daniel Osei", phone: "+44 7700 900221", email: "daniel@oseilettings.com", returning: false },
    quickReplies: ["Sending revised quote", "12-month warranty included", "Happy to discuss", "Quote still valid"],
    linked: {
      kind: "quote",
      ref: "QT-2025-0188",
      title: "Communal LED lighting upgrade",
      href: "/supplier/quotes/QT-2025-0188",
      status: "awaiting",
      valuePence: 84000,
      scheduledAt: null,
      address: "Beech Court, Leeds LS2 9JT",
    },
    messages: [
      { id: "m1", author: "customer", authorName: "Daniel Osei", body: "Can you confirm the warranty period on the LED fittings?", createdAt: iso(5 * HOUR) },
    ],
  },
  "thr-1003": {
    ...SEED_THREADS[2],
    customer: { name: "Sarah Mitchell", phone: null, email: null, returning: false },
    quickReplies: ["On my way", "Confirmed", "Need more info"],
    linked: {
      kind: "request",
      ref: "REQ-2025-0533",
      title: "Leaking kitchen tap",
      href: "/supplier/requests/REQ-2025-0533",
      status: "new",
      valuePence: null,
      scheduledAt: null,
      address: "3 Rowan Close, Salford M6 8AA",
    },
    messages: [
      { id: "m1", author: "customer", authorName: "Sarah Mitchell", body: "The kitchen tap has been leaking since yesterday, getting worse.", createdAt: iso(28 * HOUR) },
      { id: "m2", author: "supplier", authorName: "You", body: "I can come tomorrow morning between 8 and 10.", createdAt: iso(26 * HOUR) },
    ],
  },
}

export function getSeedThreadDetail(threadId: string): InboxThreadDetail {
  return (
    SEED_THREAD_DETAILS[threadId] ?? {
      ...SEED_THREAD_DETAILS["thr-1001"],
      id: threadId,
    }
  )
}
