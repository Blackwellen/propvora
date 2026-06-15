"use client"

import { useEffect, useRef, useState, useId } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { resolveEntityHref } from "@/lib/notifications/routes"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string
  resource_type: string | null
  resource_id: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

/** Prefers the stamped href column, falling back to the shared route resolver. */
function rowHref(n: NotificationRow): string | null {
  return n.href ?? resolveEntityHref(n.resource_type, n.resource_id)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const TYPE_ICON: Record<string, string> = {
  message:    "✉",
  task:       "✓",
  compliance: "⚠",
  payment:    "£",
  ai:         "✦",
  info:       "ℹ",
}

/** Resolves an icon from a free-form `kind` ("task.assigned", "invoice.paid", …). */
function iconForKind(kind: string): string {
  const prefix = (kind ?? "").split(".")[0]
  switch (prefix) {
    case "task":       return TYPE_ICON.task
    case "compliance": return TYPE_ICON.compliance
    case "message":    return TYPE_ICON.message
    case "invoice":
    case "bill":
    case "rent":       return TYPE_ICON.payment
    case "job":        return "🛠"
    case "tenancy":    return "🏠"
    case "ai":         return TYPE_ICON.ai
    default:           return TYPE_ICON[kind] ?? TYPE_ICON.info
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const router = useRouter()
  const dropdownId = useId()
  const [open, setOpen]                     = useState(false)
  const [unreadCount, setUnreadCount]       = useState(0)
  const [notifications, setNotifications]  = useState<NotificationRow[]>([])
  const [loading, setLoading]              = useState(false)
  const [marking, setMarking]              = useState(false)
  const dropdownRef                         = useRef<HTMLDivElement>(null)
  const buttonRef                           = useRef<HTMLButtonElement>(null)
  const channelRef                          = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)
  const [pos, setPos]                       = useState({ top: 0, right: 0 })

  // ── Fetch unread count on mount ──────────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null)

        setUnreadCount(count ?? 0)

        // ── Realtime subscription ──────────────────────────────────────────────
        const channel = supabase
          .channel(`notifications:user:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              // Realtime delivers raw DB columns (kind/entity_type/entity_id);
              // normalise to the aliased shape the UI renders.
              const raw = payload.new as Record<string, unknown>
              const newRow: NotificationRow = {
                id: String(raw.id),
                type: String(raw.kind ?? "info"),
                title: String(raw.title ?? ""),
                body: String(raw.body ?? ""),
                resource_type: (raw.entity_type as string | null) ?? null,
                resource_id: (raw.entity_id as string | null) ?? null,
                href: (raw.href as string | null) ?? null,
                read_at: (raw.read_at as string | null) ?? null,
                created_at: String(raw.created_at ?? new Date().toISOString()),
              }
              setUnreadCount((prev) => prev + 1)
              setNotifications((prev) => [newRow, ...prev].slice(0, 8))
            }
          )
          .subscribe()

        channelRef.current = channel
      } catch {
        // silently ignore — bell just shows no count
      }
    })()

    return () => {
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open])

  // ── Load recent notifications when dropdown opens (no auto-mark) ────────────
  async function handleOpen() {
    const next = !open
    if (next && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    setOpen(next)
    if (!next) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch 8 most recent (read + unread, newest first)
      const { data } = await supabase
        .from("notifications")
        .select("id, type:kind, title, body, resource_type:entity_type, resource_id:entity_id, href, read_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8)

      setNotifications((data as NotificationRow[]) ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // ── Mark every notification read ────────────────────────────────────────────
  async function markAllRead() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMarking(true)
      const now = new Date().toISOString()
      await supabase
        .from("notifications")
        .update({ read_at: now })
        .eq("user_id", user.id)
        .is("read_at", null)
      setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
      setUnreadCount(0)
    } catch {
      // ignore
    } finally {
      setMarking(false)
    }
  }

  // ── Click a notification: mark it read + route to its source record ─────────
  async function handleClick(n: NotificationRow) {
    if (!n.read_at) {
      try {
        const supabase = createClient()
        await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", n.id)
        setUnreadCount((c) => Math.max(0, c - 1))
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
        )
      } catch { /* non-fatal */ }
    }
    const href = rowHref(n)
    setOpen(false)
    if (href) router.push(href)
  }

  return (
    <>
      {/* ── Bell button ─────────────────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={dropdownId}
        className="relative w-[44px] h-[44px] rounded-2xl bg-white border border-[#E2EAF6] flex items-center justify-center hover:bg-[#F0F7FF] hover:border-[#B9D2F3] transition-all shadow-sm"
      >
        <Bell className="w-5 h-5 text-[#071B4D]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown (portaled to body so the header's backdrop-filter stacking
            context can't trap it under the page content) ───────────────────── */}
      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          id={dropdownId}
          role="dialog"
          aria-label="Notifications"
          style={{
            position: "fixed",
            top: pos.top,
            right: pos.right,
            zIndex: 9999,
            width: "min(340px, calc(100vw - 16px))",
            maxWidth: "calc(100vw - 16px)",
          }}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-900">Notifications</p>
            {marking ? (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
            ) : unreadCount > 0 ? (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <CheckCheck className="w-3.5 h-3.5" />
                All read
              </span>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[min(60vh,360px)] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                <Bell className="w-8 h-8 text-slate-200 mb-3" />
                <p className="text-[13px] font-medium text-slate-400">You&apos;re all caught up</p>
                <p className="text-[11px] text-slate-300 mt-1">No unread notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors",
                    !n.read_at && "bg-blue-50/40",
                    rowHref(n) ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                    {iconForKind(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 leading-snug truncate">
                      {n.title}
                    </p>
                    <p className="text-[11.5px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                  {!n.read_at && (
                    <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <a
              href="/app/account/notifications"
              className="text-[11.5px] text-blue-600 hover:underline font-medium"
            >
              View all notifications →
            </a>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
