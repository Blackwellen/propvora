"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, MoreHorizontal, ExternalLink, Send, Loader2, MessageSquare } from "lucide-react"
import Link from "next/link"
import PersonAvatar from "../components/PersonAvatar"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
} from "@/hooks/useMessages"
import type { Message } from "@/types/database"

// ─── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({ message }: { message: Message }) {
  const isUser = message.sender_type === "user"
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      <div className="shrink-0 mb-0.5">
        {isUser ? (
          <div
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
          >
            PM
          </div>
        ) : (
          <PersonAvatar name="Contact" size={26} />
        )}
      </div>
      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
          }`}
        >
          {message.body}
        </div>
        <span className={`text-[10px] text-slate-400 px-1 ${isUser ? "text-right" : "text-left"}`}>
          {new Date(message.created_at).toLocaleString("en-GB", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CopilotConversationViewProps {
  conversationId: string | null
  onBack: () => void
  isExpanded: boolean
}

export default function CopilotConversationView({
  conversationId,
  onBack,
  isExpanded,
}: CopilotConversationViewProps) {
  const { workspace } = useWorkspace()
  const { data: threads = [] } = useConversations(workspace?.id)
  const { data: messages = [], isLoading } = useConversationMessages(
    workspace?.id,
    conversationId ?? undefined,
  )
  const sendMessage = useSendMessage()

  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const thread = conversationId
    ? threads.find((t) => t.id === conversationId) ?? null
    : null

  const name = thread?.contact?.full_name ?? thread?.subject ?? "Conversation"
  const type = thread?.contact?.contact_type ?? "contact"
  const contactId = thread?.contact?.id ?? null

  async function handleSend() {
    if (!inputValue.trim() || !workspace?.id || !conversationId) return
    const body = inputValue.trim()
    setInputValue("")
    try {
      await sendMessage.mutateAsync({ workspaceId: workspace.id, conversationId, body })
    } catch {
      setInputValue(body) // restore on failure
    }
  }

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
        <MessageSquare className="w-8 h-8 text-slate-300" />
        <p className="text-[13px] font-medium">No conversation selected</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Main conversation */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center mt-1 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <PersonAvatar name={name} size={48} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-slate-900">{name}</span>
                  {type && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  )}
                </div>
                {thread?.subject && (
                  <p className="text-[11px] text-slate-500">{thread.subject}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {contactId && (
              <Link
                href={`/property-manager/contacts/${contactId}`}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                View profile
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0 bg-slate-50/30">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-[13px] font-semibold text-slate-500">No messages yet</p>
              <p className="text-[11px] text-slate-400">Send the first message below.</p>
            </div>
          ) : (
            messages.map((msg) => <Bubble key={msg.id} message={msg} />)
          )}
        </div>

        {/* Composer */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend()
              }}
              placeholder="Type a message…"
              rows={1}
              className="w-full px-4 pt-3 pb-2 text-[13px] text-slate-800 placeholder-slate-400 resize-none outline-none bg-transparent"
              style={{ minHeight: 40, maxHeight: 100 }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = "auto"
                el.style.height = Math.min(el.scrollHeight, 100) + "px"
              }}
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <span className="text-[10px] text-slate-400">Ctrl+Enter to send</span>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sendMessage.isPending}
                aria-label="Send message"
                className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              >
                {sendMessage.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  : <Send className="w-3.5 h-3.5" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right context rail — expanded only */}
      {isExpanded && contactId && (
        <div className="hidden lg:block w-[240px] shrink-0 border-l border-slate-100 overflow-y-auto">
          <div className="p-4 flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Contact
              </p>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <PersonAvatar name={name} size={36} />
                  <div>
                    <p className="text-[12px] font-bold text-slate-800 truncate">{name}</p>
                    {type && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/property-manager/contacts/${contactId}`}
                  className="text-blue-600 text-[10px] font-semibold hover:underline"
                >
                  View full profile ↗
                </Link>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Thread
              </p>
              <div className="rounded-xl border border-slate-100 bg-white p-3 text-[10.5px] text-slate-500 space-y-1">
                {thread?.subject && (
                  <p><span className="font-medium text-slate-700">Subject:</span> {thread.subject}</p>
                )}
                <p><span className="font-medium text-slate-700">Messages:</span> {messages.length}</p>
                {thread?.last_message_at && (
                  <p>
                    <span className="font-medium text-slate-700">Last activity:</span>{" "}
                    {new Date(thread.last_message_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>

            <Link
              href={`/property-manager/messages/conversations/${conversationId}`}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-slate-100 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in full view
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
