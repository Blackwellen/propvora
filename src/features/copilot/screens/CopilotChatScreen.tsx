"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import CopilotContextBar from "../components/CopilotContextBar"
import CopilotMessageBubble from "../components/CopilotMessageBubble"
import CopilotChatInput from "../components/CopilotChatInput"
import { useCopilotPageContext } from "../context/useCopilotPageContext"
import type { SectionContext } from "../context/useCopilotPageContext"
import { useWorkspace } from "@/providers/AuthProvider"
import type { ChatMessage } from "../types"

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

interface CopilotChatScreenProps {
  /** Optional section context injected by the page that opens the copilot. */
  sectionContext?: SectionContext
}

export default function CopilotChatScreen({ sectionContext }: CopilotChatScreenProps) {
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
    async (text: string, msgSectionContext?: SectionContext) => {
      if (streaming) return
      setError(null)

      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: now() }
      const aiId = `a-${Date.now()}`
      const aiMsg: ChatMessage = { id: aiId, role: "ai", content: "", timestamp: now() }
      setMessages((prev) => [...prev, userMsg, aiMsg])
      setStreaming(true)
      setStreamingId(aiId)

      // Use the per-message context if provided, then fall back to the
      // component-level sectionContext prop (set by the opening page).
      const effectiveSectionContext = msgSectionContext ?? sectionContext

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            threadId,
            contextRoute: context.breadcrumb || undefined,
            workspaceId: workspace?.id,
            ...(effectiveSectionContext ? { sectionContext: effectiveSectionContext } : {}),
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

        const reader = res.body?.getReader()
        if (!reader) {
          const full = await res.text()
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: full } : m)))
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
    [streaming, threadId, context.breadcrumb, workspace?.id, sectionContext]
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
          />
        ))}
      </div>

      {error && (
        <div className="px-4 pb-1">
          <p className="text-[11px] text-red-500">{error}</p>
        </div>
      )}

      <div className="px-4 pb-4 pt-2 shrink-0">
        <CopilotChatInput
          context={context}
          onSend={handleSend}
          sectionContext={sectionContext}
        />
      </div>
    </div>
  )
}
