"use client"

import Link from "next/link"
import {
  MessageSquare, ArrowUpRight, Loader2, Inbox, ExternalLink,
} from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { MobileTopBar } from "@/components/mobile"
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
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function PreviewRow({ conv }: { conv: ConversationWithContact }) {
  const name = conv.contact?.full_name ?? conv.subject ?? "Conversation"
  return (
    <Link
      href={`/app/messages/conversations/${conv.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group"
    >
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarBg(name))}>
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#2563EB] transition-colors">{name}</p>
        {conv.subject && <p className="text-xs text-slate-500 truncate">{conv.subject}</p>}
      </div>
      <span className="text-[10px] text-slate-400 shrink-0">{fmtTime(conv.last_message_at)}</span>
      {conv.unread_count > 0 && (
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {conv.unread_count}
        </span>
      )}
      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#2563EB] shrink-0" />
    </Link>
  )
}

/**
 * Messages has moved to its own top-level section at /app/messages.
 * This page is now a contextual preview that deep-links into the Inbox so the
 * Contacts tab bar keeps a familiar entry point without duplicating the full UI.
 */
export default function ContactsMessagesPreviewPage() {
  const { workspace } = useWorkspace()
  const { data: conversations = [], isLoading } = useConversations(workspace?.id)
  const recent = conversations.slice(0, 6)

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Messages"
        subtitle="Contacts inbox"
        primaryAction={{ label: "Open Messages", icon: Inbox, href: "/app/messages" }}
      />
      <div className="md:hidden -mx-4">
        <ContactsTabNav />
      </div>
      <div className="hidden md:block">
        <ContactsTabNav />
      </div>

      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-8 space-y-6">
        {/* Header */}
        <div className="hidden md:flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Contacts</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
            <p className="text-sm text-slate-500 mt-0.5">The full inbox now lives in its own section</p>
          </div>
          <Link
            href="/app/messages"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Inbox className="w-4 h-4" />
            Open Messages
          </Link>
        </div>

        {/* Moved banner */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Messages moved to its own section</p>
            <p className="text-sm text-slate-600 mt-0.5">
              All conversations now live under <span className="font-medium">Messages</span> in the main navigation, with
              the same live data shown here. This stays as a quick shortcut from Contacts.
            </p>
            <Link href="/app/messages" className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
              Go to Messages <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent conversations preview */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Recent conversations</h2>
            <Link href="/app/messages" className="text-xs text-[#2563EB] hover:underline font-medium">View all</Link>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No conversations yet</p>
              <p className="text-xs text-slate-400 mt-1">Messages with your contacts will appear here.</p>
            </div>
          ) : (
            recent.map((conv) => <PreviewRow key={conv.id} conv={conv} />)
          )}
        </div>
      </div>
    </DashboardContainer>
  )
}
