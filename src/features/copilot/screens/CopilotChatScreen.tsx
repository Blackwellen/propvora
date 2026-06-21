"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
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

interface CapInfo {
  used: number
  limit: number
  enabled: boolean
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
  const [capInfo, setCapInfo] = useState<CapInfo | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch monthly usage on mount so the meter shows from the first open.
  useEffect(() => {
    let active = true
    fetch("/api/ai/usage")
      .then((r) => r.json())
      .then((d: CapInfo) => {
        if (active) setCapInfo(d)
      })
      .catch(() => {/* non-fatal */})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = useCallback(
    async (text: string) => {
      if (streaming) return
      setError(null)

      const trimmed = text.trim()

      // ── Client-only commands — never sent to the API ──────────────────────
      if (trimmed === "/help" || trimmed === "?") {
        const helpText = [
          "Available slash commands:",
          "",
          "/summarise — Summarise this workspace",
          "/issues — List open issues",
          "/cashflow-forecast — Cashflow forecast",
          "/review-compliance — Compliance review",
          "/explain-portfolio — Portfolio breakdown",
          "/create-task — Draft a task",
          "/chase-arrears — Draft arrears chase",
          "/void-properties — List void properties",
          "/tenancy-renewals — Upcoming renewals",
          "",
          "Type /clear to reset this chat.",
          "Type ? or /help to show this again.",
        ].join("\n")
        const helpMsg: ChatMessage = {
          id: `help-${Date.now()}`,
          role: "ai",
          content: helpText,
          timestamp: now(),
        }
        setMessages((prev) => [
          ...prev,
          { id: `u-${Date.now()}`, role: "user", content: trimmed, timestamp: now() },
          helpMsg,
        ])
        return
      }

      if (trimmed === "/clear") {
        setMessages([WELCOME])
        setThreadId(undefined)
        setError(null)
        return
      }
      // ─────────────────────────────────────────────────────────────────────

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

  // Plan gate: AI not enabled on this plan
  if (capInfo && !capInfo.enabled && capInfo.limit === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <Sparkles className="h-8 w-8 text-slate-300" />
        <p className="text-[14px] font-[600] text-slate-700">AI Copilot not included</p>
        <p className="text-[12px] text-slate-500">
          Upgrade to Scale or above to unlock AI assistance for your portfolio.
        </p>
        <Link
          href="/property-manager/billing"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[13px] font-[600] hover:bg-blue-700 transition-colors"
        >
          Upgrade plan
        </Link>
      </div>
    )
  }

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

      {/* Usage meter — shown only when AI is enabled and limit is finite */}
      {capInfo && capInfo.limit > 0 && capInfo.limit < 9999 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-500 font-[500]">
              AI messages this month
            </span>
            <span className="text-[10px] font-[700] text-slate-700">
              {capInfo.used}/{capInfo.limit}
            </span>
          </div>
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (capInfo.used / capInfo.limit) * 100)}%` }}
            />
          </div>
          {capInfo.used >= capInfo.limit && (
            <p className="text-[10px] text-amber-600 mt-1 font-[500]">
              Limit reached.{" "}
              <Link href="/property-manager/billing" className="underline">
                Upgrade plan
              </Link>{" "}
              for more messages.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
