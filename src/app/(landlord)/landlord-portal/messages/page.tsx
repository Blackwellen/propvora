"use client"

import React, { useEffect, useMemo, useState } from "react"
import { MessageSquare, Send, ChevronLeft } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveLandlordContext, resolveLandlordPropertyIds, formatDate,
  type LandlordContext,
} from "../_lib/landlord-context"
import {
  listPortalThreads, listThreadMessages, sendThreadMessage,
  type PortalThread, type PortalMessage,
} from "@/lib/portal/messaging"

type ConversationRow = PortalThread
type MessageRow = PortalMessage

export default function LandlordMessagesPage() {
  const [ctx, setCtx] = useState<LandlordContext | null>(null)
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [noContext, setNoContext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: auth } = await supabase.auth.getUser()
        setMyUserId(auth.user?.id ?? null)

        const landlord = await resolveLandlordContext()
        if (!landlord) { setNoContext(true); setLoading(false); return }
        setCtx(landlord)

        // LIVE threads scoped strictly to this landlord's own properties + contact.
        const propertyIds = await resolveLandlordPropertyIds(landlord.contactId, landlord.workspaceId)
        const relatedIds = [...propertyIds, landlord.contactId]
        const rows = await listPortalThreads(landlord.workspaceId, relatedIds)
        setConversations(rows)
        if (rows.length > 0) setActiveId(rows[0].id)
      } catch (err) {
        console.error(err)
        setError("Unexpected error loading messages.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!activeId || !ctx) return
    async function loadThread() {
      setLoadingThread(true)
      try {
        setMessages(await listThreadMessages(activeId!))
      } catch { /* tolerate */ } finally {
        setLoadingThread(false)
      }
    }
    loadThread()
  }, [activeId, ctx])

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  )

  async function handleSend() {
    if (!draft.trim() || !activeId || !ctx?.workspaceId) return
    setSending(true)
    try {
      const sent = await sendThreadMessage({
        threadId: activeId,
        workspaceId: ctx.workspaceId,
        senderId: myUserId,
        senderName: ctx.displayName,
        content: draft.trim(),
      })
      if (sent) setMessages((prev) => [...prev, sent])
      setDraft("")
    } catch (err) {
      console.error(err)
      setError("Could not send your message.")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-48" /></div>
        <Skeleton className="h-[28rem] rounded-2xl" />
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No landlord account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Ask your managing agent to grant you portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500">Conversations with your managing agent</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {conversations.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No messages yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              You don&apos;t have any conversations yet. When your managing agent starts a conversation with you,
              it will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <Card noPadding className="rounded-2xl border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[18rem_1fr] h-[32rem]">
            {/* Conversation list */}
            <div className={cn("border-r border-slate-200 overflow-y-auto", activeId && "hidden md:block")}>
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors",
                    activeId === c.id && "bg-[#EFF6FF]"
                  )}
                >
                  <p className="text-sm font-medium text-slate-900 truncate">{c.subject || "Conversation"}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(c.last_message_at ?? c.created_at)}</p>
                </button>
              ))}
            </div>

            {/* Thread */}
            <div className="flex flex-col min-h-0">
              {activeConv && (
                <div className="h-12 border-b border-slate-200 flex items-center gap-2 px-4 shrink-0">
                  <button onClick={() => setActiveId(null)} className="md:hidden p-1 rounded text-slate-500 hover:bg-slate-100">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-800 truncate">{activeConv.subject || "Conversation"}</span>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                {loadingThread ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-2/3 rounded-xl" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No messages in this conversation yet.</p>
                ) : (
                  messages.map((m) => {
                    const fromLandlord = myUserId != null && m.sender_id === myUserId
                    return (
                      <div key={m.id} className={cn("flex", fromLandlord ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2",
                          fromLandlord ? "bg-[#2563EB] text-white" : "bg-white border border-slate-200 text-slate-800"
                        )}>
                          {!fromLandlord && m.sender_name && (
                            <p className="text-[10px] font-semibold text-slate-500 mb-0.5">{m.sender_name}</p>
                          )}
                          <p className="text-sm whitespace-pre-line">{m.content}</p>
                          <p className={cn("text-[10px] mt-1", fromLandlord ? "text-white/70" : "text-slate-400")}>
                            {formatDate(m.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Composer */}
              {activeConv && (
                <div className="border-t border-slate-200 p-3 flex items-end gap-2 shrink-0 bg-white">
                  <textarea
                    className="flex-1 h-10 max-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
                    }}
                  />
                  <Button variant="primary" size="sm" onClick={handleSend} disabled={sending || !draft.trim()}>
                    <Send className="w-4 h-4" /> Send
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
