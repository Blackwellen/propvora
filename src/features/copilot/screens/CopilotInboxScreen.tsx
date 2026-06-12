"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, ChevronDown, SlidersHorizontal, ArrowUpDown, Loader2 } from "lucide-react"
import type { ConversationContact } from "../types"
import InboxConversationRow from "../components/InboxConversationRow"
import { createClient } from "@/lib/supabase/client"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7)   return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

/** Map a DB row → ConversationContact for the inbox row renderer */
function rowToContact(row: {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  body: string
  read_at: string | null
  created_at: string
  sender: { id: string; full_name: string | null; email: string } | null
  recipient: { id: string; full_name: string | null; email: string } | null
  unreadCount: number
  isLatestReceived: boolean
}, currentUserId: string): ConversationContact {
  const isSender = row.sender_id === currentUserId
  const other = isSender
    ? (Array.isArray(row.recipient) ? row.recipient[0] : row.recipient)
    : (Array.isArray(row.sender)    ? row.sender[0]    : row.sender)

  const name = other?.full_name ?? other?.email ?? "Unknown"

  return {
    id: `${row.sender_id}__${row.subject}`,
    name,
    role: "Contact",
    type: "tenant",  // default; no contact_type on messages table
    lastMessage: row.body,
    lastMessageTime: fmtTime(row.created_at),
    priority: "Medium",
    status: "Open",
    unread: row.unreadCount,
    isUnread: row.unreadCount > 0,
  }
}

const STATUS_PILLS = ["All", "Unread", "Open", "Waiting", "Closed"]

const ENTITY_TABS = [
  { label: "All",      count: null },
  { label: "Tenants",  count: null },
  { label: "Landlords",count: null },
  { label: "Suppliers",count: null },
  { label: "Team",     count: null },
]

interface CopilotInboxScreenProps {
  onOpenConversation: (id: string) => void
  onNewConversation: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CopilotInboxScreen({
  onOpenConversation,
  onNewConversation,
}: CopilotInboxScreenProps) {
  const [search, setSearch]               = useState("")
  const [activeEntity, setActiveEntity]   = useState("All")
  const [activeStatus, setActiveStatus]   = useState("All")
  const [conversations, setConversations] = useState<ConversationContact[]>([])
  const [loading, setLoading]             = useState(true)
  const channelRef                         = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  // ── Load threads from messages table ──────────────────────────────────────
  const loadInbox = useCallback(async (uid: string) => {
    try {
      const supabase = createClient()

      // Get the 50 most recent messages the user is a party to
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id, sender_id, recipient_id, subject, body, read_at, created_at,
          sender:profiles!messages_sender_id_fkey(id, full_name, email),
          recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
        `)
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      const rows = (data ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        sender:    Array.isArray(r.sender)    ? r.sender[0]    : r.sender,
        recipient: Array.isArray(r.recipient) ? r.recipient[0] : r.recipient,
      }))

      // Group by subject + other user → keep latest per thread
      type Thread = {
        id: string
        sender_id: string
        recipient_id: string
        subject: string
        body: string
        read_at: string | null
        created_at: string
        sender: { id: string; full_name: string | null; email: string } | null
        recipient: { id: string; full_name: string | null; email: string } | null
        unreadCount: number
        isLatestReceived: boolean
      }

      const threadMap = new Map<string, Thread>()

      for (const row of rows as Thread[]) {
        const isSender  = row.sender_id === uid
        const otherId   = isSender ? row.recipient_id : row.sender_id
        const key       = `${otherId}__${row.subject}`

        const existing = threadMap.get(key)
        if (!existing) {
          threadMap.set(key, {
            ...row,
            unreadCount:      !isSender && !row.read_at ? 1 : 0,
            isLatestReceived: !isSender,
          })
        } else {
          if (!isSender && !row.read_at) existing.unreadCount++
        }
      }

      const result: ConversationContact[] = Array.from(threadMap.values()).map(
        (t) => rowToContact(t, uid)
      )

      setConversations(result)
    } catch {
      // Table may not yet exist — show empty state
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await loadInbox(user.id)

        // Realtime subscription
        const channel = supabase
          .channel("copilot-inbox")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `recipient_id=eq.${user.id}`,
            },
            async () => { await loadInbox(user.id) }
          )
          .subscribe()

        channelRef.current = channel
      } catch {
        setLoading(false)
      }
    })()

    return () => {
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [loadInbox])

  const filtered = conversations.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      activeStatus === "All" ||
      (activeStatus === "Unread" && c.isUnread) ||
      c.status === activeStatus
    return matchSearch && matchStatus
  })

  const totalUnread  = conversations.filter((c) => c.isUnread).length
  const totalOpen    = conversations.filter((c) => c.status === "Open").length
  const totalWaiting = conversations.filter((c) => c.status === "Waiting").length
  const totalClosed  = conversations.filter((c) => c.status === "Closed").length

  const PILLS_WITH_COUNTS = [
    { label: "All",     count: conversations.length },
    { label: "Unread",  count: totalUnread },
    { label: "Open",    count: totalOpen },
    { label: "Waiting", count: totalWaiting },
    { label: "Closed",  count: totalClosed },
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-slate-100">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Inbox</h2>
          <p className="text-[11px] text-slate-400">All your conversations in one place</p>
        </div>
        <button
          onClick={onNewConversation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-[11px] font-semibold hover:bg-violet-700 transition-colors"
        >
          + New conversation
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-b border-slate-100">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations, people, companies..."
            className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-300 focus:bg-white transition-all placeholder-slate-400"
          />
        </div>
        <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-0.5" />
          All statuses
          <ChevronDown className="w-3 h-3" />
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shrink-0">
          All priorities
          <ChevronDown className="w-3 h-3" />
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shrink-0">
          <SlidersHorizontal className="w-3 h-3" />
          More
        </button>
      </div>

      {/* Entity tabs */}
      <div className="flex items-center gap-0.5 px-3 py-2 shrink-0 border-b border-slate-100 overflow-x-auto">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveEntity(tab.label)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
              activeEntity === tab.label
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status pills + sort */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-1">
          {PILLS_WITH_COUNTS.map((pill) => (
            <button
              key={pill.label}
              onClick={() => setActiveStatus(pill.label)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                activeStatus === pill.label
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {pill.label}
              <span className={`${activeStatus === pill.label ? "text-blue-200" : "text-slate-400"}`}>
                {loading ? "…" : pill.count}
              </span>
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowUpDown className="w-3 h-3" />
          Latest activity
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <p className="text-[13px] font-medium">No conversations found</p>
            <p className="text-[11px] mt-1">Try adjusting your filters or start a new conversation</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <InboxConversationRow
              key={conv.id}
              conversation={conv}
              onOpen={onOpenConversation}
            />
          ))
        )}
      </div>

      {/* Pagination / count */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 shrink-0">
        <p className="text-[11px] text-slate-400">
          {loading ? "Loading…" : `Showing ${filtered.length} of ${conversations.length} conversations`}
        </p>
      </div>
    </div>
  )
}
