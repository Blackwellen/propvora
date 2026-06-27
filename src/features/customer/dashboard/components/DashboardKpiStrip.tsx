"use client"

import { Calendar, ShoppingBag, Heart, MessageSquare, BadgePercent } from "lucide-react"
import { cn } from "@/lib/utils"
import { homeStats, type HomeStat } from "../../data/mock"

const STAT_ICON: Record<HomeStat["icon"], typeof Calendar> = {
  calendar: Calendar, bag: ShoppingBag, heart: Heart, chat: MessageSquare, offer: BadgePercent,
}
const STAT_ICON_BG: Record<HomeStat["accent"], string> = {
  blue: "bg-[var(--brand-soft)] text-[var(--brand)]", amber: "bg-amber-50 text-amber-600", red: "bg-rose-50 text-rose-500",
  violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600",
}
const SUB_ACCENT: Record<HomeStat["subAccent"], string> = {
  blue: "text-[var(--brand)]", amber: "text-amber-600", red: "text-rose-500",
  violet: "text-violet-600", emerald: "text-emerald-600", slate: "text-slate-500",
}

export default function DashboardKpiStrip() {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {homeStats.map((s) => {
        const Icon = STAT_ICON[s.icon]
        return (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", STAT_ICON_BG[s.accent])}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <p className="text-[22px] font-bold text-slate-900 mt-3 leading-none">{s.value}</p>
            <p className="text-[12.5px] font-medium text-slate-500 mt-1">{s.label}</p>
            <p className={cn("text-[11.5px] font-semibold mt-1.5", SUB_ACCENT[s.subAccent])}>{s.sub}</p>
          </div>
        )
      })}
    </section>
  )
}
