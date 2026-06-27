"use client"

import Link from "next/link"
import { LayoutGrid, Table2, Map as MapIcon, Rows3 } from "lucide-react"
import { cn } from "@/lib/utils"

type View = "overview" | "cards" | "table" | "map"
type Tab = "all" | "stays" | "lets"

const VIEWS: { id: View; label: string; icon: typeof Rows3 }[] = [
  { id: "overview", label: "Overview", icon: Rows3 },
  { id: "cards", label: "Cards", icon: LayoutGrid },
  { id: "table", label: "Table", icon: Table2 },
  { id: "map", label: "Map", icon: MapIcon },
]

interface Props {
  tab: Tab
  view: View
  onTabChange: (t: Tab) => void
  onViewChange: (v: View) => void
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("px-3.5 py-2.5 text-[13.5px] font-semibold border-b-2 -mb-px transition-colors", active ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500 hover:text-slate-800")}>
      {children}
    </button>
  )
}

export default function BookingsTabBar({ tab, view, onTabChange, onViewChange }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
      <nav className="flex items-center gap-1 -mb-px">
        <TabBtn active={tab === "all"} onClick={() => onTabChange("all")}>All bookings</TabBtn>
        <TabBtn active={tab === "stays"} onClick={() => onTabChange("stays")}>Stays</TabBtn>
        <TabBtn active={tab === "lets"} onClick={() => onTabChange("lets")}>Lets</TabBtn>
        <Link href="/customer/bookings/disputes" className="px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5">
          Disputes <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">2</span>
        </Link>
        <Link href="/customer/bookings/completed" className="px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-500 hover:text-slate-800">Completed</Link>
      </nav>
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-1.5">
        {VIEWS.map((v) => {
          const Icon = v.icon
          const active = view === v.id
          return (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition",
                active ? "bg-[#0D1B2A] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Icon className="w-4 h-4" /> {v.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
