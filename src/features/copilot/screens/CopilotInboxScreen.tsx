"use client"

import { useState, useCallback } from "react"
import { Search, ChevronDown, SlidersHorizontal, Loader2 } from "lucide-react"
import InboxConversationRow from "../components/InboxConversationRow"
import { useWorkspace } from "@/providers/AuthProvider"
import { useConversations } from "@/hooks/useMessages"
import type { ConversationContact } from "../types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7)   return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

const STATUS_PILLS = ["All", "Unread", "Open"]

const ENTITY_TABS = [
  { label: "All" },
  { label: "Tenants" },
  { label: "Landlords" },
  { label: "Suppliers" },
]

type ContactType = ConversationContact["type"]

function typeFromContactType(ct: string): ContactType {
  if (ct === "tenant") return "tenant"
  if (ct === "landlord") return "landlord"
  if (ct === "supplier") return "supplier"
  return "team"
}

interface CopilotInboxScreenProps {
  onOpenConversation: (id: string) => void
  onNewConversation: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CopilotInboxScreen({
  onOpenConversation,
  onNewConversation,
}: CopilotInboxScreenProps) {
  const { workspace } = useWorkspace()
  const { data: threads = [], isLoading } = useConversations(workspace?.id)

  const [search, setSearch]             = useState("")
  const [activeEntity, setActiveEntity] = useState("All")
  const [activeStatus, setActiveStatus] = useState("All")

  // Map live threads → ConversationContact for the inbox row renderer
  const conversations: ConversationContact[] = threads.map((t) => {
    const name = t.contact?.full_name ?? t.subject ?? "Conversation"
    const type = typeFromContactType(t.contact?.contact_type ?? "other")
    return {
      id: t.id,
      name,
      role: t.contact?.contact_type
        ? t.contact.contact_type.charAt(0).toUpperCase() + t.contact.contact_type.slice(1)
        : "Contact",
      type,
      lastMessage: t.subject ?? "",
      lastMessageTime: t.last_message_at ? fmtTime(t.last_message_at) : "",
      priority: "Medium" as const,
      status: "Open" as const,
      unread: t.unread_count ?? 0,
      isUnread: (t.unread_count ?? 0) > 0,
    }
  })

  const filtered = conversations.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      activeStatus === "All" ||
      (activeStatus === "Unread" && c.isUnread) ||
      c.status === activeStatus
    const matchEntity =
      activeEntity === "All" ||
      (activeEntity === "Tenants" && c.type === "tenant") ||
      (activeEntity === "Landlords" && c.type === "landlord") ||
      (activeEntity === "Suppliers" && c.type === "supplier")
    return matchSearch && matchStatus && matchEntity
  })

  const totalUnread  = conversations.filter((c) => c.isUnread).length

  const PILLS_WITH_COUNTS = [
    { label: "All",    count: conversations.length },
    { label: "Unread", count: totalUnread },
    { label: "Open",   count: conversations.filter((c) => c.status === "Open").length },
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
          + New
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-b border-slate-100">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[var(--color-brand-300)] focus:bg-white transition-all placeholder-slate-400"
          />
        </div>
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

      {/* Status pills */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-1">
          {PILLS_WITH_COUNTS.map((pill) => (
            <button
              key={pill.label}
              onClick={() => setActiveStatus(pill.label)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                activeStatus === pill.label
                  ? "bg-[var(--brand)] text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {pill.label}
              <span className={`${activeStatus === pill.label ? "text-[var(--color-brand-100)]" : "text-slate-400"}`}>
                {isLoading ? "…" : pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <p className="text-[13px] font-medium">
              {conversations.length === 0 ? "No conversations yet" : "No conversations match"}
            </p>
            <p className="text-[11px] mt-1">
              {conversations.length === 0
                ? "Start a new conversation or message a contact"
                : "Try adjusting your filters"}
            </p>
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

      {/* Count */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 shrink-0">
        <p className="text-[11px] text-slate-400">
          {isLoading ? "Loading…" : `Showing ${filtered.length} of ${conversations.length} conversations`}
        </p>
      </div>
    </div>
  )
}
