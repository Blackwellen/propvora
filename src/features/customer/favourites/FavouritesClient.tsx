"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Heart, FolderPlus, Search, SlidersHorizontal, Map as MapIcon, LayoutGrid, Scale, X, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { CustomerPropertyCard, type PropertyCardData } from "../components/PropertyCard"
import { CompareModal } from "./CompareModal"

interface CollectionRow { id: string; name: string; description: string | null }

function CreateCollectionModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: CollectionRow) => void }) {
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit() {
    if (!name.trim()) { setError("Give your collection a name."); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch("/api/customer/favourites/collections", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) { const b = await res.json().catch(() => null); setError(b?.error ?? "Could not create collection."); setBusy(false); return }
      const { item } = await res.json() as { item: CollectionRow }
      onCreated(item); onClose()
    } catch { setError("Something went wrong."); setBusy(false) }
  }
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-900">Create collection</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Summer in Cornwall" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)]" />
          {error && <p className="text-[12.5px] text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="border border-slate-200 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-slate-700">Cancel</button>
            <button onClick={submit} disabled={busy} className="bg-[var(--brand)] text-white rounded-xl px-4 py-2 text-[12.5px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Favourites — saved stays & lets, collections, filters, card grid, map toggle,
   compare, recommended. Saved items are real (customer_saved_listings). */

type Tab = "all" | "stays" | "lets" | "collections"

export type SavedFavourite = PropertyCardData & { kind: "stay" | "let"; available: string }

const RECOMMENDED: PropertyCardData[] = []

export default function FavouritesClient({ savedItems = [] }: { savedItems?: SavedFavourite[] }) {
  const { toast } = useCustomerToast()
  const [tab, setTab] = useState<Tab>("all")
  const SAVED = savedItems
  const [saved, setSaved] = useState<Record<string, boolean>>(() => Object.fromEntries(savedItems.map((s) => [s.id, true])))
  const [compare, setCompare] = useState<string[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [collections, setCollections] = useState<CollectionRow[]>([])

  // Load the customer's real collections.
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const res = await fetch("/api/customer/favourites/collections", { headers: { accept: "application/json" } })
        if (!res.ok || !active) return
        const data = (await res.json()) as { items?: CollectionRow[] }
        if (active) setCollections(data.items ?? [])
      } catch { /* ignore */ }
    })()
    return () => { active = false }
  }, [])

  const rows = SAVED.filter((s) => saved[s.id]).filter((s) => (tab === "stays" ? s.kind === "stay" : tab === "lets" ? s.kind === "let" : true))

  function toggleSave(id: string) {
    const willSave = !saved[id]
    setSaved((s) => ({ ...s, [id]: willSave }))
    const item = SAVED.find((s) => s.id === id)
    void (async () => {
      try {
        const res = willSave
          ? await fetch("/api/customer/favourites", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ entityType: item?.kind === "let" ? "let" : "stay", ref: id, label: item?.title }),
            })
          : await fetch(`/api/customer/favourites?ref=${encodeURIComponent(id)}`, { method: "DELETE" })
        if (!res.ok) {
          setSaved((s) => ({ ...s, [id]: !willSave })) // roll back
          toast("Could not update favourites. Please try again.", "error")
          return
        }
        toast(willSave ? "Saved to favourites" : "Removed from favourites", willSave ? "success" : "info")
      } catch {
        setSaved((s) => ({ ...s, [id]: !willSave }))
        toast("Could not update favourites. Please try again.", "error")
      }
    })()
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
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><FolderPlus className="w-4 h-4" /> Create collection</button>
          <Link href="/customer/stays/map" className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-3 py-2 text-[12.5px] font-semibold"><MapIcon className="w-4 h-4" /> Open map</Link>
        </div>
      </div>

      {/* Tabs + tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <nav className="flex items-center gap-1 -mb-px">
          {([["all", "All"], ["stays", "Saved stays"], ["lets", "Saved lets"], ["collections", "Collections"]] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("px-3.5 py-2.5 text-[13.5px] font-semibold border-b-2 -mb-px", tab === id ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500 hover:text-slate-800")}>{label}</button>
          ))}
        </nav>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input placeholder="Search saved" className="bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 text-[12.5px] outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)] w-40" /></div>
          <button className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400"><SlidersHorizontal className="w-4 h-4" /></button>
          <button className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400"><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

      {tab === "collections" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c) => (
            <Link key={c.id} href={`/customer/favourites?collection=${c.id}`} className="relative rounded-2xl overflow-hidden group h-40 bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col justify-end p-4">
              <p className="text-white text-[15px] font-bold">{c.name}</p>
              {c.description && <p className="text-white/80 text-[12px]">{c.description}</p>}
            </Link>
          ))}
          <button onClick={() => setShowCreate(true)} className="rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center h-40 text-slate-400 hover:border-[var(--color-brand-300)] hover:text-[var(--brand)]"><FolderPlus className="w-6 h-6 mb-1" /><span className="text-[12.5px] font-semibold">Create collection</span></button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((p) => (
            <div key={p.id} className="relative">
              <CustomerPropertyCard p={{ ...p, saved: saved[p.id], href: p.kind === "let" ? `/customer/lets/properties/${p.id}` : `/customer/stays/${p.id}`, badge: p.available }} onToggleSave={toggleSave} />
              <label className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 rounded-full px-2 py-1 text-[10.5px] font-semibold text-slate-600 shadow-sm cursor-pointer">
                <input type="checkbox" checked={compare.includes(p.id)} onChange={() => toggleCompare(p.id)} className="rounded border-slate-300 text-[var(--brand)] w-3 h-3" /> Compare
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
          <button onClick={() => setShowCompare(true)} className="inline-flex items-center gap-1.5 bg-white text-[#0D1B2A] rounded-full px-3 py-1.5 text-[12px] font-semibold"><Scale className="w-3.5 h-3.5" /> Compare</button>
          <button onClick={() => setCompare([])} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
      )}

      {showCreate && (
        <CreateCollectionModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setCollections((prev) => [c, ...prev]); setTab("collections"); toast("Collection created.", "success") }}
        />
      )}

      {showCompare && compare.length > 0 && (
        <CompareModal
          items={SAVED.filter((s) => compare.includes(s.id))}
          onClose={() => setShowCompare(false)}
          onRemove={(id) => {
            setCompare((c) => {
              const next = c.filter((x) => x !== id)
              if (next.length === 0) setShowCompare(false)
              return next
            })
          }}
        />
      )}
    </div>
  )
}
