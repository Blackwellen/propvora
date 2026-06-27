"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Bell, Inbox, Wrench, FileText, ReceiptText, Wallet, Star, ShieldCheck,
  FileBadge, AlertTriangle, MessageSquare, Info, CheckCheck, type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierButton, SupplierTabs,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { timeAgo } from "@/components/supplier-workspace/format"

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

export default function SupplierNotificationsPage() {
  const { workspaceId } = useSupplierWorkspace()
  const notifs = useSupplierApi<{ items: NotificationRow[]; unreadCount: number }>(
    useSupplierApiUrl("/api/supplier/notifications"),
    { select: (j) => j as { items: NotificationRow[]; unreadCount: number } }
  )
  const [tab, setTab] = useState<"all" | "unread">("all")

  const items = notifs.data?.items ?? []
  const unread = notifs.data?.unreadCount ?? 0
  const filtered = useMemo(() => (tab === "unread" ? items.filter((n) => !n.read_at) : items), [items, tab])

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
    <div className="space-y-5">
      <MobileTopBar title="Notifications" subtitle={unread > 0 ? `${unread} unread` : "All caught up"} />
      <SupplierPageHeader
        title="Notifications"
        subtitle="Every meaningful event in your workspace — new leads, job updates, payments, verification and disputes."
        actions={unread > 0 ? <SupplierButton variant="secondary" onClick={markAll}><CheckCheck className="w-4 h-4" /> Mark all read</SupplierButton> : undefined}
        tabs={
          <SupplierTabs
            active={tab}
            onChange={(k) => setTab(k as typeof tab)}
            tabs={[{ key: "all", label: "All", count: items.length }, { key: "unread", label: "Unread", count: unread }]}
          />
        }
      />

      {notifs.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={6} /></SupplierCard>
      ) : filtered.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Bell}
            title={tab === "unread" ? "No unread notifications" : "No notifications yet"}
            description="As leads arrive, jobs move and invoices are paid, you'll see a running record of everything here."
          />
        </SupplierCard>
      ) : (
        <SupplierCard className="divide-y divide-slate-50 overflow-hidden">
          {filtered.map((n) => {
            const Icon = ICONS[n.type] ?? Info
            const inner = (
              <div className={cn("flex items-start gap-3 px-4 py-3.5", !n.read_at && "bg-[var(--brand-soft)]/30")}>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", TONES[n.type] ?? TONES.info)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", n.read_at ? "font-medium text-slate-700" : "font-semibold text-slate-900")}>{n.title}</p>
                  {n.body && <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>}
                  <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read_at && <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-1.5" />}
              </div>
            )
            return (
              <div key={n.id} className="hover:bg-slate-50/60 transition-colors">
                {n.href ? (
                  <Link href={n.href} onClick={() => markOne(n.id)}>{inner}</Link>
                ) : (
                  <button className="w-full text-left" onClick={() => markOne(n.id)}>{inner}</button>
                )}
              </div>
            )
          })}
        </SupplierCard>
      )}
    </div>
  )
}
