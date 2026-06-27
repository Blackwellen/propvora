"use client"

import Link from "next/link"
import { X, MapPin, Star, BedDouble, CheckCircle2, Minus } from "lucide-react"
import type { SavedFavourite } from "./FavouritesClient"

function gbp(pence: number, per?: "night" | "month") {
  const v = `£${(pence / 100).toLocaleString("en-GB")}`
  return per ? `${v}/${per === "night" ? "night" : "mo"}` : v
}

/**
 * Side-by-side comparison of up to 3 saved properties. Pure client view over the
 * already-loaded favourites — compares price, location, type, rating and
 * availability, with a deep link to each property.
 */
export function CompareModal({ items, onClose, onRemove }: { items: SavedFavourite[]; onClose: () => void; onRemove: (id: string) => void }) {
  const cheapest = Math.min(...items.map((i) => i.pricePence).filter((n) => n > 0))
  const bestRating = Math.max(...items.map((i) => i.rating ?? 0))

  const rows: { label: string; render: (i: SavedFavourite) => React.ReactNode }[] = [
    { label: "Price", render: (i) => (
      <span className={`font-semibold ${i.pricePence === cheapest && cheapest > 0 ? "text-emerald-600" : "text-slate-800"}`}>
        {i.pricePence > 0 ? gbp(i.pricePence, i.pricePer) : "—"}
        {i.pricePence === cheapest && cheapest > 0 && <span className="ml-1 text-[10px] font-bold uppercase text-emerald-600">Lowest</span>}
      </span>
    ) },
    { label: "Location", render: (i) => <span className="text-slate-700 inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{i.location || "—"}</span> },
    { label: "Type", render: (i) => <span className="text-slate-700 capitalize">{i.kind}</span> },
    { label: "Rating", render: (i) => i.rating ? (
      <span className={`inline-flex items-center gap-1 ${i.rating === bestRating && bestRating > 0 ? "text-emerald-600 font-semibold" : "text-slate-700"}`}>
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{i.rating}{i.reviews ? ` (${i.reviews})` : ""}
      </span>
    ) : <Minus className="w-3.5 h-3.5 text-slate-300" /> },
    { label: "Availability", render: (i) => i.available ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />{i.available}</span> : <Minus className="w-3.5 h-3.5 text-slate-300" /> },
  ]

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[88vh] overflow-auto bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2"><BedDouble className="w-4 h-4 text-blue-600" /> Compare {items.length} properties</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          {/* Property headers */}
          <div className="grid gap-3" style={{ gridTemplateColumns: `120px repeat(${items.length}, minmax(0,1fr))` }}>
            <div />
            {items.map((i) => (
              <div key={i.id} className="relative">
                <div className="rounded-xl overflow-hidden aspect-[4/3] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.image} alt={i.title} className="w-full h-full object-cover" />
                </div>
                <button onClick={() => onRemove(i.id)} aria-label="Remove from compare" className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-slate-500 hover:text-red-500 flex items-center justify-center shadow-sm"><X className="w-3.5 h-3.5" /></button>
                <p className="mt-2 text-[12.5px] font-semibold text-slate-900 leading-tight line-clamp-2">{i.title}</p>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
            {rows.map((r) => (
              <div key={r.label} className="grid gap-3 py-3 items-center text-[12.5px]" style={{ gridTemplateColumns: `120px repeat(${items.length}, minmax(0,1fr))` }}>
                <span className="text-slate-400 font-medium">{r.label}</span>
                {items.map((i) => <div key={i.id}>{r.render(i)}</div>)}
              </div>
            ))}
            {/* Action row */}
            <div className="grid gap-3 py-3 items-center" style={{ gridTemplateColumns: `120px repeat(${items.length}, minmax(0,1fr))` }}>
              <span className="text-slate-400 font-medium text-[12.5px]" />
              {items.map((i) => (
                <Link key={i.id} href={i.href ?? "#"} className="inline-flex items-center justify-center bg-[#2563EB] text-white rounded-lg py-1.5 text-[12px] font-semibold hover:bg-[#1d4ed8]">View</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
