"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  CheckSquare,
  PoundSterling,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  CheckCheck,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type NotifType = "task" | "payment" | "message" | "ai" | "alert"

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  timestamp: Date
  read: boolean
  href?: string
}

/* ------------------------------------------------------------------ */
/* Mock notifications                                                   */
/* ------------------------------------------------------------------ */
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "alert",
    title: "Gas safety certificate expiring",
    body: "14 Elm Street — certificate expires in 7 days. Book a renewal.",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    read: false,
    href: "/app/portfolio/properties/1",
  },
  {
    id: "n2",
    type: "payment",
    title: "Rent received",
    body: "Sarah Mitchell paid £1,200 rent for July. Flat 2A, Manchester.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    href: "/app/money/income",
  },
  {
    id: "n3",
    type: "message",
    title: "New message from Apex Plumbing",
    body: "Engineer confirmed for Thursday 9am. Job ref AX-4471.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    read: false,
    href: "/app",
  },
  {
    id: "n4",
    type: "ai",
    title: "AI action completed",
    body: "Portfolio summary is ready. 8 properties, 94% occupancy.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: true,
    href: "/app",
  },
  {
    id: "n5",
    type: "task",
    title: "Task overdue",
    body: "Annual boiler inspection at 22 Victoria Road — 3 days overdue.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    href: "/app/work/tasks",
  },
  {
    id: "n6",
    type: "alert",
    title: "Arrears alert",
    body: "David Chen is £400 in arrears (7 days overdue). Consider chasing.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36),
    read: true,
    href: "/app/money/arrears",
  },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const NOTIF_ICONS: Record<NotifType, { icon: React.ElementType; bgCls: string; iconCls: string }> = {
  task: { icon: CheckSquare, bgCls: "bg-blue-50", iconCls: "text-[#2563EB]" },
  payment: { icon: PoundSterling, bgCls: "bg-emerald-50", iconCls: "text-[#059669]" },
  message: { icon: MessageSquare, bgCls: "bg-slate-100", iconCls: "text-slate-600" },
  ai: { icon: Sparkles, bgCls: "bg-[#F5F3FF]", iconCls: "text-[#7C3AED]" },
  alert: { icon: AlertTriangle, bgCls: "bg-amber-50", iconCls: "text-amber-600" },
}

/* ------------------------------------------------------------------ */
/* NotificationsBell                                                    */
/* ------------------------------------------------------------------ */
export default function NotificationsBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
  const popoverRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  function handleNotifClick(notif: Notification) {
    markRead(notif.id)
    setOpen(false)
    if (notif.href) router.push(notif.href)
  }

  return (
    <div ref={popoverRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          open
            ? "bg-slate-100 text-slate-700"
            : "hover:bg-slate-100 text-slate-500"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute top-1 right-1",
              "min-w-[16px] h-4 px-0.5 rounded-full",
              "bg-[#EF4444] text-white text-[9px] font-bold",
              "flex items-center justify-center",
              "border border-white"
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-80 z-50",
            "bg-white rounded-2xl shadow-2xl",
            "border border-slate-200",
            "overflow-hidden flex flex-col max-h-[480px]",
            "animate-[slideUp_150ms_ease-out]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1d4ed8] font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  You&apos;re all caught up ✓
                </p>
                <p className="text-xs text-slate-400">No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon: Icon, bgCls, iconCls } = NOTIF_ICONS[notif.type]
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                      "border-b border-slate-100 last:border-0",
                      notif.read
                        ? "hover:bg-slate-50"
                        : "bg-blue-50/30 hover:bg-blue-50/60"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", bgCls)}>
                      <Icon className={cn("w-4 h-4", iconCls)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn(
                          "text-xs leading-tight",
                          notif.read
                            ? "text-slate-700 font-medium"
                            : "text-slate-900 font-semibold"
                        )}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <Circle className="w-2 h-2 fill-[#2563EB] text-[#2563EB] shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
            <button
              onClick={markAllRead}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Mark all as read
            </button>
            <button
              onClick={() => { setOpen(false); router.push("/app/notifications") }}
              className="text-xs text-[#2563EB] hover:text-[#1d4ed8] font-medium transition-colors"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
