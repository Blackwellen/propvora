"use client"

import { Star, Zap, ShieldCheck, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoney } from "./format"
import { STAY_TYPE_LABEL, STAY_POLICY_LABEL } from "./StayListingCard"
import {
  AMENITY_TOGGLES, TYPE_OPTIONS, POLICY_OPTIONS,
  type StayFilters,
} from "./stayFilters"

function Stepper({ label, value, onSet }: { label: string; value: number; onSet: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSet(n)}
            className={cn(
              "h-8 min-w-8 px-2 rounded-lg text-[12.5px] font-semibold transition-colors",
              value === n ? "bg-[#0B1B3F] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {n === 0 ? "Any" : n === 5 ? "5+" : n}
          </button>
        ))}
      </div>
    </div>
  )
}

/* The shared filter body — rendered inline on desktop and inside a bottom sheet
   on mobile/tablet. Pure presentational; all state lives in the parent. */
export default function StayFilterSheet({
  filters,
  priceCeiling,
  onChange,
  onClear,
}: {
  filters: StayFilters
  priceCeiling: number
  onChange: (patch: Partial<StayFilters>) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-5">
      {/* Price */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[13px] font-semibold text-[#0B1B3F]">Price per night</h4>
          {priceCeiling > 0 && filters.maxPence != null && (
            <span className="text-[12px] font-medium text-slate-500">
              up to {formatMoney(filters.maxPence, "GBP")}
            </span>
          )}
        </div>
        {priceCeiling > 0 ? (
          <input
            type="range"
            min={0}
            max={priceCeiling}
            step={1000}
            value={filters.maxPence ?? priceCeiling}
            onChange={(e) => onChange({ maxPence: Number(e.target.value) >= priceCeiling ? null : Number(e.target.value) })}
            className="w-full accent-[var(--brand-strong)]"
          />
        ) : (
          <p className="text-[12px] text-slate-400">No priced stays yet</p>
        )}
      </section>

      {/* Rooms */}
      <section className="space-y-2.5">
        <h4 className="text-[13px] font-semibold text-[#0B1B3F]">Rooms & guests</h4>
        <Stepper label="Guests" value={Math.min(filters.guests, 5)} onSet={(v) => onChange({ guests: v })} />
        <Stepper label="Bedrooms" value={Math.min(filters.bedrooms, 5)} onSet={(v) => onChange({ bedrooms: v })} />
        <Stepper label="Beds" value={Math.min(filters.beds, 5)} onSet={(v) => onChange({ beds: v })} />
        <Stepper label="Bathrooms" value={Math.min(filters.bathrooms, 5)} onSet={(v) => onChange({ bathrooms: v })} />
      </section>

      {/* Property type */}
      <section>
        <h4 className="mb-2 text-[13px] font-semibold text-[#0B1B3F]">Property type</h4>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_OPTIONS.map((t) => (
            <Chip key={t} active={filters.type === t} onClick={() => onChange({ type: filters.type === t ? null : t })}>
              {STAY_TYPE_LABEL[t]}
            </Chip>
          ))}
        </div>
      </section>

      {/* Booking + trust */}
      <section className="flex flex-wrap gap-1.5">
        <Chip active={filters.instantOnly} onClick={() => onChange({ instantOnly: !filters.instantOnly })} icon={<Zap className="h-3.5 w-3.5" />}>
          Instant book
        </Chip>
        <Chip active={filters.verifiedOnly} onClick={() => onChange({ verifiedOnly: !filters.verifiedOnly })} icon={<ShieldCheck className="h-3.5 w-3.5" />}>
          Verified only
        </Chip>
      </section>

      {/* Amenities */}
      <section>
        <h4 className="mb-2 text-[13px] font-semibold text-[#0B1B3F]">Amenities</h4>
        <div className="flex flex-wrap gap-1.5">
          {AMENITY_TOGGLES.map((a) => {
            const on = filters.amenities.includes(a.key)
            return (
              <Chip
                key={a.key}
                active={on}
                onClick={() =>
                  onChange({
                    amenities: on ? filters.amenities.filter((x) => x !== a.key) : [...filters.amenities, a.key],
                  })
                }
              >
                {a.label}
              </Chip>
            )
          })}
        </div>
      </section>

      {/* Rating */}
      <section>
        <h4 className="mb-2 text-[13px] font-semibold text-[#0B1B3F]">Guest rating</h4>
        <div className="flex flex-wrap gap-1.5">
          {[0, 3, 4, 4.5].map((r) => (
            <Chip key={r} active={filters.minRating === r} onClick={() => onChange({ minRating: r })} icon={r > 0 ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : undefined}>
              {r === 0 ? "Any" : `${r}+`}
            </Chip>
          ))}
        </div>
      </section>

      {/* Cancellation */}
      <section>
        <h4 className="mb-2 text-[13px] font-semibold text-[#0B1B3F]">Cancellation</h4>
        <div className="flex flex-wrap gap-1.5">
          {POLICY_OPTIONS.map((p) => (
            <Chip key={p} active={filters.cancellation === p} onClick={() => onChange({ cancellation: filters.cancellation === p ? null : p })}>
              {STAY_POLICY_LABEL[p]}
            </Chip>
          ))}
        </div>
      </section>

      <button onClick={onClear} className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-[var(--brand-strong)]">
        <X className="h-3.5 w-3.5" /> Clear all filters
      </button>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active ? "border-[var(--brand-strong)] bg-[var(--brand-soft)] text-[var(--brand-strong)]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
    >
      {icon}
      {children}
    </button>
  )
}
