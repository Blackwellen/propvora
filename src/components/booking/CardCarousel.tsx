"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   CardCarousel — an Airbnb-style swipeable photo carousel for listing cards.

   - Native horizontal scroll-snap (touch swipe on mobile/tablet) + prev/next
     arrows that reveal on hover (desktop).
   - Dot indicators reflect the active photo.
   - A single photo renders as a plain image (no controls).
   - Arrows/dots stopPropagation so they don't trigger the parent <Link>.
─────────────────────────────────────────────────────────────────────────── */

export default function CardCarousel({
  photos,
  alt,
  aspect = "aspect-[4/3]",
  fallback,
}: {
  photos: string[]
  alt: string
  aspect?: string
  fallback?: React.ReactNode
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)
  const list = photos.filter(Boolean)

  if (list.length === 0) {
    return (
      <div className={cn("relative w-full overflow-hidden bg-gradient-to-br from-blue-50 via-slate-100 to-emerald-50", aspect)}>
        {fallback}
      </div>
    )
  }

  function go(dir: 1 | -1, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const el = scrollerRef.current
    if (!el) return
    const next = Math.max(0, Math.min(list.length - 1, active + dir))
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" })
    setActive(next)
  }

  function onScroll() {
    const el = scrollerRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== active) setActive(i)
  }

  return (
    <div className={cn("group/carousel relative w-full overflow-hidden", aspect)}>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {list.map((src, i) => (
          <div key={i} className="relative h-full w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${alt} — photo ${i + 1}`} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>

      {list.length > 1 && (
        <>
          {active > 0 && (
            <button
              type="button"
              onClick={(e) => go(-1, e)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {active < list.length - 1 && (
            <button
              type="button"
              onClick={(e) => go(1, e)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1">
            {list.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full bg-white transition-all",
                  i === active ? "w-1.5 opacity-100" : "w-1.5 opacity-50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
