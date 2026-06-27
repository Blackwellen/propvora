"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Bell, Inbox, Wrench, FileText, ReceiptText, Wallet, Star,
  ShieldCheck, FileBadge, AlertTriangle, MessageSquare, Info, type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSupplierApi } from "./useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "./SupplierWorkspaceContext"
import { timeAgo } from "./format"

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

const ICONS: Record<string, LucideIcon> = {
  lead: Inbox, job: Wrench, quote: FileText, invoice: ReceiptText, payout: Wallet,
  review: Star, verification: ShieldCheck, insurance: FileBadge, dispute: AlertTriangle,
  message: MessageSquare, info: Info,
}

const TONES: Record<string, string> = {
  lead: "bg-[var(--brand-soft)] text-[var(--brand)]", job: "bg-emerald-50 text-emerald-600",
  quote: "bg-violet-50 text-violet-600", invoice: "bg-rose-50 text-rose-600",
  payout: "bg-amber-50 text-amber-600", review: "bg-amber-50 text-amber-600",
  verification: "bg-sky-50 text-sky-600", insurance: "bg-sky-50 text-sky-600",
  dispute: "bg-red-50 text-red-600", message: "bg-[var(--brand-soft)] text-[var(--brand)]",
  info: "bg-slate-100 text-slate-500",
}

export default function SupplierNotificationBell() {
  const { workspaceId } = useSupplierWorkspace()
  const notifs = useSupplierApi<{ items: NotificationRow[]; unreadCount: number }>(
    useSupplierApiUrl("/api/supplier/notifications"),
    { select: (j) => j as { items: NotificationRow[]; unreadCount: number } }
  )
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const items = notifs.data?.items ?? []
  const unread = notifs.data?.unreadCount ?? 0

  async function markAll() {
    if (!workspaceId) return
    await fetch("/api/supplier/notifications", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, action: "read_all" }),
    })
    notifs.refresh()
  }

  async function markOne(id: string) {
    if (!workspaceId) return
    await fetch("/api/supplier/notifications", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, id, action: "read" }),
    })
    notifs.refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 h-12 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-[12px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)]">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">You're all caught up</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {items.slice(0, 12).map((n) => {
                  const Icon = ICONS[n.type] ?? Info
                  const body = (
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", TONES[n.type] ?? TONES.info)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[13px] truncate", n.read_at ? "font-medium text-slate-600" : "font-semibold text-slate-900")}>{n.title}</p>
                        {n.body && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>}
                        <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read_at && <span className="w-2 h-2 rounded-full bg-[var(--brand)] shrink-0 mt-1.5" />}
                    </div>
                  )
                  return (
                    <li key={n.id}>
                      {n.href ? (
                        <Link href={n.href} onClick={() => { markOne(n.id); setOpen(false) }}>{body}</Link>
                      ) : (
                        <button className="w-full text-left" onClick={() => markOne(n.id)}>{body}</button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="px-4 h-11 border-t border-slate-100 flex items-center">
            <Link href="/supplier/notifications" onClick={() => setOpen(false)} className="text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)]">
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
