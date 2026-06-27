"use client"

import Link from "next/link"
import { Calendar, Users, ChevronRight } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { StatusPill, bookingStatusTone } from "../../components/StatusPill"
import type { Booking } from "../data/bookings"

interface Props {
  rows: Booking[]
  onSelect: (id: string) => void
}

export default function BookingsCardsView({ rows, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rows.map((b) => (
        <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative h-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute top-2.5 left-2.5"><StatusPill tone={bookingStatusTone(b.status)} className="bg-white/95">{b.status}</StatusPill></div>
          </div>
          <div className="p-4">
            <p className="text-[14px] font-semibold text-slate-900 truncate">{b.property}</p>
            <p className="text-[12.5px] text-slate-500 truncate">{b.location}</p>
            <div className="flex items-center gap-3 mt-2 text-[12px] text-slate-500">
              <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.dateRange}</span>
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {b.guests}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div><p className="text-[10.5px] text-slate-400">Total paid</p><p className="text-[14px] font-bold text-slate-900">{formatPence(b.totalPence, "GBP")}</p></div>
              <Link href={`/customer/bookings/${b.id}`} onMouseEnter={() => onSelect(b.id)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]">
                View booking <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
