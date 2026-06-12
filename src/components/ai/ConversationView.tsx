"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ArrowLeft,
  ExternalLink,
  MoreVertical,
  Paperclip,
  Sparkles,
  Send,
  Building2,
  CheckSquare,
  Check,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isToday, isYesterday } from "date-fns"
import type { MockConversation, MockMessage } from "./InboxPanel"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
interface ConversationViewProps {
  conversation: MockConversation
  onBack: () => void
  onUpdateConversation: (updated: MockConversation) => void
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const AVATAR_COLOURS: Record<string, string> = {
  tenant: "bg-[#2563EB]",
  landlord: "bg-[#059669]",
  supplier: "bg-[#D97706]",
  agent: "bg-[#7C3AED]",
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function dateSeparatorLabel(date: Date): string {
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "d MMM yyyy")
}

function shouldShowDateSeparator(messages: MockMessage[], index: number): boolean {
  if (index === 0) return true
  const prev = messages[index - 1]
  const curr = messages[index]
  return dateSeparatorLabel(prev.timestamp) !== dateSeparatorLabel(curr.timestamp)
}

/* ------------------------------------------------------------------ */
/* TypingIndicator                                                      */
/* ------------------------------------------------------------------ */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center shrink-0">
        <Sparkles className="w-3 h-3 text-[#7C3AED]" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2.5">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* MessageBubble                                                        */
/* ------------------------------------------------------------------ */
function MessageBubble({ message }: { message: MockMessage }) {
  const isUser = message.role === "user"
  const isAi = message.role === "ai"

  return (
    <div
      className={cn(
        "flex items-end gap-2 mb-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar (contact / ai only) */}
      {!isUser && (
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white",
            isAi ? "bg-[#F5F3FF] border border-[#DDD6FE]" : "bg-slate-300"
          )}
        >
          {isAi ? (
            <Sparkles className="w-3 h-3 text-[#7C3AED]" />
          ) : (
            <span className="text-slate-600">?</span>
          )}
        </div>
      )}

      <div className={cn("flex flex-col max-w-[75%]", isUser ? "items-end" : "items-start")}>
        {isAi && (
          <span className="text-[10px] font-medium text-[#7C3AED] mb-0.5 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> AI Assist
          </span>
        )}

        <div
          className={cn(
            "px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "bg-[#2563EB] text-white rounded-2xl rounded-br-sm"
              : isAi
              ? "bg-[#F5F3FF] text-[#4C1D95] border border-[#DDD6FE] rounded-2xl rounded-bl-sm"
              : "bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-sm"
          )}
        >
          {message.content}
        </div>

        {/* Timestamp + read receipt */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] text-slate-400">
            {format(message.timestamp, "HH:mm")}
          </span>
          {isUser && (
            <span className="text-[10px] text-[#2563EB]">
              {message.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* ConversationView                                                     */
/* ------------------------------------------------------------------ */
export default function ConversationView({
  conversation,
  onBack,
  onUpdateConversation,
}: ConversationViewProps) {
  const [text, setText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { contact } = conversation

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation.messages, isTyping])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: MockMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
      read: false,
    }

    onUpdateConversation({
      ...conversation,
      messages: [...conversation.messages, userMsg],
      unread: 0,
    })
    setText("")

    // Simulate contact reply after a brief delay (demo only)
    setIsTyping(true)
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000))
    setIsTyping(false)

    const replyMsg: MockMessage = {
      id: `msg-${Date.now()}-reply`,
      role: "contact",
      content: "Thanks for your message. I'll get back to you shortly.",
      timestamp: new Date(),
      read: false,
    }
    onUpdateConversation({
      ...conversation,
      messages: [...conversation.messages, userMsg, replyMsg],
      unread: 0,
    })
  }, [text, conversation, onUpdateConversation])

  const handleAiAssist = useCallback(async () => {
    setAiLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setAiLoading(false)
    setText(
      "Thank you for getting in touch. I'm looking into this and will provide an update within 24 hours. Please don't hesitate to reach out if you need anything urgent in the meantime."
    )
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 96) + "px"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0",
            AVATAR_COLOURS[contact.type] ?? "bg-slate-400"
          )}
        >
          {getInitials(contact.name)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{contact.name}</p>
          <p className="text-[10px] text-slate-500 capitalize">{contact.type}</p>
        </div>

        <a
          href={`/app/contacts/${contact.id}`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-slate-100 transition-colors"
          title="View contact"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Linked record chip */}
      {conversation.linkedRecord && (
        <a
          href={conversation.linkedRecord.href}
          className={cn(
            "flex items-center gap-2 mx-3 my-2 px-3 py-1.5 rounded-lg",
            "bg-slate-50 border border-slate-200",
            "text-xs text-slate-600 hover:text-[#2563EB] transition-colors shrink-0"
          )}
        >
          {conversation.linkedRecord.type === "property" ? (
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="truncate">{conversation.linkedRecord.label}</span>
          <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
        </a>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {conversation.messages.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No messages yet. Say hello!
          </div>
        )}

        {conversation.messages.map((msg: MockMessage, idx: number) => (
          <div key={msg.id}>
            {shouldShowDateSeparator(conversation.messages, idx) && (
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] text-slate-400 font-medium shrink-0">
                  {dateSeparatorLabel(msg.timestamp)}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}
            <MessageBubble message={msg} />
          </div>
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-slate-100 px-3 py-2.5">
        <div className={cn(
          "flex items-end gap-2 rounded-xl border border-slate-200",
          "bg-white p-2 focus-within:ring-2 focus-within:ring-[#2563EB]/30 transition-all"
        )}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className={cn(
              "flex-1 resize-none text-sm bg-transparent",
              "text-slate-800 placeholder:text-slate-400",
              "focus:outline-none leading-relaxed min-h-[32px] max-h-24"
            )}
            style={{ height: "32px" }}
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={handleAiAssist}
              disabled={aiLoading}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                aiLoading
                  ? "text-[#7C3AED] bg-[#F5F3FF] animate-pulse"
                  : "text-slate-400 hover:text-[#7C3AED] hover:bg-[#F5F3FF]"
              )}
              title="AI reply suggestion"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                text.trim()
                  ? "bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              )}
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 text-right">Shift+Enter for new line</p>
      </div>
    </div>
  )
}
