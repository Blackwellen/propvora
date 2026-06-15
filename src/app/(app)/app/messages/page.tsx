"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search, X, MessageSquare, Users, Loader2, AlertTriangle,
  RefreshCw, Inbox, ArrowUpRight,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { useConversations, type ConversationWithContact } from "@/hooks/useMessages"

/* ── Avatar helpers ─────────────────────────────────────────────────────── */
const AVATAR_BG = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
]
function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
function fmtTime(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return d.toLocaleDateString("en-GB", { weekday: "short" })
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

const TYPE_BADGE: Record<string, string> = {
  tenant: "bg-emerald-100 text-emerald-700",
  landlord: "bg-blue-100 text-blue-700",
  supplier: "bg-amber-100 text-amber-700",
  applicant: "bg-sky-100 text-sky-700",
  agent: "bg-violet-100 text-violet-700",
  other: "bg-slate-100 text-slate-600",
}

type ConvFilter = "all" | "unread"

/* ── KPI card ────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon, bg, alert }: {
  label: string; value: number; icon: React.ReactNode; bg: string; alert?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      {alert && <p className="text-[10px] font-medium text-amber-600 mt-0.5">{alert}</p>}
    </div>
  )
}

/* ── Conversation row ────────────────────────────────────────────────────── */
function ConvRow({ conv }: { conv: ConversationWithContact }) {
  const name = conv.contact?.full_name ?? conv.subject ?? "Conversation"
  const type = conv.contact?.contact_type ?? "other"
  return (
    <Link
      href={`/app/messages/conversations/${conv.id}`}
      className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group"
    >
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarBg(name))}>
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#2563EB] transition-colors">{name}</p>
          <span className="text-[10px] text-slate-400 shrink-0">{fmtTime(conv.last_message_at)}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium", TYPE_BADGE[type] ?? TYPE_BADGE.other)}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          {conv.subject && <span className="text-xs text-slate-500 truncate">{conv.subject}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-center">
        {conv.unread_count > 0 && (
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
            {conv.unread_count}
          </span>
        )}
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#2563EB]" />
      </div>
    </Link>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function MessagesInboxPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: conversations = [], isLoading, error, refetch } = useConversations(workspace?.id)

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ConvFilter>("all")

  const totalUnread = useMemo(
    () => conversations.reduce((acc, c) => acc + (c.unread_count ?? 0), 0),
    [conversations]
  )

  const filtered = useMemo(() => {
    let data = [...conversations]
    if (filter === "unread") data = data.filter((c) => (c.unread_count ?? 0) > 0)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(
        (c) =>
          (c.contact?.full_name ?? "").toLowerCase().includes(q) ||
          (c.subject ?? "").toLowerCase().includes(q)
      )
    }
    return data
  }, [conversations, filter, search])

  return (
    <DashboardContainer>
      <div className="space-y-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Messages</h1>
            <p className="mt-1 text-sm text-slate-500">Your inbox — all contact conversations in one place</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <ActionMenu
              items={[
                { label: "View Contacts", icon: Users, onClick: () => router.push("/app/contacts/people") },
                { label: "Refresh Inbox", icon: RefreshCw, onClick: () => { refetch() } },
              ]}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">Failed to load messages</p>
              <p className="text-xs text-red-500 mt-1">{error.message}</p>
            </div>
          )}

          {/* KPIs */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 h-24 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <KpiCard label="Conversations" value={conversations.length} icon={<MessageSquare className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" />
              <KpiCard label="Unread" value={totalUnread} alert={totalUnread > 0 ? "Action needed" : undefined} icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} bg="bg-amber-50" />
              <KpiCard label="Contacts in Threads" value={new Set(conversations.map((c) => c.contact?.id).filter(Boolean)).size} icon={<Users className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50" />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
              {([["all", "All"], ["unread", "Unread"]] as [ConvFilter, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    filter === key ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto relative min-w-[200px] max-w-xs w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                aria-label="Search conversations"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-8 rounded-lg text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Inbox className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-base font-semibold text-slate-500">No messages yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Conversations with your contacts will appear here.
                </p>
                <Link href="/app/contacts/people" className="mt-3 inline-flex text-sm text-[#2563EB] hover:underline">
                  Browse contacts →
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-400">No conversations match your filters</p>
                <button onClick={() => { setSearch(""); setFilter("all") }} className="mt-2 text-xs text-[#2563EB] hover:underline">Clear filters</button>
              </div>
            ) : (
              filtered.map((conv) => <ConvRow key={conv.id} conv={conv} />)
            )}
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}
