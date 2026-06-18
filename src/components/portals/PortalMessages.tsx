"use client"

import { useMemo, useState } from "react"
import { MessageSquare, Send, Plus, ArrowLeft, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PortalThread, PortalMessage } from "@/lib/portal/messaging-server"

function timeLabel(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

/**
 * PortalMessages — the external portal inbox. Threads + messages are pre-loaded
 * server-side (session-scoped); replies and new conversations POST to
 * /api/portal/messages (validated against the session). Visual language matches
 * the portal pages (slate, rounded-2xl cards).
 */
export default function PortalMessages({
  threads: initialThreads,
  messagesByThread: initialMessages,
  managerName,
}: {
  threads: PortalThread[]
  messagesByThread: Record<string, PortalMessage[]>
  managerName: string
}) {
  const [threads, setThreads] = useState<PortalThread[]>(initialThreads)
  const [messages, setMessages] = useState<Record<string, PortalMessage[]>>(initialMessages)
  const [selectedId, setSelectedId] = useState<string | null>(initialThreads[0]?.id ?? null)
  const [composing, setComposing] = useState(initialThreads.length === 0)
  const [subject, setSubject] = useState("")
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false)

  const selected = useMemo(() => threads.find((t) => t.id === selectedId) ?? null, [threads, selectedId])
  const thread = selectedId ? messages[selectedId] ?? [] : []

  async function send() {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: composing ? undefined : selectedId, content, subject: composing ? subject : undefined }),
      })
      const json = (await res.json()) as { ok: boolean; error?: string; threadId?: string; message?: PortalMessage }
      if (!json.ok || !json.message || !json.threadId) {
        setError(json.error || "Could not send. Please try again.")
        return
      }
      const tid = json.threadId
      setMessages((m) => ({ ...m, [tid]: [...(m[tid] ?? []), json.message as PortalMessage] }))
      if (composing) {
        const newThread: PortalThread = {
          id: tid,
          subject: subject.trim() || "New conversation",
          relatedId: null,
          lastMessageAt: json.message.createdAt,
          createdAt: json.message.createdAt,
        }
        setThreads((t) => [newThread, ...t.filter((x) => x.id !== tid)])
        setComposing(false)
        setSubject("")
      }
      setSelectedId(tid)
      setMobileThreadOpen(true)
      setDraft("")
    } catch {
      setError("Could not send. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-0.5">Chat securely with {managerName}.</p>
        </div>
        <button
          onClick={() => { setComposing(true); setSelectedId(null); setMobileThreadOpen(true); setError(null) }}
          className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-3.5 py-2 text-[13px] font-semibold"
        >
          <Plus className="w-4 h-4" /> New message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
        {/* Thread list */}
        <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", mobileThreadOpen && "hidden lg:block")}>
          <div className="px-4 py-3 border-b border-slate-100"><p className="text-[13px] font-bold text-slate-900">Conversations</p></div>
          {threads.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12.5px] text-slate-400">No conversations yet. Start one with “New message”.</div>
          ) : (
            <ul className="max-h-[560px] overflow-y-auto divide-y divide-slate-50">
              {threads.map((t) => {
                const last = (messages[t.id] ?? [])[(messages[t.id] ?? []).length - 1]
                const active = t.id === selectedId && !composing
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => { setSelectedId(t.id); setComposing(false); setMobileThreadOpen(true) }}
                      className={cn("w-full text-left flex gap-2.5 p-3 transition-colors", active ? "bg-blue-50/50" : "hover:bg-slate-50")}
                    >
                      <span className="w-9 h-9 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4" /></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2"><p className="text-[12.5px] font-semibold text-slate-800 truncate">{t.subject}</p><span className="text-[10.5px] text-slate-400 shrink-0">{timeLabel(t.lastMessageAt ?? t.createdAt)}</span></div>
                        <p className="text-[11.5px] text-slate-400 truncate">{last ? `${last.fromMe ? "You: " : ""}${last.content}` : "No messages yet"}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Conversation / composer */}
        <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[560px]", !mobileThreadOpen && "hidden lg:flex")}>
          {composing ? (
            <>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <button onClick={() => { setComposing(false); setMobileThreadOpen(false); setSelectedId(threads[0]?.id ?? null) }} className="lg:hidden p-1 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
                <p className="text-[13px] font-bold text-slate-900">New message to {managerName}</p>
              </div>
              <div className="p-4">
                <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-100 mb-3" />
              </div>
            </>
          ) : selected ? (
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <button onClick={() => setMobileThreadOpen(false)} className="lg:hidden p-1 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
              <span className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4" /></span>
              <div className="min-w-0"><p className="text-[13px] font-semibold text-slate-800 truncate">{selected.subject}</p><p className="text-[11px] text-slate-400">with {managerName}</p></div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[13px] text-slate-400">Select a conversation</div>
          )}

          {!composing && selected && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {thread.length === 0 ? (
                <p className="text-center text-[12.5px] text-slate-400 py-8">No messages yet — say hello below.</p>
              ) : thread.map((m) => (
                <div key={m.id} className={cn("flex gap-2", m.fromMe && "flex-row-reverse")}>
                  <span className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
                  <div className="max-w-[78%]">
                    <div className={cn("rounded-2xl px-3 py-2 text-[12.5px]", m.fromMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm")}>{m.content}</div>
                    <p className={cn("text-[10px] text-slate-400 mt-0.5", m.fromMe && "text-right")}>{m.fromMe ? "You" : m.senderName} · {timeLabel(m.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(composing || selected) && (
            <div className="p-3 border-t border-slate-100 mt-auto">
              {error && <p className="text-[11.5px] text-red-600 mb-2 px-1">{error}</p>}
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Type your message…"
                  rows={2}
                  className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none resize-none focus:ring-2 focus:ring-blue-100"
                />
                <button onClick={send} disabled={sending || !draft.trim()} className={cn("inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white", sending || !draft.trim() ? "bg-slate-300" : "bg-[#0D1B2A] hover:bg-[#0b1622]")}>
                  <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send"}
                </button>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-2 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Messages are private between you and {managerName}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
