"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Search, MapPin, Calendar, Wallet, BedDouble, Sofa, PawPrint, SlidersHorizontal,
  LayoutGrid, Map as MapIcon, Rows3, Heart, FileText, Tag, Key, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import LetsCard from "./LetsCard"
import { EXPANDED_LONG_TERM_RENTALS } from "@/lib/public-marketplace/seed-expander"

const VIEWS = [{ id: "cards", icon: LayoutGrid }, { id: "list", icon: Rows3 }, { id: "map", icon: MapIcon }] as const

// Budget brackets (monthly, in pence). value = [minPence, maxPence|null]
const BUDGETS = [
  { id: "any", label: "Any budget", min: 0, max: null as number | null },
  { id: "u1000", label: "Up to £1,000", min: 0, max: 100000 },
  { id: "1000-1500", label: "£1,000 – £1,500", min: 100000, max: 150000 },
  { id: "1500-2000", label: "£1,500 – £2,000", min: 150000, max: 200000 },
  { id: "2000-2500", label: "£2,000 – £2,500", min: 200000, max: 250000 },
  { id: "2500p", label: "£2,500+", min: 250000, max: null },
]
const BEDROOMS = [
  { id: "any", label: "Any", min: 0 },
  { id: "studio", label: "Studio", min: 0, studio: true },
  { id: "1", label: "1+", min: 1 },
  { id: "2", label: "2+", min: 2 },
  { id: "3", label: "3+", min: 3 },
  { id: "4", label: "4+", min: 4 },
]
const FURNISHINGS = ["Any", "Furnished", "Part furnished", "Unfurnished"] as const
const SORTS = [
  { id: "recommended", label: "Recommended" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "beds-desc", label: "Most bedrooms" },
  { id: "newest", label: "Available soonest" },
] as const

type SortId = (typeof SORTS)[number]["id"]

