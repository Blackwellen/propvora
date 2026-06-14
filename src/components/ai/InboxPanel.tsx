"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Plus,
  ArrowLeft,
  Paperclip,
  Send,
  Sparkles,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

/* ------------------------------------------------------------------ */
/* Exported types — used by ContactPicker and ConversationView         */
/* ------------------------------------------------------------------ */
export interface MockContact {
  id: string
  name: string
  type: "tenant" | "landlord" | "supplier" | "agent" | "applicant" | "professional" | "other"
}

export interface MockMessage {
  id: string
  role: "user" | "contact" | "ai"
  content: string
  time?: string
  timestamp: Date
  read: boolean
}

export interface MockConversation {
  id: string
  name: string
  role: string
  initials: string
  roleColour: string
  snippet: string
  time: string
  unread: number
  property: string
  contact: MockContact
  messages: MockMessage[]
  linkedRecord?: { type: string; id: string; label: string; href: string }
}

/* ------------------------------------------------------------------ */
/* Internal types                                                       */
/* ------------------------------------------------------------------ */
interface ConversationItem {
  id: string
  name: string
  role: string
  initials: string
  roleColour: string
  snippet: string
  time: string
  unread: number
  property: string
}

interface Message {
  id: string
  role: "user" | "contact"
  content: string
  time: string
}

