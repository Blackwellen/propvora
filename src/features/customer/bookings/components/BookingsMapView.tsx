"use client"

import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { StatusPill, bookingStatusTone } from "../../components/StatusPill"
import type { Booking } from "../data/bookings"

interface Props {
  rows: Booking[]
  selectedId?: string
  onSelect: (id: string) => void
}

export default function BookingsMapView({ rows, selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
        {rows.map((b) => {
          const active = b.id === selectedId
          return (
            <button key={b.id} onClick={() => onSelect(b.id)} className={cn("w-full text-left flex gap-3 p-3 transition-colors", active ? "bg-blue-50/50" : "hover:bg-slate-50")}>
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
      <div className="relative bg-[#E8EEF4] rounded-2xl border border-slate-200 min-h-[420px] overflow-hidden">
        {/* Static map placeholder with markers — TODO(maps): swap for live map */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#dceaf6,transparent_40%),radial-gradient(circle_at_70%_60%,#e3f0e6,transparent_40%)]" />
        {rows.slice(0, 5).map((b, i) => {
          const pos = [["20%", "30%"], ["55%", "20%"], ["45%", "55%"], ["70%", "65%"], ["30%", "75%"]][i]
          const active = b.id === selectedId
          return (
            <button key={b.id} onClick={() => onSelect(b.id)} style={{ left: pos[0], top: pos[1] }} className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-md border-2 border-white",
              active ? "bg-violet-600 text-white scale-110" : "bg-white text-slate-700"
            )}>
              {formatPence(b.totalPence, "GBP")}
            </button>
          )
        })}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 rounded-full px-3 py-1.5 text-[11px] text-slate-500 shadow flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmed</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Upcoming</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" /> Let</span>
        </div>
      </div>
    </div>
  )
}
