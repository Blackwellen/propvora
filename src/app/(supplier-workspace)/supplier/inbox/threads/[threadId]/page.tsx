"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/inbox/threads/[threadId] — message thread detail.

   Manifest image 38 (desktop): 3 columns — thread list · conversation · right
   linked-record + SLA panel.
   Manifest image 39 (?view=mobile): single-column field view — chat-first with
   quick-action chips and a "Mark update complete" affordance.

   Sending is a typed stub (optimistic append + toast + audit TODO) until
   supplier_messages writes are wired. Reuses the supplier-workspace UI kit and
   the existing /supplier shell (no new chrome).
─────────────────────────────────────────────────────────────────────────── */

import { Suspense, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  ChevronLeft, Search, Send, Paperclip, Phone, MapPin, Clock, AlertTriangle,
  Briefcase, FileText, Inbox as InboxIcon, CheckCircle2, ChevronRight, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierButton, SupplierStatusBadge } from "@/components/supplier-workspace/ui"
import { moneyPence, timeAgo, shortDate } from "@/components/supplier-workspace/format"
import {
  SEED_THREADS, getSeedThreadDetail,
  type InboxMessage, type ThreadChannel,
} from "@/features/supplier/inbox/data/threads"

const CHANNEL_META: Record<ThreadChannel, { icon: typeof Briefcase; label: string }> = {
  job: { icon: Briefcase, label: "Job" },
  quote: { icon: FileText, label: "Quote" },
  request: { icon: InboxIcon, label: "Request" },
  general: { icon: InboxIcon, label: "General" },
}

function slaState(slaDueAt: string | null): { tone: "red" | "amber" | "emerald" | "slate"; label: string } {
  if (!slaDueAt) return { tone: "slate", label: "No SLA" }
  const due = new Date(slaDueAt).getTime()
  const mins = Math.round((due - Date.now()) / 60000)
  if (mins < 0) return { tone: "red", label: `Overdue ${Math.abs(Math.round(mins / 60))}h` }
  if (mins < 120) return { tone: "amber", label: `Due in ${mins}m` }
  return { tone: "emerald", label: `Due in ${Math.round(mins / 60)}h` }
}

export default function SupplierThreadDetailPage() {
  return <Suspense fallback={null}><ThreadDetailInner /></Suspense>
}

