"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MessagesSquare, Plus, Send, ArrowLeft, Building2, User, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierButton, SupplierDrawer, SupplierField, SupplierBanner,
  supplierInputClass, supplierTextareaClass,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { timeAgo } from "@/components/supplier-workspace/format"

interface ThreadRow {
  id: string
  subject: string
  counterparty_kind: "operator" | "customer" | "platform"
  counterparty_name: string | null
  assignment_id: string | null
  last_message_at: string
  supplier_unread_count: number
}
interface MessageRow {
  id: string
  author_side: "supplier" | "counterparty" | "system"
  author_name: string | null
  body: string
  created_at: string
}

const KIND_ICON = { operator: Building2, customer: User, platform: Globe } as const

export default function SupplierMessagesPage() {
  const { workspaceId } = useSupplierWorkspace()
  const threads = useSupplierApi<{ items: ThreadRow[]; unreadCount: number }>(
    useSupplierApiUrl("/api/supplier/messages"),
    { select: (j) => j as { items: ThreadRow[]; unreadCount: number } }
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [compose, setCompose] = useState({ subject: "", counterparty_kind: "operator", counterparty_name: "", body: "" })
  const [banner, setBanner] = useState<{ tone: "emerald" | "red"; msg: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const items = threads.data?.items ?? []
  const active = useMemo(() => items.find((t) => t.id === activeId) ?? null, [items, activeId])

  async function loadThread(id: string) {
    if (!workspaceId) return
    setActiveId(id)
    setLoadingMsgs(true)
    try {
      const res = await fetch(`/api/supplier/messages/${id}?workspaceId=${workspaceId}`)
      if (res.ok) {
        const j = await res.json()
        setMessages(j.messages ?? [])
        threads.refresh()
      }
    } finally {
      setLoadingMsgs(false)
    }
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function send() {
    if (!workspaceId || !activeId || !draft.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/supplier/messages/${activeId}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, body: draft.trim() }),
      })
      if (res.ok) {
        const j = await res.json()
        setMessages((m) => [...m, j.message])
        setDraft("")
        threads.refresh()
      }
    } finally {
      setSending(false)
    }
  }

  async function createThread() {
    if (!workspaceId || !compose.subject.trim()) { setBanner({ tone: "red", msg: "A subject is required." }); return }
    setSending(true)
    try {
      const res = await fetch("/api/supplier/messages", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          subject: compose.subject.trim(),
          counterparty_kind: compose.counterparty_kind,
          counterparty_name: compose.counterparty_name || undefined,
          body: compose.body || undefined,
        }),
      })
      if (!res.ok) { setBanner({ tone: "red", msg: "Couldn't start the thread." }); return }
      const j = await res.json()
      setComposeOpen(false)
      setCompose({ subject: "", counterparty_kind: "operator", counterparty_name: "", body: "" })
      threads.refresh()
      if (j.thread?.id) loadThread(j.thread.id)
    } catch {
      setBanner({ tone: "red", msg: "Network error." })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Messages" subtitle="Conversations" />
      <SupplierPageHeader
        title="Messages"
        subtitle="Threaded conversations with operators and customers — per job, lead or general."
        actions={<SupplierButton onClick={() => { setComposeOpen(true); setBanner(null) }}><Plus className="w-4 h-4" /> New thread</SupplierButton>}
      />

      {banner && <SupplierBanner tone={banner.tone} onDismiss={() => setBanner(null)}>{banner.msg}</SupplierBanner>}

      <SupplierCard className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[520px]">
          {/* Thread list */}
          <div className={cn("border-r border-slate-100 flex flex-col", activeId && "hidden lg:flex")}>
            {threads.loading ? (
              <div className="p-4"><SupplierLoadingState rows={5} /></div>
            ) : items.length === 0 ? (
              <SupplierEmptyState
                icon={MessagesSquare}
                title="No conversations yet"
                description="Start a thread with an operator or customer, or message from a job's detail page."
              />
            ) : (
              <ul className="overflow-y-auto divide-y divide-slate-50">
                {items.map((t) => {
                  const Icon = KIND_ICON[t.counterparty_kind] ?? Building2
                  const isActive = t.id === activeId
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => loadThread(t.id)}
                        className={cn("w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors", isActive && "bg-blue-50/40")}
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{t.subject}</p>
                          <p className="text-xs text-slate-500 truncate">{t.counterparty_name ?? t.counterparty_kind}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(t.last_message_at)}</p>
                        </div>
                        {t.supplier_unread_count > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {t.supplier_unread_count}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Thread view */}
          <div className={cn("flex flex-col", !activeId && "hidden lg:flex")}>
            {!active ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-sm text-slate-400">Select a conversation to read and reply.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100 shrink-0">
                  <button onClick={() => setActiveId(null)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{active.subject}</p>
                    <p className="text-xs text-slate-400 truncate">{active.counterparty_name ?? active.counterparty_kind}</p>
                  </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/40">
                  {loadingMsgs ? (
                    <SupplierLoadingState rows={4} />
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">No messages yet — say hello.</p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.author_side === "supplier"
                      const system = m.author_side === "system"
                      if (system) {
                        return <p key={m.id} className="text-[11px] text-slate-400 text-center">{m.body}</p>
                      }
                      return (
                        <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                            mine ? "bg-[#2563EB] text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                          )}>
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className={cn("text-[10px] mt-1", mine ? "text-white/70" : "text-slate-400")}>{timeAgo(m.created_at)}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="border-t border-slate-100 p-3 shrink-0 flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send() }}
                    placeholder="Write a message… (⌘/Ctrl+Enter to send)"
                    rows={2}
                    className={cn(supplierTextareaClass, "min-h-[44px] flex-1")}
                  />
                  <SupplierButton onClick={send} loading={sending} disabled={!draft.trim()}>
                    <Send className="w-4 h-4" />
                  </SupplierButton>
                </div>
              </>
            )}
          </div>
        </div>
      </SupplierCard>

      <SupplierDrawer
        open={composeOpen} onClose={() => setComposeOpen(false)} title="New conversation"
        footer={<>
          <SupplierButton variant="secondary" onClick={() => setComposeOpen(false)}>Cancel</SupplierButton>
          <SupplierButton onClick={createThread} loading={sending}>Start thread</SupplierButton>
        </>}
      >
        <SupplierField label="Subject" required>
          <input className={supplierInputClass} value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} placeholder="e.g. Access for Tuesday's job" />
        </SupplierField>
        <SupplierField label="Who are you messaging?">
          <select className={supplierInputClass} value={compose.counterparty_kind} onChange={(e) => setCompose({ ...compose, counterparty_kind: e.target.value })}>
            <option value="operator">Property manager (operator)</option>
            <option value="customer">Customer</option>
            <option value="platform">Propvora support</option>
          </select>
        </SupplierField>
        <SupplierField label="Their name" hint="Optional — shown on the thread.">
          <input className={supplierInputClass} value={compose.counterparty_name} onChange={(e) => setCompose({ ...compose, counterparty_name: e.target.value })} />
        </SupplierField>
        <SupplierField label="First message">
          <textarea className={supplierTextareaClass} value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} />
        </SupplierField>
      </SupplierDrawer>
    </div>
  )
}
