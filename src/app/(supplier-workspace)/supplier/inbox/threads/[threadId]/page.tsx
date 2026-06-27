"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/inbox/threads/[threadId] — message thread detail.

   Manifest image 38 (desktop): 3 columns — thread list · conversation · right
   SLA + contact panel.
   Manifest image 39 (?view=mobile): single-column field view — chat-first with
   quick-action chips and a "Mark update complete" affordance.
─────────────────────────────────────────────────────────────────────────── */

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  ChevronLeft, Search, Send, Paperclip, Clock, AlertTriangle,
  Inbox as InboxIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierButton, SupplierCard, SupplierLoadingState, SupplierNotReady } from "@/components/supplier-workspace/ui"
import { timeAgo } from "@/components/supplier-workspace/format"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import type { SupplierMessageThread, SupplierMessage } from "@/lib/supplier/messaging"
import type { InboxMessage } from "@/features/supplier/inbox/data/threads"

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
  const { workspaceId } = useSupplierWorkspace()

  const threadDetailUrl = useSupplierApiUrl(`/api/supplier/messages/${threadId}`)
  const threadListUrl = useSupplierApiUrl("/api/supplier/messages")

  const detailApi = useSupplierApi<{ thread: SupplierMessageThread; messages: SupplierMessage[] }>(threadDetailUrl)
  const threadsApi = useSupplierApi<{ items: SupplierMessageThread[]; unreadCount: number }>(
    threadListUrl,
    { select: (j) => j as { items: SupplierMessageThread[]; unreadCount: number } }
  )

  const thread = detailApi.data?.thread ?? null
  const counterpartyName = thread?.counterparty_name ?? "—"
  const threads = threadsApi.data?.items ?? []

  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [draft, setDraft] = useState("")
  const [filter, setFilter] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apiMessages = detailApi.data?.messages
    if (!apiMessages) return
    const cName = detailApi.data?.thread.counterparty_name ?? "Unknown"
    setMessages(
      apiMessages.map((m) => ({
        id: m.id,
        author: m.author_side as InboxMessage["author"],
        authorName: m.author_side === "supplier" ? "You" : (m.author_name ?? cName),
        body: m.body,
        createdAt: m.created_at,
      }))
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailApi.data])

  function send(body: string) {
    const text = body.trim()
    if (!text) return
    const optimistic: InboxMessage = {
      id: `local-${Date.now()}`,
      author: "supplier",
      authorName: "You",
      body: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, optimistic])
    setDraft("")
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }))
    if (workspaceId) {
      fetch(`/api/supplier/messages/${threadId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, body: text }),
      })
        .then(async (res) => {
          if (!res.ok) return
          const { message } = (await res.json()) as { message: SupplierMessage }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimistic.id
                ? { id: message.id, author: "supplier", authorName: "You", body: message.body, createdAt: message.created_at }
                : m
            )
          )
        })
        .catch(() => { /* keep optimistic message on network error */ })
    }
  }

  const sla = slaState(null)

  if (detailApi.loading) {
    return (
      <div className="space-y-4">
        <Link href="/supplier/inbox" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back to inbox
        </Link>
        <SupplierCard className="p-5"><SupplierLoadingState rows={5} /></SupplierCard>
      </div>
    )
  }

  if (detailApi.notReady && !thread) {
    return (
      <div className="space-y-4">
        <Link href="/supplier/inbox" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back to inbox
        </Link>
        <SupplierCard className="p-5">
          <SupplierNotReady icon={InboxIcon} title="Thread not found" description="This thread may have been removed or you may not have access." />
        </SupplierCard>
      </div>
    )
  }

  // ── Conversation column (shared between desktop + mobile) ─────────────────
  const initials = counterpartyName.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("")
  const conversation = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
        {isMobile && (
          <Link href="/supplier/inbox" className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="w-9 h-9 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center font-semibold text-sm shrink-0">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{counterpartyName}</p>
          <p className="text-xs text-slate-400 truncate">{thread?.subject ?? ""}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
        {detailApi.loading && messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Loading messages…</p>
        )}
        {messages.map((m) => <MessageBubble key={m.id} m={m} />)}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white">
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
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[var(--color-brand-100)] max-h-28"
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
          {conversation}
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">Field view · <Link href={`/supplier/inbox/threads/${threadId}`} className="text-[var(--brand)]">open full view</Link></p>
      </div>
    )
  }

  // ── Desktop 3-column (image 38) ───────────────────────────────────────────
  const filteredThreads = threads.filter(
    (t) => !filter || `${t.counterparty_name ?? ""} ${t.subject}`.toLowerCase().includes(filter.toLowerCase())
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
                className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[var(--color-brand-100)]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredThreads.map((t) => {
              const active = t.id === threadId
              return (
                <Link
                  key={t.id}
                  href={`/supplier/inbox/threads/${t.id}`}
                  className={cn("flex gap-2.5 px-3 py-3 hover:bg-slate-50 transition-colors", active && "bg-[var(--brand-soft)]/60")}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <InboxIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{t.counterparty_name ?? "Unknown"}</p>
                      <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(t.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{t.subject}</p>
                  </div>
                  {t.supplier_unread_count > 0 && <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center shrink-0 self-center">{t.supplier_unread_count}</span>}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Conversation */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {conversation}
        </div>

        {/* SLA + Contact */}
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
                <p className="text-xs text-slate-400">No response deadline</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Contact</p>
            <p className="text-sm font-semibold text-slate-900">{counterpartyName}</p>
            {thread?.counterparty_kind && <p className="text-xs text-slate-400 capitalize">{thread.counterparty_kind}</p>}
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
        <p className={cn("text-[10px] mt-1", mine ? "text-[var(--color-brand-100)]" : "text-slate-400")}>{timeAgo(m.createdAt)}</p>
      </div>
    </div>
  )
}