function ThreadDetailInner() {
  const { threadId } = useParams<{ threadId: string }>()
  const params = useSearchParams()
  const isMobile = params.get("view") === "mobile"

  const detail = useMemo(() => getSeedThreadDetail(threadId), [threadId])
  const [messages, setMessages] = useState<InboxMessage[]>(detail.messages)
  const [draft, setDraft] = useState("")
  const [filter, setFilter] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  function send(body: string) {
    const text = body.trim()
    if (!text) return
    // STUB: optimistic append. TODO(supplier-messages): POST to
    // /api/supplier/messages then reconcile; write audit event `message.sent`.
    setMessages((m) => [
      ...m,
      { id: `local-${Date.now()}`, author: "supplier", authorName: "You", body: text, createdAt: new Date().toISOString() },
    ])
    setDraft("")
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }))
  }

  const sla = slaState(detail.slaDueAt)
  const threads = SEED_THREADS

  // ── Conversation column (shared between desktop + mobile) ─────────────────
  const conversation = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
        {isMobile && (
          <Link href="/supplier/inbox" className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm shrink-0">
          {detail.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-900 truncate">{detail.name}</p>
            {detail.customer.returning && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
          </div>
          <p className="text-xs text-slate-400 truncate">{detail.subject}</p>
        </div>
        {detail.customer.phone && (
          <a href={`tel:${detail.customer.phone}`} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Call">
            <Phone className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
        {messages.map((m) => <MessageBubble key={m.id} m={m} />)}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white">
        <div className="flex gap-1.5 px-3 pt-2.5 pb-1 overflow-x-auto">
          {detail.quickReplies.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 px-3 py-2.5">
          <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 shrink-0" aria-label="Attach" title="Attach (upload-only)">
            <Paperclip className="w-4 h-4" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft) } }}
            rows={1}
            placeholder="Write a message…"
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 max-h-28"
          />
          <SupplierButton onClick={() => send(draft)} disabled={!draft.trim()} className="shrink-0">
            <Send className="w-4 h-4" /> Send
          </SupplierButton>
        </div>
      </div>
    </div>
  )

  // ── Mobile field view (image 39) ──────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden h-[80vh] flex flex-col">
          {detail.linked && (
            <div className="shrink-0 bg-blue-600 text-white px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-blue-100">{CHANNEL_META[detail.channel].label} · {detail.linked.ref}</p>
              <p className="text-sm font-semibold truncate">{detail.linked.title}</p>
              {detail.linked.address && (
                <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{detail.linked.address}</p>
              )}
              <div className="flex gap-2 mt-2.5">
                {detail.customer.phone && (
                  <a href={`tel:${detail.customer.phone}`} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 py-1.5 text-xs font-semibold">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
                {detail.linked.address && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(detail.linked.address)}`} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 py-1.5 text-xs font-semibold">
                    <MapPin className="w-3.5 h-3.5" /> Maps
                  </a>
                )}
              </div>
            </div>
          )}
          {conversation}
          {detail.linked?.kind === "job" && (
            <div className="shrink-0 border-t border-slate-100 p-3">
              <Link href={`${detail.linked.href}?view=mobile`} className="flex">
                <SupplierButton className="w-full justify-center">
                  <CheckCircle2 className="w-4 h-4" /> Mark update complete
                </SupplierButton>
              </Link>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">Field view · <Link href={`/supplier/inbox/threads/${threadId}`} className="text-blue-600">open full view</Link></p>
      </div>
    )
  }

  // ── Desktop 3-column (image 38) ───────────────────────────────────────────
  const filteredThreads = threads.filter(
    (t) => !filter || `${t.name} ${t.subject} ${t.preview}`.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Link href="/supplier/inbox" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to inbox
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4 h-[calc(100vh-220px)] min-h-[520px]">
        {/* Thread list */}
        <div className="hidden lg:flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search messages…"
                className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredThreads.map((t) => {
              const Icon = CHANNEL_META[t.channel].icon
              const active = t.id === threadId
              return (
                <Link
                  key={t.id}
                  href={`/supplier/inbox/threads/${t.id}`}
                  className={cn("flex gap-2.5 px-3 py-3 hover:bg-slate-50 transition-colors", active && "bg-blue-50/60")}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{t.name}</p>
                      <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(t.lastAt)}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{t.preview}</p>
                  </div>
                  {t.unread > 0 && <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center shrink-0 self-center">{t.unread}</span>}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Conversation */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {conversation}
        </div>

        {/* Linked record + SLA */}
        <div className="hidden lg:flex flex-col gap-4 overflow-y-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Reply SLA</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                sla.tone === "red" ? "bg-red-50 text-red-600" : sla.tone === "amber" ? "bg-amber-50 text-amber-600" : sla.tone === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
              )}>
                {sla.tone === "red" ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{sla.label}</p>
                <p className="text-xs text-slate-400">{detail.slaDueAt ? `Target ${shortDate(detail.slaDueAt)}` : "No response deadline"}</p>
              </div>
            </div>
          </div>

          {detail.linked && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Linked {CHANNEL_META[detail.channel].label.toLowerCase()}</p>
                <SupplierStatusBadge status={detail.linked.status} />
              </div>
              <p className="text-sm font-semibold text-slate-900">{detail.linked.title}</p>
              <p className="text-xs text-slate-400">{detail.linked.ref}</p>
              <dl className="mt-3 space-y-2 text-sm">
                {detail.linked.valuePence != null && (
                  <div className="flex justify-between"><dt className="text-slate-500">Value</dt><dd className="font-semibold text-slate-800">{moneyPence(detail.linked.valuePence)}</dd></div>
                )}
                {detail.linked.scheduledAt && (
                  <div className="flex justify-between"><dt className="text-slate-500">Scheduled</dt><dd className="font-semibold text-slate-800">{shortDate(detail.linked.scheduledAt)}</dd></div>
                )}
                {detail.linked.address && (
                  <div className="flex justify-between gap-3"><dt className="text-slate-500 shrink-0">Address</dt><dd className="font-medium text-slate-700 text-right">{detail.linked.address}</dd></div>
                )}
              </dl>
              <Link href={detail.linked.href} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700">
                Open {CHANNEL_META[detail.channel].label.toLowerCase()} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Customer</p>
            <p className="text-sm font-semibold text-slate-900">{detail.customer.name}</p>
            {detail.company && <p className="text-xs text-slate-400">{detail.company}</p>}
            <div className="mt-2 space-y-1.5 text-sm">
              {detail.customer.phone && <p className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{detail.customer.phone}</p>}
              {detail.customer.email && <p className="flex items-center gap-2 text-slate-600 truncate"><FileText className="w-3.5 h-3.5 text-slate-400" />{detail.customer.email}</p>}
            </div>
          </div>

          <Link href={`/supplier/inbox/threads/${threadId}?view=mobile`} className="text-center text-xs text-slate-400 hover:text-slate-600">
            Preview field (mobile) view
          </Link>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ m }: { m: InboxMessage }) {
  if (m.author === "system") {
    return <p className="text-center text-[11px] text-slate-400 py-1">{m.body}</p>
  }
  const mine = m.author === "supplier"
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2", mine ? "bg-[#2563EB] text-white rounded-br-md" : "bg-white border border-slate-200 text-slate-800 rounded-bl-md")}>
        {!mine && <p className="text-[11px] font-semibold text-slate-500 mb-0.5">{m.authorName}</p>}
        <p className="text-sm whitespace-pre-wrap leading-snug">{m.body}</p>
        {m.attachments?.map((a) => (
          <span key={a.name} className={cn("mt-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium", mine ? "bg-white/15" : "bg-slate-100 text-slate-600")}>
            <Paperclip className="w-3 h-3" /> {a.name}
          </span>
        ))}
        <p className={cn("text-[10px] mt-1", mine ? "text-blue-100" : "text-slate-400")}>{timeAgo(m.createdAt)}</p>
      </div>
    </div>
  )
}