const ROLE_COLOURS: Record<string, string> = {
  tenant: "#059669",
  landlord: "#2563EB",
  supplier: "#D97706",
  agent: "#7C3AED",
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function relativeShort(iso: string | null): string {
  if (!iso) return ""
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

const FILTER_PILLS = ["All", "Unread", "Tenants", "Suppliers", "Landlords"] as const
type FilterPill = (typeof FILTER_PILLS)[number]

/* ------------------------------------------------------------------ */
/* InboxPanel                                                           */
/* ------------------------------------------------------------------ */
export default function InboxPanel() {
  const { workspace } = useWorkspace()
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterPill>("All")

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState(false)

  const [threadMessages, setThreadMessages] = useState<Message[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)

  /* ---------------------------------------------------------------- */
  /* Load real, workspace-scoped threads                               */
  /* ---------------------------------------------------------------- */
  const loadThreads = useCallback(async () => {
    if (!workspace?.id) return
    setLoadingList(true)
    setListError(false)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("message_threads")
        .select("id, title, type, updated_at")
        .eq("workspace_id", workspace.id)
        .eq("archived", false)
        .order("updated_at", { ascending: false })
        .limit(50)
      if (error) { setListError(true); setConversations([]); return }
      const role = (t: string | null) =>
        (t ?? "").charAt(0).toUpperCase() + (t ?? "").slice(1)
      setConversations(
        (data ?? []).map((t) => {
          const name = (t.title as string) || "Conversation"
          return {
            id: t.id as string,
            name,
            role: role(t.type as string | null) || "Thread",
            initials: initialsOf(name),
            roleColour: ROLE_COLOURS[(t.type as string) ?? ""] ?? "#64748B",
            snippet: "",
            time: relativeShort(t.updated_at as string | null),
            unread: 0,
            property: "",
          }
        })
      )
    } catch {
      setListError(true)
      setConversations([])
    } finally {
      setLoadingList(false)
    }
  }, [workspace?.id])

  useEffect(() => { loadThreads() }, [loadThreads])

  /* ---------------------------------------------------------------- */
  /* Load messages for the selected thread                             */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!selectedConv || !workspace?.id) return
    let cancelled = false
    setLoadingThread(true)
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
          .from("messages")
          .select("id, sender_id, content, created_at")
          .eq("thread_id", selectedConv)
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: true })
          .limit(200)
        if (cancelled) return
        if (error) { setThreadMessages([]); return }
        setThreadMessages(
          (data ?? []).map((m) => ({
            id: m.id as string,
            role: user && m.sender_id === user.id ? "user" : "contact",
            content: (m.content as string) ?? "",
            time: relativeShort(m.created_at as string | null),
          }))
        )
      } catch {
        if (!cancelled) setThreadMessages([])
      } finally {
        if (!cancelled) setLoadingThread(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedConv, workspace?.id])

  /* ---------------------------------------------------------------- */
  /* Derived state                                                     */
  /* ---------------------------------------------------------------- */
  const conv = selectedConv
    ? conversations.find((c) => c.id === selectedConv) ?? null
    : null

  const messages: Message[] = threadMessages

  const filteredConvs = conversations.filter((c) => {
    const matchesSearch =
      !search || c.name.toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Unread" && c.unread > 0) ||
      (activeFilter === "Tenants" && c.role === "Tenant") ||
      (activeFilter === "Suppliers" && c.role === "Supplier") ||
      (activeFilter === "Landlords" && c.role === "Landlord")

    return matchesSearch && matchesFilter
  })

  /* ---------------------------------------------------------------- */
  /* Handlers — send a real message into the selected thread           */
  /* ---------------------------------------------------------------- */
  async function handleSendMessage() {
    const body = input.trim()
    if (!body || !selectedConv || !workspace?.id || sending) return
    setSending(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const senderName =
        (user?.user_metadata?.full_name as string | undefined) ||
        (user?.email as string | undefined) ||
        "You"
      const { data, error } = await supabase
        .from("messages")
        .insert({
          thread_id: selectedConv,
          workspace_id: workspace.id,
          sender_id: user?.id ?? null,
          sender_name: senderName,
          content: body,
        })
        .select("id, created_at")
        .single()
      if (!error && data) {
        setThreadMessages((prev) => [
          ...prev,
          {
            id: data.id as string,
            role: "user",
            content: body,
            time: relativeShort(data.created_at as string | null),
          },
        ])
        setInput("")
      }
    } catch {
      /* non-fatal — message simply not sent */
    } finally {
      setSending(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /* Thread view                                                       */
  /* ---------------------------------------------------------------- */
  if (conv) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Thread header */}
        <div className="flex items-center gap-2.5 px-3 py-3 border-b border-slate-100 shrink-0">
          <button
            onClick={() => setSelectedConv(null)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
            style={{ backgroundColor: conv.roleColour }}
          >
            {conv.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate">
              {conv.name}
            </p>
            <p className="text-[10px] text-slate-400">
              {conv.role} · {conv.property}
            </p>
          </div>
          <button
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="AI draft reply"
          >
            <div style={{ color: "#7c3aed" }}>
              <Sparkles className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {loadingThread ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[12px] text-slate-400">No messages yet. Send the first one.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-[#2563EB] text-white rounded-br-sm"
                      : "bg-slate-50 border border-slate-100 text-slate-800 rounded-bl-sm"
                  )}
                >
                  {msg.content}
                  <span className="block text-[10px] mt-0.5 opacity-60 text-right">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-[#2563EB] transition-all">
            <button className="text-slate-400 hover:text-slate-600 transition-colors pb-0.5">
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Write a message..."
              className="flex-1 bg-transparent text-[12.5px] text-slate-800 placeholder:text-slate-400 resize-none outline-none min-h-[20px] max-h-[80px]"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || sending}
              className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#1d4ed8] transition-all shrink-0"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Conversation list view                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search + New button */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-[12.5px] bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
            />
          </div>
          <button className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold transition-colors shrink-0">
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {FILTER_PILLS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors font-medium shrink-0",
                activeFilter === f
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {loadingList ? (
          <div className="flex items-center justify-center h-full py-12">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : listError ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-2 py-12">
            <p className="text-[13px] font-medium text-slate-600">Couldn&apos;t load conversations</p>
            <p className="text-[11px] text-slate-400">Please try again in a moment.</p>
          </div>
        ) : filteredConvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-2 py-12">
            <p className="text-[13px] font-medium text-slate-600">
              {search || activeFilter !== "All" ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="text-[11px] text-slate-400">
              {search || activeFilter !== "All"
                ? "Try a different search or filter."
                : "Messages with tenants, suppliers and contacts will appear here."}
            </p>
          </div>
        ) : (
          filteredConvs.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConv(c.id)}
              className="w-full text-left flex items-start gap-3 px-3 py-3 hover:bg-slate-50 transition-colors"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                  style={{ backgroundColor: c.roleColour }}
                >
                  {c.initials}
                </div>
                {c.unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    {c.unread}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[12.5px] font-semibold text-slate-800 truncate">
                      {c.name}
                    </span>
                    <span
                      className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full text-white shrink-0"
                      style={{ backgroundColor: c.roleColour + "CC" }}
                    >
                      {c.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{c.time}</span>
                </div>
                <p className="text-[11.5px] text-slate-400 truncate">{c.snippet}</p>
                <p className="text-[10px] text-slate-300 mt-0.5">{c.property}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
