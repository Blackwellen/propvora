"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { StatusPill, bookingStatusTone } from "../../components/StatusPill"
import type { Booking } from "../data/bookings"

interface Props {
  rows: Booking[]
  selectedId?: string
  onSelect: (id: string) => void
}

export default function BookingsOverviewView({ rows, selectedId, onSelect }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
      {rows.map((b) => {
        const active = b.id === selectedId
        return (
          <div
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={cn("flex items-center gap-4 p-4 cursor-pointer transition-colors", active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500 rounded-xl" : "hover:bg-slate-50")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt="" className="w-24 h-18 rounded-xl object-cover shrink-0" style={{ height: "4.5rem" }} />
            <div className="flex-1 min-w-0">
              <StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill>
              <p className="text-[14px] font-semibold text-slate-900 truncate mt-1">{b.property}</p>
              <p className="text-[12.5px] text-slate-500 truncate">{b.location}</p>
              <p className="text-[11.5px] text-slate-400 mt-0.5">Booking ref. {b.ref} · {b.guests} guests</p>
            </div>
            <div className="hidden sm:block text-center"><p className="text-[10px] text-slate-400">Check-in</p><p className="text-[12.5px] font-semibold text-slate-700">{b.checkIn}</p></div>
            <div className="hidden sm:block text-center"><p className="text-[10px] text-slate-400">Check-out</p><p className="text-[12.5px] font-semibold text-slate-700">{b.checkOut}</p></div>
            <div className="text-right shrink-0"><p className="text-[15px] font-bold text-slate-900">{formatPence(b.totalPence, "GBP")}</p><p className="text-[11px] text-slate-400">Total</p></div>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </div>
        )
      })}
    </div>
  )
}
