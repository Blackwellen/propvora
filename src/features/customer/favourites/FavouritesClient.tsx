"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Heart, FolderPlus, Search, SlidersHorizontal, Map as MapIcon, LayoutGrid, Scale, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { CustomerPropertyCard, type PropertyCardData } from "../components/PropertyCard"
import { propertyImages as IMG } from "../data/mock"

/* Favourites (image 2 has no design — built to the written spec: saved stays &
   lets, collections, filters, card grid, map toggle, compare, recommended). */

type Tab = "all" | "stays" | "lets" | "collections"

const SAVED: (PropertyCardData & { kind: "stay" | "let"; available: string })[] = [
  { id: "luxe-city-loft", kind: "stay", title: "Luxe City Loft", location: "Manchester, M1", image: IMG.cityLoft, pricePence: 12000, rating: 4.9, reviews: 128, saved: true, badge: "Available", available: "Available now" },
  { id: "lakeview-cabin", kind: "stay", title: "Lakeview Cabin", location: "Windermere, LA23", image: IMG.lakeside, pricePence: 14500, rating: 4.8, reviews: 96, saved: true, available: "Available now" },
  { id: "seaside-cottage", kind: "stay", title: "Seaside Cottage", location: "Whitby, YO21", image: IMG.seaside, pricePence: 11000, rating: 4.7, reviews: 73, saved: true, available: "3 dates left" },
  { id: "the-edge", kind: "let", title: "The Edge, New Bailey", location: "Salford, M3", image: IMG.greenQuarter, pricePence: 165000, pricePer: "month", rating: 4.9, reviews: 40, saved: true, badge: "Verified landlord", available: "Available 1 Jun" },
  { id: "riverside-apartment", kind: "let", title: "Riverside Apartment", location: "Manchester, M1", image: IMG.riverside, pricePence: 145000, pricePer: "month", rating: 4.8, reviews: 54, saved: true, available: "Available now" },
  { id: "urban-penthouse", kind: "stay", title: "Urban Penthouse", location: "Leeds, LS1", image: IMG.urban, pricePence: 16000, rating: 4.6, reviews: 54, saved: true, available: "Available now" },
]
const COLLECTIONS = [
  { id: "lake-district", name: "Lake District escapes", count: 4, image: IMG.lakeside },
  { id: "city-breaks", name: "City breaks", count: 6, image: IMG.cityLoft },
  { id: "long-term", name: "Long-term shortlist", count: 3, image: IMG.greenQuarter },
]
const RECOMMENDED: PropertyCardData[] = [
  { id: "riverside-cottage", title: "Riverside Cottage", location: "Bakewell, DE45", image: IMG.riverside, pricePence: 14500, rating: 4.8, reviews: 96 },
  { id: "meadow-view", title: "Meadow View Cottage", location: "Ambleside, LA22", image: IMG.meadow, pricePence: 13000, rating: 4.7, reviews: 61 },
  { id: "ocean-view", title: "Ocean View Suite", location: "St Ives, TR26", image: IMG.seaside, pricePence: 21000, rating: 4.9, reviews: 88 },
  { id: "hilltop", title: "Hilltop Retreat", location: "Keswick, CA12", image: IMG.meadow, pricePence: 16500, rating: 4.6, reviews: 47 },
]

export default function FavouritesClient() {
  const { toast } = useCustomerToast()
  const [tab, setTab] = useState<Tab>("all")
  const [saved, setSaved] = useState<Record<string, boolean>>(() => Object.fromEntries(SAVED.map((s) => [s.id, true])))
  const [compare, setCompare] = useState<string[]>([])

  const rows = SAVED.filter((s) => saved[s.id]).filter((s) => (tab === "stays" ? s.kind === "stay" : tab === "lets" ? s.kind === "let" : true))

  function toggleSave(id: string) {
    setSaved((s) => { const next = { ...s, [id]: !s[id] }; toast(next[id] ? "Saved to favourites" : "Removed from favourites", next[id] ? "success" : "info"); return next })
  }
  function toggleCompare(id: string) {
    setCompare((c) => c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 flex items-center gap-2"><Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Favourites</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Your saved stays and lets, organised your way.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast("New collection — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><FolderPlus className="w-4 h-4" /> Create collection</button>
          <button onClick={() => toast("Map view — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-3 py-2 text-[12.5px] font-semibold"><MapIcon className="w-4 h-4" /> Open map</button>
        </div>
      </div>

      {/* Tabs + tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <nav className="flex items-center gap-1 -mb-px">
          {([["all", "All"], ["stays", "Saved stays"], ["lets", "Saved lets"], ["collections", "Collections"]] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("px-3.5 py-2.5 text-[13.5px] font-semibold border-b-2 -mb-px", tab === id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>{label}</button>
          ))}
        </nav>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input placeholder="Search saved" className="bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 text-[12.5px] outline-none w-40" /></div>
          <button className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400"><SlidersHorizontal className="w-4 h-4" /></button>
          <button className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400"><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

      {tab === "collections" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLLECTIONS.map((c) => (
            <Link key={c.id} href={`/customer/favourites?collection=${c.id}`} className="relative rounded-2xl overflow-hidden group h-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4"><p className="text-white text-[15px] font-bold">{c.name}</p><p className="text-white/80 text-[12px]">{c.count} saved</p></div>
            </Link>
          ))}
          <button onClick={() => toast("New collection — coming soon", "info")} className="rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center h-40 text-slate-400 hover:border-blue-300 hover:text-blue-500"><FolderPlus className="w-6 h-6 mb-1" /><span className="text-[12.5px] font-semibold">Create collection</span></button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((p) => (
            <div key={p.id} className="relative">
              <CustomerPropertyCard p={{ ...p, saved: saved[p.id], href: p.kind === "let" ? `/customer/lets/properties/${p.id}` : `/customer/stays/${p.id}`, badge: p.available }} onToggleSave={toggleSave} />
              <label className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 rounded-full px-2 py-1 text-[10.5px] font-semibold text-slate-600 shadow-sm cursor-pointer">
                <input type="checkbox" checked={compare.includes(p.id)} onChange={() => toggleCompare(p.id)} className="rounded border-slate-300 text-blue-600 w-3 h-3" /> Compare
              </label>
            </div>
          ))}
          {rows.length === 0 && <div className="col-span-full text-center py-16 text-slate-400 text-[13px]">No saved {tab === "lets" ? "lets" : "stays"} yet.</div>}
        </div>
      )}

      {/* Recommended */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[15px] font-bold text-slate-900 mb-3">Recommended similar properties</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {RECOMMENDED.map((p) => <CustomerPropertyCard key={p.id} p={p} onToggleSave={() => toast("Saved to favourites", "success")} />)}
        </div>
      </div>

      {/* Compare bar */}
      {compare.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0D1B2A] text-white rounded-full shadow-lg pl-4 pr-2 py-2 flex items-center gap-3">
          <span className="text-[12.5px] font-semibold">{compare.length} selected to compare</span>
          <button onClick={() => toast("Comparison view — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-white text-[#0D1B2A] rounded-full px-3 py-1.5 text-[12px] font-semibold"><Scale className="w-3.5 h-3.5" /> Compare</button>
          <button onClick={() => setCompare([])} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  )
}
