"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { CustomerCard, CustomerButton, customerTextareaClass } from "./ui"
import { timeAgo } from "./format"
import type { CustomerMessage } from "@/lib/customer/types"

export default function MessageThreadView({
  initial,
  guestName,
  sendAction,
}: {
  initial: CustomerMessage[]
  guestName: string
  sendAction: (body: string) => Promise<void>
}) {
  const [thread, setThread] = useState<CustomerMessage[]>(initial)
  const [draft, setDraft] = useState("")
  const [pending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [thread.length])

  function send() {
    const body = draft.trim()
    if (!body || pending) return
    setDraft("")
    setThread((t) => [
      ...t,
      { id: `tmp-${Date.now()}`, thread_id: "", sender_role: "customer", sender_name: guestName, body, created_at: new Date().toISOString() },
    ])
    startTransition(async () => {
      await sendAction(body)
    })
  }

  return (
    <CustomerCard className="p-5 flex flex-col">
      <div className="flex-1 space-y-3 max-h-[58vh] overflow-y-auto pr-1">
        {thread.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No messages yet. Say hello to your host.</p>
        ) : (
          thread.map((m) => {
            const mine = m.sender_role === "customer"
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-800"}`}>
                  <p className="text-sm whitespace-pre-line">{m.body}</p>
                  <p className={`mt-1 text-[10.5px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                    {m.sender_name || (mine ? "You" : "Host")} · {timeAgo(m.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>
      <div className="mt-4 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          rows={2}
          className={customerTextareaClass}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send()
          }}
        />
        <CustomerButton onClick={send} loading={pending} disabled={!draft.trim()}>
          <Send className="w-4 h-4" /> Send
        </CustomerButton>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Press Ctrl/Cmd + Enter to send.</p>
    </CustomerCard>
  )
}
