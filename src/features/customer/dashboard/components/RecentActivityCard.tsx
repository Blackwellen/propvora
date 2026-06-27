"use client"

import Link from "next/link"
import { Calendar, MessageSquare, CreditCard, FileText, BadgePercent, CalendarCheck, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { recentActivity, type ActivityItem } from "../../data/mock"

const ACTIVITY_ICON: Record<ActivityItem["icon"], typeof Calendar> = {
  booking: CalendarCheck, message: MessageSquare, payment: CreditCard, document: FileText, viewing: Calendar, offer: BadgePercent,
}
const ACTIVITY_BG: Record<ActivityItem["accent"], string> = {
  emerald: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600", blue: "bg-[var(--brand-soft)] text-[var(--brand)]",
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">{children}</div>
}
function CardHead({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      <Link href={href} className="text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand)] inline-flex items-center gap-1">
        {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

export default function RecentActivityCard() {
  return (
    <Card>
      <CardHead title="Recent activity" href="/customer/account-settings?tab=activity" linkLabel="View all activity" />
      {recentActivity.length === 0 && (
        <p className="text-[13px] text-slate-400 py-4 text-center">No recent activity yet.</p>
      )}
      <ul className="space-y-1">
        {recentActivity.map((a) => {
          const Icon = ACTIVITY_ICON[a.icon]
          return (
            <li key={a.id} className="flex items-center gap-3 py-2">
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", ACTIVITY_BG[a.accent])}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-slate-800">{a.title}</p>
                <p className="text-[12px] text-slate-500 truncate">{a.subtitle}</p>
              </div>
              <span className="text-[12px] text-slate-400 shrink-0">{a.when}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
