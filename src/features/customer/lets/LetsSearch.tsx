"use client"

import { useState } from "react"
import {
  Search, MapPin, Calendar, Wallet, BedDouble, Sofa, PawPrint, SlidersHorizontal,
  LayoutGrid, Map as MapIcon, Rows3, Heart, FileText, Tag, Key,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import LetsCard from "./LetsCard"
import { EXPANDED_LONG_TERM_RENTALS } from "@/lib/public-marketplace/seed-expander"

const KPIS = [
  { id: "saved", label: "Saved lets", value: "—", icon: Heart, bg: "bg-rose-50 text-rose-500" },
  { id: "viewings", label: "Upcoming viewings", value: "—", icon: Calendar, bg: "bg-blue-50 text-blue-600" },
  { id: "apps", label: "Active applications", value: "—", icon: FileText, bg: "bg-violet-50 text-violet-600" },
  { id: "offers", label: "Offers in progress", value: "—", icon: Tag, bg: "bg-amber-50 text-amber-600" },
  { id: "tenancies", label: "Active tenancies", value: "—", icon: Key, bg: "bg-emerald-50 text-emerald-600" },
]
const VIEWS = [{ id: "cards", icon: LayoutGrid }, { id: "list", icon: Rows3 }, { id: "map", icon: MapIcon }] as const

export default function LetsSearch() {
  const { toast } = useCustomerToast()
  const [view, setView] = useState<"cards" | "list" | "map">("cards")

  const rentals = EXPANDED_LONG_TERM_RENTALS

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-slate-900">Find your next home</h2>
        <p className="text-[13.5px] text-slate-500 mt-1">Discover quality long-term lets from verified landlords and agents.</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
        <div className="flex flex-wrap items-end gap-2">
          <Seg icon={MapPin} label="Location"><input defaultValue="Manchester, M1" className="w-full bg-transparent text-[13px] text-slate-800 outline-none" /></Seg>
          <Seg icon={Calendar} label="Move-in date"><button onClick={() => toast("Date picker — coming soon", "info")} className="text-[13px] text-slate-500 text-left w-full">Anytime</button></Seg>
          <Seg icon={Wallet} label="Monthly budget"><button onClick={() => toast("Budget — coming soon", "info")} className="text-[13px] text-slate-500 text-left w-full">£800 – £2,500</button></Seg>
          <Seg icon={BedDouble} label="Bedrooms"><button onClick={() => toast("Bedrooms — coming soon", "info")} className="text-[13px] text-slate-500 text-left w-full">Any</button></Seg>
          <Seg icon={Sofa} label="Furnishing"><button onClick={() => toast("Furnishing — coming soon", "info")} className="text-[13px] text-slate-500 text-left w-full">Any</button></Seg>
          <button onClick={() => toast("Searching lets…", "info")} className="inline-flex items-center justify-center gap-2 bg-[#0D1B2A] text-white rounded-xl px-5 py-2.5 text-[13px] font-semibold shrink-0"><Search className="w-4 h-4" /> Search lets</button>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
          <Chip icon={PawPrint}>Pet friendly</Chip><Chip>Bills included</Chip><Chip>Parking</Chip><Chip>Garden</Chip>
          <button className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 ml-auto"><SlidersHorizontal className="w-3.5 h-3.5" /> More filters</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}><Icon className="w-5 h-5" /></span>
            <div><p className="text-[18px] font-bold text-slate-900 leading-none">{k.value}</p><p className="text-[11px] text-slate-500 mt-1">{k.label}</p></div>
          </div>
        )})}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-slate-900">Long-term lets <span className="text-slate-400 font-medium text-[13px]">{rentals.length} results</span></h3>
        <div className="flex items-center gap-2">
          <button onClick={() => toast("Sort — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700">Sort: Recommended</button>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {VIEWS.map((v) => { const Icon = v.icon; return <button key={v.id} onClick={() => setView(v.id)} className={cn("rounded-lg px-2.5 py-1.5 transition", view === v.id ? "bg-[#0D1B2A] text-white" : "text-slate-500")}><Icon className="w-4 h-4" /></button> })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={cn("grid gap-5 items-start", view === "map" ? "grid-cols-1 lg:grid-cols-[1fr_420px]" : "")}>
        <div className={cn(
          "grid gap-5",
          view === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          view === "map" && "lg:grid-cols-2",
        )}>
          {rentals.map((rental) => (
            <LetsCard key={rental.id} rental={rental} />
          ))}
        </div>
        {view === "map" && (
          <div className="relative bg-[#E8EEF4] rounded-2xl border border-slate-200 min-h-[480px] sticky top-[84px] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,#dceaf6,transparent_45%)]" />
            <div className="absolute inset-0 flex items-center justify-center text-slate-400"><MapIcon className="w-8 h-8" /></div>
          </div>
        )}
      </div>
    </div>
  )
}

function Seg({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 flex-1 min-w-[150px]"><Icon className="w-4 h-4 text-slate-400 shrink-0" /><div className="min-w-0 flex-1"><p className="text-[10.5px] font-semibold text-slate-500">{label}</p>{children}</div></div>
}
function Chip({ icon: Icon, children }: { icon?: typeof PawPrint; children: React.ReactNode }) {
  return <button className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-[12px] font-medium text-slate-600 hover:bg-slate-50">{Icon && <Icon className="w-3.5 h-3.5" />}{children}</button>
}
