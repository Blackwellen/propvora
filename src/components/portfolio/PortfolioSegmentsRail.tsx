"use client"

import { useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Canonical operation-profile segments.                                */
/* Labels here MUST match `normaliseOperationProfile` output (the value */
/* PropertyCardData.operationProfile carries) so segment counts and the */
/* page's profile filter stay in lockstep. This is the authoritative 13 */
/* from the `properties.operation_profile` DB CHECK constraint.         */
/* ------------------------------------------------------------------ */
const SEGMENTS: { label: string; short: string; color: string; img?: string }[] = [
  { label: "Long-Term Let",          short: "LTL",        color: "#059669", img: "/property-types/btl.jpg" },
  { label: "HMO",                    short: "HMO",        color: "#1d4ed8", img: "/property-types/hmo.jpg" },
  { label: "Serviced Accommodation", short: "SA",         color: "#7C3AED", img: "/property-types/sa.jpg" },
  { label: "Rent-to-Rent",           short: "R2R",        color: "#EA580C", img: "/property-types/r2r.jpg" },
  { label: "Student Let",            short: "Student",    color: "#0891B2", img: "/property-types/student.jpg" },
  { label: "Co-Living",              short: "Co-Living",  color: "#DB2777", img: "/property-types/co-living.jpg" },
  { label: "Holiday Let",            short: "Holiday",    color: "#D97706", img: "/property-types/holiday.jpg" },
  { label: "Social Housing",         short: "Social",     color: "#16A34A", img: "/property-types/social.jpg" },
  { label: "Build-to-Rent",          short: "BTR",        color: "#0369A1" },
  { label: "Commercial",             short: "Commercial", color: "#374151", img: "/property-types/commercial.jpg" },
  { label: "Mixed Use",              short: "Mixed",      color: "#6B21A8", img: "/property-types/mixed.jpg" },
  { label: "Refinancing",            short: "Refi",       color: "#0D9488" },
  { label: "Development",            short: "Dev",        color: "#B45309", img: "/property-types/development.jpg" },
]

function fmtGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

/* Occupancy ring */
function OccRing({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = 13, c = 2 * Math.PI * r, dash = (pct / 100) * c
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4.5" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="white" strokeWidth="4.5"
        strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "18px 18px" }} />
      <text x="18" y="22" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700">{pct}%</text>
    </svg>
  )
}

export interface SegmentProperty {
  operationProfile?: string
  monthlyRent: number
  occupied?: number
  units: number
}

/**
 * Horizontal "Browse by segment" rail — the 13-profile hero ported from the
 * Portfolio Overview onto the canonical Properties list. Clicking a segment
 * toggles the page's profile filter (single source of truth), so counts and the
 * filtered list always agree.
 */
export function PortfolioSegmentsRail({
  properties,
  activeProfile,
  onSelect,
}: {
  properties: SegmentProperty[]
  activeProfile: string
  onSelect: (label: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "right" ? 230 : -230, behavior: "smooth" })

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-slate-900">Browse by segment</h3>
        {activeProfile !== "all" && (
          <button
            onClick={() => onSelect("all")}
            className="text-[12px] text-slate-500 hover:text-slate-700 font-semibold transition-colors"
          >
            Clear segment
          </button>
        )}
      </div>

      <div className="relative">
        {/* Left arrow + fade */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 flex items-center pointer-events-none">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll segments left"
            className="w-8 h-8 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center ml-0.5 hover:bg-slate-50 hover:shadow-lg transition-all duration-200 pointer-events-auto"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
          </button>
        </div>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-10">
          {SEGMENTS.map((seg) => {
            const inSeg = properties.filter((p) => p.operationProfile === seg.label)
            const count = inSeg.length
            const rent = inSeg.reduce((a, p) => a + (p.monthlyRent || 0), 0)
            const occ = count > 0
              ? Math.round(inSeg.reduce((a, p) => a + ((p.occupied ?? 0) / (p.units || 1)) * 100, 0) / count)
              : 0
            const empty = count === 0
            const active = activeProfile === seg.label

            return (
              <button
                key={seg.label}
                type="button"
                onClick={() => onSelect(active ? "all" : seg.label)}
                aria-pressed={active}
                className={cn(
                  "relative shrink-0 w-[200px] h-[180px] rounded-2xl overflow-hidden border cursor-pointer group shadow-sm text-left",
                  "hover:shadow-xl hover:-translate-y-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2",
                  active ? "ring-2 ring-[var(--brand)] ring-offset-2 border-transparent" : empty ? "border-slate-200 opacity-60 hover:opacity-90" : "border-white/10"
                )}
              >
                {seg.img ? (
                  <Image
                    src={seg.img}
                    alt={seg.label}
                    fill
                    className={cn("object-cover group-hover:scale-105 transition-transform duration-500", empty ? "opacity-40" : "opacity-100")}
                    sizes="200px"
                  />
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${seg.color}, ${seg.color}cc)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

                {/* Top label */}
                <div className="absolute top-2.5 left-2.5 right-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm" style={{ background: seg.color }}>
                    {seg.label}
                  </span>
                </div>

                {/* Bottom stats */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                  <div>
                    {empty ? (
                      <p className="text-[13px] font-bold text-white/80">No properties</p>
                    ) : (
                      <>
                        <p className="text-white text-[14px] font-black leading-none">
                          {count} {count === 1 ? "property" : "properties"}
                        </p>
                        {rent > 0 && <p className="text-white/75 text-[10px] mt-0.5 font-medium">{fmtGBP(rent)}/mo</p>}
                      </>
                    )}
                  </div>
                  {!empty && (
                    <div className="flex flex-col items-center">
                      <OccRing pct={occ} />
                      <span className="text-white/60 text-[8px] mt-0.5">Occ.</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Right arrow + fade */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 flex items-center justify-end pointer-events-none">
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll segments right"
            className="w-8 h-8 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center mr-0.5 hover:bg-slate-50 hover:shadow-lg transition-all duration-200 pointer-events-auto"
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
          </button>
        </div>
      </div>
    </div>
  )
}
