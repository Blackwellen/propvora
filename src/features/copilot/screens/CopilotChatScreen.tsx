"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles, Plus, History } from "lucide-react"
import CopilotHistoryScreen from "./CopilotHistoryScreen"
import CopilotQuickActions from "../components/CopilotQuickActions"
import CopilotContextBar from "../components/CopilotContextBar"
import CopilotMessageBubble from "../components/CopilotMessageBubble"
import CopilotChatInput from "../components/CopilotChatInput"
import { useCopilotPageContext } from "../context/useCopilotPageContext"
import { useWorkspace } from "@/providers/AuthProvider"
import type { ChatMessage, QuickAction, ApprovalSpec } from "../types"

const THREAD_STORAGE_KEY = "propvora_copilot_thread_id"

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

/** Build the tool args from the AI's drafted text for the named executor. */
function deriveToolArgs(tool: string, draft: string): Record<string, unknown> {
  const firstLine = (draft.split("\n").find((l) => l.trim()) ?? "Copilot action").trim().slice(0, 120)
  if (tool === "comms.email.draft") {
    return { to: "", subject: firstLine, body: draft }
  }
  if (tool === "doc.generate") {
    // Letter/notice/report → a real branded PDF saved into Documents.
    const isLetter = /dear|letter|notice|offer|tenant|landlord/i.test(draft.slice(0, 300))
    return { kind: isLetter ? "letter" : "report", title: firstLine, instructions: draft }
  }
  // record.create (task)
  return { recordType: "task", title: firstLine, description: draft, summary: firstLine }
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
  const router = useRouter()
  const { workspace } = useWorkspace()
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [streaming, setStreaming] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | undefined>(undefined)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capInfo, setCapInfo] = useState<CapInfo | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load a saved thread's history into the chat view (reused by mount + history).
  const loadThread = useCallback((id: string) => {
    setHistoryLoading(true)
    fetch(`/api/ai/threads/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.messages?.length) { setMessages([WELCOME]); setThreadId(id); return }
        const restored: ChatMessage[] = data.messages.map((m: { id: string; role: string; content: string; created_at: string }) => ({
          id: m.id,
          role: m.role === "user" ? "user" : "ai",
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }))
        setMessages(restored)
        setThreadId(id)
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setHistoryLoading(false))
  }, [])

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

  // Restore thread from localStorage and load history on mount.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(THREAD_STORAGE_KEY) : null
    if (!stored) return
    setHistoryLoading(true)
    fetch(`/api/ai/threads/${stored}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.messages?.length) return
        const restored: ChatMessage[] = data.messages.map((m: { id: string; role: string; content: string; created_at: string }) => ({
          id: m.id,
          role: m.role === "user" ? "user" : "ai",
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }))
        setMessages(restored)
        setThreadId(stored)
      })
      .catch(() => {/* non-fatal — stay on welcome screen */})
      .finally(() => setHistoryLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist threadId to localStorage whenever it changes.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (threadId) localStorage.setItem(THREAD_STORAGE_KEY, threadId)
  }, [threadId])

  function handleNewChat() {
    if (typeof window !== "undefined") localStorage.removeItem(THREAD_STORAGE_KEY)
    setMessages([WELCOME])
    setThreadId(undefined)
    setError(null)
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = useCallback(
    async (text: string, mentions?: { type: string; id: string; label: string }[]) => {
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
        handleNewChat()
        return
      }

      // ── Multi-step agent: "/agent <goal>" → plan a batch of actions ────────
      if (trimmed.toLowerCase().startsWith("/agent")) {
        const goal = trimmed.replace(/^\/agent\s*/i, "").trim()
        const uId = `u-${Date.now()}`, aId = `a-${Date.now()}`
        setMessages((prev) => [...prev, { id: uId, role: "user", content: trimmed, timestamp: now() }, { id: aId, role: "ai", content: "", timestamp: now() }])
        if (!goal) {
          setMessages((prev) => prev.map((m) => (m.id === aId ? { ...m, content: "Tell me the goal, e.g. /agent reschedule all overdue tasks to next Monday" } : m)))
          return
        }
        setStreaming(true); setStreamingId(aId)
        try {
          const res = await fetch("/api/ai/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal, workspaceId: workspace?.id }) })
          const data = await res.json().catch(() => ({}))
          if (res.ok) {
            setMessages((prev) => prev.map((m) => (m.id === aId ? { ...m, content: data.summary || "Here's the plan.", agentPlan: (data.actions?.length ? { summary: data.summary, actions: data.actions, workspaceId: workspace?.id, chatId: threadId } : undefined) } : m)))
          } else {
            setMessages((prev) => prev.map((m) => (m.id === aId ? { ...m, content: data.error || "The agent couldn't plan that." } : m)))
          }
        } catch {
          setMessages((prev) => prev.map((m) => (m.id === aId ? { ...m, content: "Connection lost." } : m)))
        } finally { setStreaming(false); setStreamingId(null) }
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
            mentions,
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

        // Deterministic navigation response: route|label header → attach a
        // "navigate there" action AND auto-route after the short message renders.
        const navHeader = res.headers.get("X-AI-Navigate")
        if (navHeader) {
          const [route, label] = navHeader.split("|")
          const full = await res.text()
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: full || `Opening ${label}…`, navTarget: { route, label } } : m)))
          setStreaming(false); setStreamingId(null)
          // Give the user a beat to read, then navigate.
          setTimeout(() => { try { router.push(route) } catch { /* noop */ } }, 700)
          return
        }

        // Detect active command for quick-action injection
        const commandSlug = res.headers.get("X-AI-Command") || detectCommand(text)

        // Tool/approval headers: if this drafted command maps to a safe executor
        // and needs approval, we attach an approval card once the draft is in.
        const toolName = res.headers.get("X-AI-Tool") || ""
        const requiresApproval = res.headers.get("X-AI-Requires-Approval") === "1"
        const toolCost = parseInt(res.headers.get("X-AI-Tool-Cost") || "1", 10) || 1
        // Server may provide exact args (e.g. record.update with the real id from
        // an @-mention). Prefer those; otherwise derive from the drafted text.
        let serverArgs: Record<string, unknown> | null = null
        try { const a = res.headers.get("X-AI-Tool-Args"); if (a) serverArgs = JSON.parse(a) } catch { /* ignore */ }
        const buildApproval = (draft: string): ApprovalSpec | undefined =>
          toolName && requiresApproval && (serverArgs || draft.trim())
            ? { tool: toolName, args: serverArgs ?? deriveToolArgs(toolName, draft), workspaceId: workspace?.id, chatId: newThread ?? threadId, estimateCredits: toolCost }
            : undefined

        const reader = res.body?.getReader()
        if (!reader) {
          const full = await res.text()
          const quickActions = commandSlug ? QUICK_ACTION_MAP[commandSlug] : undefined
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: full, quickActions, approval: buildApproval(full) } : m))
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
        // After stream completes, inject quick actions + approval card if applicable
        const quickActions = commandSlug ? QUICK_ACTION_MAP[commandSlug] : undefined
        const approval = buildApproval(acc)
        if (quickActions || approval) {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, quickActions, approval } : m))
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
          className="px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[13px] font-[600] hover:bg-[var(--brand-strong)] transition-colors"
        >
          Upgrade plan
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 shrink-0">
        <CopilotContextBar breadcrumb={context.breadcrumb} onSwitch={() => {}} />
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowHistory((v) => !v)}
            title="Chat history & folders"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${showHistory ? "text-violet-700 bg-violet-50" : "text-slate-500 hover:text-violet-700 hover:bg-violet-50"}`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
          <button
            onClick={() => { handleNewChat(); setShowHistory(false) }}
            title="Start new chat"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="flex-1 min-h-0">
          <CopilotHistoryScreen
            onOpen={(id) => { loadThread(id); setShowHistory(false) }}
            onBack={() => setShowHistory(false)}
          />
        </div>
      )}

      {!showHistory && (<>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
        {historyLoading && (
          <div className="flex items-center justify-center py-8 text-[12px] text-slate-400">Loading conversation…</div>
        )}
        {!historyLoading && messages.map((msg) => (
          <CopilotMessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            card={msg.card}
            approval={msg.approval}
            agentPlan={msg.agentPlan}
            navTarget={msg.navTarget}
            onNavigate={(route) => router.push(route)}
            streaming={streaming && msg.id === streamingId}
            quickActions={msg.quickActions}
            onQuickAction={handleQuickAction}
          />
        ))}
        {/* Welcome state: surface instant, connected actions so it's never empty. */}
        {!historyLoading && messages.length === 1 && messages[0].id === "welcome" && (
          <CopilotQuickActions />
        )}
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
              className="h-full bg-[var(--brand)] rounded-full transition-all"
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
      </>)}
    </div>
  )
}
