"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ListingGalleryProps {
  images: string[]
  title: string
}

/**
 * Premium listing gallery. Desktop: a hero + thumbnail mosaic. Mobile: a single
 * swipeable hero with a counter. Degrades to a tasteful placeholder when the
 * listing has no photos (real content only — no stock/mock images injected).
 */
export default function ListingGallery({ images, title }: ListingGalleryProps) {
  const [active, setActive] = useState(0)
  const valid = images.filter((u) => typeof u === "string" && u.length > 0)

  if (valid.length === 0) {
    return (
      <div className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl bg-gradient-to-br from-slate-100 to-blue-50 border border-[#E2EAF6] flex flex-col items-center justify-center gap-2 text-slate-400">
        <ImageIcon className="w-8 h-8" aria-hidden="true" />
        <span className="text-[13px] font-medium">No photos yet</span>
      </div>
    )
  }

  return (
    <div>
      {/* Mobile: single hero with counter */}
      <div className="sm:hidden">
        <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={valid[active]}
            alt={`${title} — photo ${active + 1}`}
            className="w-full h-full object-cover"
          />
          {valid.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 bg-slate-900/70 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
              {active + 1} / {valid.length}
            </div>
          )}
        </div>
        {valid.length > 1 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
            {valid.map((u, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View photo ${i + 1}`}
                className={cn(
                  "shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors",
                  i === active ? "border-[#1D4ED8]" : "border-transparent"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: hero + mosaic */}
      <div className="hidden sm:block">
        {valid.length === 1 ? (
          <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={valid[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setActive(0)}
              className="col-span-2 row-span-2 relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={valid[0]}
                alt={`${title} — main photo`}
                className="w-full h-full object-cover group-hover:brightness-95 transition"
              />
            </button>
            {valid.slice(1, 5).map((u, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i + 1)}
                className="relative group overflow-hidden bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u}
                  alt={`${title} — photo ${i + 2}`}
                  className="w-full h-full object-cover group-hover:brightness-95 transition"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
