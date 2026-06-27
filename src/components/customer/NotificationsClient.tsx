"use client"

import { useTransition } from "react"
import Link from "next/link"
import {
  Bell,
  CalendarCheck,
  CreditCard,
  KeyRound,
  MessageSquare,
  Star,
  CheckCheck,
  type LucideIcon,
} from "lucide-react"
import { CustomerCard, CustomerEmptyState, CustomerButton } from "./ui"
import { timeAgo } from "./format"
import type { CustomerNotification } from "@/lib/customer/types"

const KIND_ICON: Record<string, LucideIcon> = {
  booking_confirmed: CalendarCheck,
  payment_due: CreditCard,
  check_in_available: KeyRound,
  review_due: Star,
  message: MessageSquare,
}

const SEVERITY_STYLE: Record<string, { bg: string; color: string }> = {
  info: { bg: "bg-[var(--brand-soft)]", color: "text-[var(--brand)]" },
  success: { bg: "bg-emerald-50", color: "text-emerald-600" },
  warning: { bg: "bg-amber-50", color: "text-amber-600" },
  critical: { bg: "bg-red-50", color: "text-red-600" },
}

export default function NotificationsClient({
  notifications,
  markAllAction,
  markOneAction,
}: {
  notifications: CustomerNotification[]
  markAllAction: () => Promise<void>
  markOneAction: (id: string) => Promise<void>
}) {
  const [pending, startTransition] = useTransition()
  const unread = notifications.filter((n) => !n.read_at).length

  if (notifications.length === 0) {
    return (
      <CustomerCard>
        <CustomerEmptyState
          icon={Bell}
          title="You're all caught up"
          description="Booking confirmations, payment reminders, check-in alerts, review prompts and new messages will show up here."
        />
      </CustomerCard>
    )
  }

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <CustomerButton
            variant="secondary"
            size="sm"
            loading={pending}
            onClick={() => startTransition(async () => { await markAllAction() })}
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </CustomerButton>
        </div>
      )}
      <CustomerCard className="p-2">
        <ul className="divide-y divide-slate-100">
          {notifications.map((n) => {
            const Icon = KIND_ICON[n.kind] ?? Bell
            const style = SEVERITY_STYLE[n.severity] ?? SEVERITY_STYLE.info
            const unreadRow = !n.read_at
            const body = (
              <div className={`flex items-start gap-3.5 p-3.5 rounded-xl transition-colors ${unreadRow ? "bg-[#F5F9FF]" : "hover:bg-slate-50"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                  <Icon className={`w-5 h-5 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                    {unreadRow && <span className="w-2 h-2 rounded-full bg-[var(--brand)] shrink-0" />}
                    <span className="text-[11px] text-slate-400 shrink-0 ml-auto">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && <p className="text-[13px] text-slate-500 mt-0.5">{n.body}</p>}
                </div>
              </div>
            )
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link
                    href={n.href}
                    onClick={() => { if (unreadRow) startTransition(async () => { await markOneAction(n.id) }) }}
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => { if (unreadRow) startTransition(async () => { await markOneAction(n.id) }) }}
                  >
                    {body}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </CustomerCard>
    </div>
  )
}
