"use client"

import Link from "next/link"
import { Search, Bookmark, Gift, Headphones, ChevronRight } from "lucide-react"

const QUICK_ACTIONS = [
  { id: "search", icon: Search, title: "Search stays", sub: "Find your next stay", href: "/customer/stays" },
  { id: "collections", icon: Bookmark, title: "Browse collections", sub: "Curated places to stay", href: "/customer/favourites" },
  { id: "invite", icon: Gift, title: "Invite friends", sub: "Earn credit when they book", href: "/customer/account-settings?tab=referrals" },
  { id: "support", icon: Headphones, title: "Customer support", sub: "Get help when you need it", href: "/customer/help" },
]

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">{children}</div>
}

export default function QuickActionsRail() {
  return (
    <Card>
      <h3 className="text-[15px] font-bold text-slate-900 mb-3">Quick actions</h3>
      <ul className="space-y-1">
        {QUICK_ACTIONS.map((q) => {
          const Icon = q.icon
          return (
            <li key={q.id}>
              <Link href={q.href} className="flex items-center gap-3 py-2.5 group">
                <span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-[var(--brand-soft)] group-hover:text-[var(--brand)] shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-800">{q.title}</p>
                  <p className="text-[12px] text-slate-500 truncate">{q.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
