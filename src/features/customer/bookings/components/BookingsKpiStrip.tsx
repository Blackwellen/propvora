"use client"

import { Calendar, CalendarClock, MessagesSquare, CheckCircle2, PoundSterling, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Booking } from "../data/bookings"

/**
 * BookingsKpiStrip — derives all KPI values from the bookings array passed in.
 * No hardcoded counts — values always reflect the actual data being shown.
 */
export default function BookingsKpiStrip({ bookings }: { bookings: Booking[] }) {
  const now = new Date()
  const upcoming = bookings.filter((b) => {
    const isActive = ["Upcoming", "Confirmed"].includes(b.status)
    const checkIn = b.checkIn ? new Date(b.checkIn) : null
    return isActive && (!checkIn || checkIn >= now)
  })
  const current = bookings.filter((b) => {
    const checkIn = b.checkIn ? new Date(b.checkIn) : null
    const checkOut = b.checkOut ? new Date(b.checkOut) : null
    return checkIn && checkOut && checkIn <= now && checkOut >= now
  })
  const completed = bookings.filter((b) => b.status === "Completed")
  const totalPence = bookings.reduce((s, b) => s + (b.totalPence ?? 0), 0)
  const ratedBookings = bookings.filter((b) => b.rating != null)
  const avgRating = ratedBookings.length > 0
    ? (ratedBookings.reduce((s, b) => s + (b.rating ?? 0), 0) / ratedBookings.length).toFixed(1)
    : "—"

  const kpis = [
    { id: "all", label: "All bookings", value: String(bookings.length), sub: "Total bookings", Icon: Calendar, bg: "bg-blue-50 text-blue-600" },
    { id: "upcoming", label: "Upcoming", value: String(upcoming.length), sub: "Next 6 months", Icon: CalendarClock, bg: "bg-violet-50 text-violet-600" },
    { id: "current", label: "Current stays", value: String(current.length), sub: "Right now", Icon: MessagesSquare, bg: "bg-violet-50 text-violet-600" },
    { id: "completed", label: "Completed", value: String(completed.length), sub: "All time", Icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
    { id: "spend", label: "Total spent", value: totalPence > 0 ? `£${(totalPence / 100).toLocaleString("en-GB", { minimumFractionDigits: 0 })}` : "£0", sub: "All time", Icon: PoundSterling, bg: "bg-blue-50 text-blue-600" },
    { id: "rating", label: "Avg. rating", value: avgRating, sub: "Across rated stays", Icon: Star, bg: "bg-amber-50 text-amber-600" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((k) => (
        <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}>
            <k.Icon className="w-[18px] h-[18px]" />
          </span>
          <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
          <p className="text-[12px] font-medium text-slate-500 mt-1">{k.label}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
        </div>
      ))}
    </div>
  )
}
