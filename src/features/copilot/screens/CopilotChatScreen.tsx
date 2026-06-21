"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import CopilotContextBar from "../components/CopilotContextBar"
import CopilotMessageBubble from "../components/CopilotMessageBubble"
import CopilotChatInput from "../components/CopilotChatInput"
import { useCopilotPageContext } from "../context/useCopilotPageContext"
import { useWorkspace } from "@/providers/AuthProvider"
import type { ChatMessage, QuickAction } from "../types"

// Quick-action definitions keyed by command slug
const QUICK_ACTION_MAP: Record<string, QuickAction[]> = {
  "/summarise": [
    { slug: "/issues", label: "/issues" },
    { slug: "/cashflow-forecast", label: "/cashflow-forecast" },
    { slug: "/review-compliance", label: "/review-compliance" },
  ],
  "/issues": [
    { slug: "/create-task", label: "/create-task" },
    { slug: "/escalation-summary", label: "/escalation-summary" },
  ],
  "/cashflow-forecast": [
    { slug: "/chase-arrears", label: "/chase-arrears" },
    { slug: "/explain-payout", label: "/explain-payout" },
  ],
  "/review-compliance": [
    { slug: "/compliance-calendar", label: "/compliance-calendar" },
    { slug: "/deposit-status", label: "/deposit-status" },
  ],
  "/explain-portfolio": [
    { slug: "/void-properties", label: "/void-properties" },
    { slug: "/tenancy-renewals", label: "/tenancy-renewals" },
  ],
}

/** Detect the first slash command in a message string */
function detectCommand(text: string): string | null {
  const trimmed = text.trimStart()
  if (!trimmed.startsWith("/")) return null
  const tok = trimmed.split(/\s+/, 1)[0].toLowerCase()
  return tok
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "ai",
  content:
    "Hi — I'm your Propvora Copilot. Ask me about this workspace (properties, tenancies, work, money, compliance) or type / for actions.",
  timestamp: now(),
}

export default function CopilotChatScreen() {
  const context = useCopilotPageContext()
  const { workspace } = useWorkspace()
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [streaming, setStreaming] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = useCallback(
    async (text: string) => {
      if (streaming) return
      setError(null)

      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: now() }
      const aiId = `a-${Date.now()}`
      const aiMsg: ChatMessage = { id: aiId, role: "ai", content: "", timestamp: now() }
      setMessages((prev) => [...prev, userMsg, aiMsg])
      setStreaming(true)
      setStreamingId(aiId)

      // Build page context JSON — includes entity IDs from context if available
      const pageContextPayload = context.entityId
        ? JSON.stringify({ section: context.section, [context.entityIdKey ?? "entityId"]: context.entityId })
        : context.section
          ? JSON.stringify({ section: context.section })
          : undefined

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            threadId,
            contextRoute: context.breadcrumb || undefined,
            workspaceId: workspace?.id,
            pageContext: pageContextPayload,
          }),
        })

        if (!res.ok) {
          let msg = "Something went wrong. Please try again."
          try {
            const j = await res.json()
            if (typeof j.error === "string") msg = j.error
          } catch {
            /* ignore */
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: msg } : m))
          )
          setError(msg)
          return
        }

        const newThread = res.headers.get("X-Thread-Id")
        if (newThread) setThreadId(newThread)

        // Detect active command for quick-action injection
        const commandSlug = res.headers.get("X-AI-Command") || detectCommand(text)

        const reader = res.body?.getReader()
        if (!reader) {
          const full = await res.text()
          const quickActions = commandSlug ? QUICK_ACTION_MAP[commandSlug] : undefined
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: full, quickActions } : m))
          )
          return
        }
        const decoder = new TextDecoder()
        let acc = ""
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          acc += decoder.decode(value, { stream: true })
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: acc } : m)))
        }
        // After stream completes, inject quick actions if applicable
        const quickActions = commandSlug ? QUICK_ACTION_MAP[commandSlug] : undefined
        if (quickActions) {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, quickActions } : m))
          )
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId ? { ...m, content: "Connection lost. Please check your network and try again." } : m
          )
        )
        setError("Connection lost.")
      } finally {
        setStreaming(false)
        setStreamingId(null)
      }
    },
    [streaming, threadId, context, workspace?.id]
  )

  // Quick action chip click: prefill and send the slug as a command
  const handleQuickAction = useCallback(
    (slug: string) => {
      handleSend(slug)
    },
    [handleSend]
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      <CopilotContextBar breadcrumb={context.breadcrumb} onSwitch={() => {}} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
        {messages.map((msg) => (
          <CopilotMessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            card={msg.card}
            streaming={streaming && msg.id === streamingId}
            quickActions={msg.quickActions}
            onQuickAction={handleQuickAction}
          />
        ))}
      </div>

      {error && (
        <div className="px-4 pb-1">
          <p className="text-[11px] text-red-500">{error}</p>
        </div>
      )}

      <div className="px-4 pb-4 pt-2 shrink-0">
        <CopilotChatInput context={context} onSend={handleSend} />
      </div>
    </div>
  )
}
