"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  ArrowLeft,
  Paperclip,
  Send,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

/* ------------------------------------------------------------------ */
/* Mock data                                                            */
/* ------------------------------------------------------------------ */
const MOCK_CONVERSATIONS: ConversationItem[] = [
  {
    id: "c1",
    name: "Sarah Mitchell",
    role: "Tenant",
    initials: "SM",
    roleColour: "#059669",
    snippet: "The hot water is still not great...",
    time: "12m",
    unread: 2,
    property: "22 Park Lane",
  },
  {
    id: "c2",
    name: "Robert Patel",
    role: "Landlord",
    initials: "RP",
    roleColour: "#2563EB",
    snippet: "Based on the current rent of £2,400...",
    time: "2h",
    unread: 0,
    property: "14 Westbourne",
  },
  {
    id: "c3",
    name: "Apex Plumbing Ltd",
    role: "Supplier",
    initials: "AP",
    roleColour: "#D97706",
    snippet: "Yes, we can do Thursday 9am–12pm...",
    time: "20h",
    unread: 1,
    property: "8 Clarence Rd",
  },
  {
    id: "c4",
    name: "James Okafor",
    role: "Tenant",
    initials: "JO",
    roleColour: "#059669",
    snippet: "Thank you for the renewal confirmation...",
    time: "2d",
    unread: 0,
    property: "5 Tower St",
  },
  {
    id: "c5",
    name: "FastFix Ltd",
    role: "Supplier",
    initials: "FF",
    roleColour: "#D97706",
    snippet: "Our engineer can attend on Monday...",
    time: "3d",
    unread: 0,
    property: "Multiple",
  },
]

const MOCK_MESSAGES: Record<string, Message[]> = {
  c1: [
    {
      id: "m1",
      role: "contact",
      content: "Hi, the hot water has been intermittent for the past week.",
      time: "10:15",
    },
    {
      id: "m2",
      role: "user",
      content:
        "Hi Sarah, thanks for letting me know. I'll arrange a plumber to look at it this week.",
      time: "10:30",
    },
    {
      id: "m3",
      role: "contact",
      content:
        "The hot water is still not great, the pressure is really low in the mornings.",
      time: "11:20",
    },
  ],
  c3: [
    {
      id: "m1",
      role: "user",
      content: "Hi, can you attend 8 Clarence Rd to fix the boiler this week?",
      time: "Yesterday",
    },
    {
      id: "m2",
      role: "contact",
      content: "Yes, we can do Thursday 9am–12pm. Our engineer will attend.",
      time: "Yesterday",
    },
  ],
}

const FILTER_PILLS = ["All", "Unread", "Tenants", "Suppliers", "Landlords"] as const
type FilterPill = (typeof FILTER_PILLS)[number]

/* ------------------------------------------------------------------ */
/* InboxPanel                                                           */
/* ------------------------------------------------------------------ */
export default function InboxPanel() {
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterPill>("All")
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES)

  /* ---------------------------------------------------------------- */
  /* Derived state                                                     */
  /* ---------------------------------------------------------------- */
  const conv = selectedConv
    ? MOCK_CONVERSATIONS.find((c) => c.id === selectedConv) ?? null
    : null

  const messages: Message[] = selectedConv ? (localMessages[selectedConv] ?? []) : []

  const filteredConvs = MOCK_CONVERSATIONS.filter((c) => {
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
  /* Handlers                                                          */
  /* ---------------------------------------------------------------- */
  function handleSendMessage() {
    if (!input.trim() || !selectedConv) return

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setLocalMessages((prev) => ({
      ...prev,
      [selectedConv]: [...(prev[selectedConv] ?? []), newMsg],
    }))
    setInput("")
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
          {messages.length === 0 ? (
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
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#1d4ed8] transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
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
        {filteredConvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-2 py-12">
            <p className="text-[13px] font-medium text-slate-600">No conversations found</p>
            <p className="text-[11px] text-slate-400">Try a different search or filter.</p>
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