export default function LetsSearch() {
  const [view, setView] = useState<"cards" | "list" | "map">("cards")

  // Filter state
  const [location, setLocation] = useState("")
  const [moveIn, setMoveIn] = useState("")
  const [budgetId, setBudgetId] = useState("any")
  const [bedroomsId, setBedroomsId] = useState("any")
  const [furnishing, setFurnishing] = useState<(typeof FURNISHINGS)[number]>("Any")
  const [sort, setSort] = useState<SortId>("recommended")
  const [chips, setChips] = useState({ pets: false, bills: false, parking: false, garden: false })

  // KPIs — wired to the customer's real Lets data + saved favourites
  const [kpiCounts, setKpiCounts] = useState<{ saved: number; viewings: number; apps: number; offers: number; tenancies: number } | null>(null)
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [letsRes, favRes] = await Promise.all([
          fetch("/api/customer/lets?type=all", { headers: { accept: "application/json" } }),
          fetch("/api/customer/favourites", { headers: { accept: "application/json" } }),
        ])
        const lets = (await letsRes.json().catch(() => ({}))) as {
          viewings?: unknown[]; applications?: unknown[]; offers?: unknown[]; tenancies?: unknown[]
        }
        const fav = (await favRes.json().catch(() => ({}))) as { items?: { entity_type?: string | null }[] }
        if (!active) return
        const upcomingViewings = (lets.viewings ?? []).length
        const activeApps = (lets.applications ?? []).length
        const openOffers = (lets.offers ?? []).length
        const activeTenancies = (lets.tenancies ?? []).length
        const savedLets = (fav.items ?? []).filter((i) => (i.entity_type ?? "").toLowerCase() === "let").length
        setKpiCounts({ saved: savedLets, viewings: upcomingViewings, apps: activeApps, offers: openOffers, tenancies: activeTenancies })
      } catch {
        if (active) setKpiCounts({ saved: 0, viewings: 0, apps: 0, offers: 0, tenancies: 0 })
      }
    })()
    return () => { active = false }
  }, [])

  const kpis = [
    { id: "saved", label: "Saved lets", value: kpiCounts ? String(kpiCounts.saved) : "—", icon: Heart, bg: "bg-rose-50 text-rose-500" },
    { id: "viewings", label: "Upcoming viewings", value: kpiCounts ? String(kpiCounts.viewings) : "—", icon: Calendar, bg: "bg-[var(--brand-soft)] text-[var(--brand)]" },
    { id: "apps", label: "Active applications", value: kpiCounts ? String(kpiCounts.apps) : "—", icon: FileText, bg: "bg-violet-50 text-violet-600" },
    { id: "offers", label: "Offers in progress", value: kpiCounts ? String(kpiCounts.offers) : "—", icon: Tag, bg: "bg-amber-50 text-amber-600" },
    { id: "tenancies", label: "Active tenancies", value: kpiCounts ? String(kpiCounts.tenancies) : "—", icon: Key, bg: "bg-emerald-50 text-emerald-600" },
  ]

  const results = useMemo(() => {
    const budget = BUDGETS.find((b) => b.id === budgetId) ?? BUDGETS[0]
    const beds = BEDROOMS.find((b) => b.id === bedroomsId) ?? BEDROOMS[0]
    const loc = location.trim().toLowerCase()
    const moveInTs = moveIn ? new Date(moveIn).getTime() : null

    const filtered = EXPANDED_LONG_TERM_RENTALS.filter((r) => {
      if (loc) {
        const hay = `${r.location} ${r.city} ${r.postcode}`.toLowerCase()
        if (!hay.includes(loc)) return false
      }
      if (r.monthlyRentPence < budget.min) return false
      if (budget.max != null && r.monthlyRentPence > budget.max) return false
      if (beds.studio) { if (r.propertyType !== "Studio" && r.beds > 0) return false }
      else if (r.beds < beds.min) return false
      if (furnishing !== "Any" && r.furnishingStatus !== furnishing) return false
      if (chips.pets && !r.petsAllowed) return false
      if (chips.bills && !r.billsIncluded) return false
      if (chips.parking && !r.parkingAvailable) return false
      if (chips.garden && !r.gardenAvailable) return false
      if (moveInTs != null) {
        const avail = r.availableFrom ? new Date(r.availableFrom).getTime() : 0
        if (avail > moveInTs) return false
      }
      return true
    })

    const sorted = [...filtered]
    switch (sort) {
      case "price-asc": sorted.sort((a, b) => a.monthlyRentPence - b.monthlyRentPence); break
      case "price-desc": sorted.sort((a, b) => b.monthlyRentPence - a.monthlyRentPence); break
      case "beds-desc": sorted.sort((a, b) => b.beds - a.beds); break
      case "newest": sorted.sort((a, b) => new Date(a.availableFrom).getTime() - new Date(b.availableFrom).getTime()); break
      default: sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    }
    return sorted
  }, [location, moveIn, budgetId, bedroomsId, furnishing, sort, chips])

  const activeFilterCount =
    (location.trim() ? 1 : 0) + (moveIn ? 1 : 0) + (budgetId !== "any" ? 1 : 0) +
    (bedroomsId !== "any" ? 1 : 0) + (furnishing !== "Any" ? 1 : 0) +
    Object.values(chips).filter(Boolean).length

  function clearAll() {
    setLocation(""); setMoveIn(""); setBudgetId("any"); setBedroomsId("any")
    setFurnishing("Any"); setChips({ pets: false, bills: false, parking: false, garden: false })
  }

  return (
    <div className="space-y-5">
      {/* Hero — mirrors the Stays page hero for cross-page consistency */}
      <section className="rounded-3xl bg-gradient-to-b from-[var(--brand-soft)] to-white px-5 py-8 sm:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">Find your next home</h1>
        <p className="text-[15px] text-slate-500 mb-6 max-w-2xl">Discover quality long-term lets from verified landlords and agents.</p>

        {/* Search bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
        <div className="flex flex-wrap items-end gap-2">
          <Seg icon={MapPin} label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, area or postcode"
              className="w-full bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
            />
          </Seg>
          <Seg icon={Calendar} label="Move-in date">
            <input
              type="date"
              value={moveIn}
              onChange={(e) => setMoveIn(e.target.value)}
              className="w-full bg-transparent text-[13px] text-slate-600 outline-none [color-scheme:light]"
            />
          </Seg>
          <Seg icon={Wallet} label="Monthly budget">
            <select value={budgetId} onChange={(e) => setBudgetId(e.target.value)} className="w-full bg-transparent text-[13px] text-slate-600 outline-none cursor-pointer">
              {BUDGETS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </Seg>
          <Seg icon={BedDouble} label="Bedrooms">
            <select value={bedroomsId} onChange={(e) => setBedroomsId(e.target.value)} className="w-full bg-transparent text-[13px] text-slate-600 outline-none cursor-pointer">
              {BEDROOMS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </Seg>
          <Seg icon={Sofa} label="Furnishing">
            <select value={furnishing} onChange={(e) => setFurnishing(e.target.value as (typeof FURNISHINGS)[number])} className="w-full bg-transparent text-[13px] text-slate-600 outline-none cursor-pointer">
              {FURNISHINGS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Seg>
          <div className="inline-flex items-center justify-center gap-2 bg-[#0D1B2A] text-white rounded-xl px-5 py-2.5 text-[13px] font-semibold shrink-0">
            <Search className="w-4 h-4" /> {results.length} match{results.length === 1 ? "" : "es"}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 flex-wrap">
          <Chip icon={PawPrint} active={chips.pets} onClick={() => setChips((c) => ({ ...c, pets: !c.pets }))}>Pet friendly</Chip>
          <Chip active={chips.bills} onClick={() => setChips((c) => ({ ...c, bills: !c.bills }))}>Bills included</Chip>
          <Chip active={chips.parking} onClick={() => setChips((c) => ({ ...c, parking: !c.parking }))}>Parking</Chip>
          <Chip active={chips.garden} onClick={() => setChips((c) => ({ ...c, garden: !c.garden }))}>Garden</Chip>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-slate-700 ml-auto">
              <X className="w-3.5 h-3.5" /> Clear ({activeFilterCount})
            </button>
          )}
          {activeFilterCount === 0 && (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 ml-auto"><SlidersHorizontal className="w-3.5 h-3.5" /> Filters</span>
          )}
        </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}><Icon className="w-5 h-5" /></span>
            <div><p className="text-[18px] font-bold text-slate-900 leading-none">{k.value}</p><p className="text-[11px] text-slate-500 mt-1">{k.label}</p></div>
          </div>
        )})}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-slate-900">Long-term lets <span className="text-slate-400 font-medium text-[13px]">{results.length} result{results.length === 1 ? "" : "s"}</span></h3>
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center">
            <select value={sort} onChange={(e) => setSort(e.target.value as SortId)} className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-[12.5px] font-semibold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-[var(--brand)]/30">
              {SORTS.map((s) => <option key={s.id} value={s.id}>Sort: {s.label}</option>)}
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </label>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {VIEWS.map((v) => { const Icon = v.icon; return <button key={v.id} onClick={() => setView(v.id)} className={cn("rounded-lg px-2.5 py-1.5 transition", view === v.id ? "bg-[#0D1B2A] text-white" : "text-slate-500")}><Icon className="w-4 h-4" /></button> })}
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-[14px] font-semibold text-slate-700">No lets match your filters</p>
          <p className="text-[12.5px] text-slate-400 mt-1">Try widening your budget, bedrooms or location.</p>
          {activeFilterCount > 0 && <button onClick={clearAll} className="mt-3 inline-block text-[12.5px] font-semibold text-[var(--brand)]">Clear all filters</button>}
        </div>
      ) : (
      <div className={cn("grid gap-5 items-start", view === "map" ? "grid-cols-1 lg:grid-cols-[1fr_420px]" : "")}>
        <div className={cn(
          "grid gap-5 items-stretch",
          view === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          view === "map" && "lg:grid-cols-2 xl:grid-cols-2",
        )}>
          {results.map((rental) => (
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
      )}
    </div>
  )
}

function Seg({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 flex-1 min-w-[150px]"><Icon className="w-4 h-4 text-slate-400 shrink-0" /><div className="min-w-0 flex-1"><p className="text-[10.5px] font-semibold text-slate-500">{label}</p>{children}</div></div>
}
function Chip({ icon: Icon, children, active, onClick }: { icon?: typeof PawPrint; children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition",
        active ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]" : "border-slate-200 text-slate-600 hover:bg-slate-50",
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}{children}
    </button>
  )
}
