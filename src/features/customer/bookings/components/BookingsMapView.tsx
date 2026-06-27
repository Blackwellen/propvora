"use client"

import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { StatusPill, bookingStatusTone } from "../../components/StatusPill"
import LocationMap from "@/components/maps/LocationMap"
import type { Booking } from "../data/bookings"

interface Props {
  rows: Booking[]
  selectedId?: string
  onSelect: (id: string) => void
}

function bookingPinColor(status: string): string {
  const s = status.toLowerCase()
  if (s.includes("confirm")) return "#10B981"
  if (s.includes("upcoming") || s.includes("pending")) return "#F59E0B"
  if (s.includes("let") || s.includes("complete")) return "#7C3AED"
  return "#2563EB"
}

export default function BookingsMapView({ rows, selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
        {rows.map((b) => {
          const active = b.id === selectedId
          return (
            <button key={b.id} onClick={() => onSelect(b.id)} className={cn("w-full text-left flex gap-3 p-3 transition-colors", active ? "bg-[var(--brand-soft)]/50" : "hover:bg-slate-50")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill>
                <p className="text-[12.5px] font-semibold text-slate-800 truncate mt-1">{b.property}</p>
                <p className="text-[11.5px] text-slate-400 truncate">{b.location}</p>
                <p className="text-[11.5px] text-slate-600 mt-0.5">{formatPence(b.totalPence, "GBP")}</p>
              </div>
            </button>
          )
        })}
      </div>
      <div className="relative rounded-2xl border border-slate-200 overflow-hidden min-h-[420px]">
        <LocationMap
          markers={rows.map((b) => ({
            id: b.id,
            address: b.location || null,
            label: b.property,
            sublabel: `${b.status} · ${formatPence(b.totalPence, "GBP")}`,
            color: bookingPinColor(b.status),
          }))}
          height={420}
          selectedId={selectedId}
          onSelect={onSelect}
        />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 rounded-full px-3 py-1.5 text-[11px] text-slate-500 shadow flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmed</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Upcoming</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Let</span>
        </div>
      </div>
    </div>
  )
}
