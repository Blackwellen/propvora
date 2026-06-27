"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft, Send, Loader2, MessageSquare, Eye,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import { useWorkspace } from "@/providers/AuthProvider"
import { useSectionLink } from "@/components/sections/SectionBasePath"
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkThreadRead,
  useThreadRealtime,
} from "@/hooks/useMessages"
import type { Message } from "@/types/database"

/* ── Avatar helpers ─────────────────────────────────────────────────────── */
const AVATAR_BG = [
  "bg-[var(--brand)]", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
]
function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

const TYPE_BADGE: Record<string, string> = {
  tenant: "bg-emerald-100 text-emerald-700",
  landlord: "bg-[var(--color-brand-100)] text-[var(--brand)]",
  supplier: "bg-amber-100 text-amber-700",
  applicant: "bg-sky-100 text-sky-700",
  agent: "bg-violet-100 text-violet-700",
  other: "bg-slate-100 text-slate-600",
}

function Bubble({ message }: { message: Message }) {
  // sender_type 'user' = us (workspace operator); everything else = the other party.
  const isUser = message.sender_type === "user"
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-[75%] space-y-1">
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-[var(--brand)] text-white rounded-tr-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
          )}
        >
          {message.body}
        </div>
        <p className={cn("text-[10px] text-slate-400", isUser ? "text-right" : "text-left")}>
          {new Date(message.created_at).toLocaleString("en-GB", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}

export default function ConversationPage() {
  const params = useParams()
  const sectionLink = useSectionLink()
  const conversationId = params.conversationId as string
  const { workspace } = useWorkspace()

  const { data: conversations = [] } = useConversations(workspace?.id)
  const { data: messages = [], isLoading } = useConversationMessages(workspace?.id, conversationId)
  const sendMessage = useSendMessage()
  const markThreadRead = useMarkThreadRead()
  const markRef = useRef<string | null>(null)

  // Live push: new messages in this thread appear without a manual refresh.
  useThreadRealtime(workspace?.id, conversationId)

  // Stamp my id into inbound messages' read_by when the thread is opened/updated
  // so the inbox unread badge and side-nav count clear. Guarded per (thread,
  // message-count) so it only fires when there's genuinely something new to read.
  const markFn = markThreadRead.mutate
  useEffect(() => {
    if (!workspace?.id || isLoading) return
    const key = `${conversationId}:${messages.length}`
    if (markRef.current === key) return
    markRef.current = key
    markFn({ workspaceId: workspace.id, conversationId })
  }, [workspace?.id, conversationId, messages.length, isLoading, markFn])

  const conv = useMemo(
    () => conversations.find((c) => c.id === conversationId) ?? null,
    [conversations, conversationId]
  )
  const name = conv?.contact?.full_name ?? conv?.subject ?? "Conversation"
  const type = conv?.contact?.contact_type ?? "other"

  const [input, setInput] = useState("")
  const threadRef = useRef<HTMLDivElement>(null)
  // Holds the idempotency token for the message currently being (re)sent, so a
  // retry of the same body reuses it — if the first insert actually committed
  // but the client saw a failure, the retry collapses on the unique index
  // instead of duplicating.
  const pendingSendRef = useRef<{ body: string; token: string } | null>(null)

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages])

  async function handleSend() {
    if (!input.trim() || !workspace?.id || sendMessage.isPending) return
    const body = input.trim()
    // Reuse the token if this is a retry of the same body; otherwise mint one.
    const mint = () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : undefined
    let clientToken: string | undefined
    if (pendingSendRef.current?.body === body) {
      clientToken = pendingSendRef.current.token
    } else {
      clientToken = mint()
      if (clientToken) pendingSendRef.current = { body, token: clientToken }
    }
    setInput("")
    try {
      await sendMessage.mutateAsync({ workspaceId: workspace.id, conversationId, body, clientToken })
      pendingSendRef.current = null // delivered — drop the token
    } catch {
      setInput(body) // restore on failure; token is retained for the retry
    }
  }

  return (
    <DashboardContainer>
      {/* Mobile top bar — native back chevron + contact name; opens full-screen thread */}
      <MobileTopBar
        title={name}
        subtitle={conv?.subject ?? (type.charAt(0).toUpperCase() + type.slice(1))}
        showBack
        backHref={sectionLink("/property-manager/messages")}
        overflowActions={
          conv?.contact?.id
            ? [{ label: "View Profile", icon: Eye, href: `/property-manager/contacts/${conv.contact.id}` }]
            : undefined
        }
      />

      <div className="space-y-0">
        {/* Back — desktop only below lg (MobileTopBar owns 768–1023 + phones) */}
        <Link href={sectionLink("/property-manager/messages")} className="hidden lg:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Messages
        </Link>

        {/* Full-bleed thread on phones; framed card on desktop. The mobile
            height leaves room for the MobileTopBar, shell padding and the fixed
            bottom nav so the composer stays reachable above it. */}
        <div className="flex flex-col overflow-hidden bg-white border-slate-200 h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom,0px)-128px)] min-h-[420px] md:rounded-2xl md:border md:h-[calc(100vh-220px)] md:min-h-[480px]">
          {/* Header — desktop only (≥lg); MobileTopBar owns 768–1023 + phones */}
          <div className="hidden lg:flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarBg(name))}>
                {initials(name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                  <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium", TYPE_BADGE[type] ?? TYPE_BADGE.other)}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </div>
                {conv?.subject && <p className="text-xs text-slate-500 truncate">{conv.subject}</p>}
              </div>
            </div>
            {conv?.contact?.id && (
              <Link
                href={`/property-manager/contacts/${conv.contact.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
              >
                <Eye className="w-3.5 h-3.5" /> View Profile
              </Link>
            )}
          </div>

          {/* Thread */}
          <div ref={threadRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <MessageSquare className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No messages in this conversation yet</p>
                <p className="text-xs text-slate-400 mt-1">Send the first message below.</p>
              </div>
            ) : (
              messages.map((msg) => <Bubble key={msg.id} message={msg} />)
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-slate-200 bg-white p-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <textarea
                aria-label="Type a message"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend() }}
                rows={2}
                className="w-full resize-none text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">Ctrl+Enter to send</span>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[var(--brand)] hover:bg-[var(--brand-strong)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {sendMessage.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}
