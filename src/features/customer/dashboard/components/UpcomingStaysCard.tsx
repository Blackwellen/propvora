"use client"

import Link from "next/link"
import { Calendar, Users, ChevronRight, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { upcomingStays } from "../../data/mock"

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">{children}</div>
}
function CardHead({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      <Link href={href} className="text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand)] inline-flex items-center gap-1">
        {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

export default function UpcomingStaysCard() {
  return (
    <Card>
      <CardHead title="Upcoming stays" href="/customer/bookings" linkLabel="View all bookings" />
      {upcomingStays.length === 0 && (
        <p className="text-[13px] text-slate-400 py-4 text-center">No upcoming stays. Browse properties to make your first booking.</p>
      )}
      <ul className="divide-y divide-slate-100">
        {upcomingStays.map((s) => (
          <li key={s.id} className="flex items-center gap-4 py-4 first:pt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <span className={cn(
                "inline-block text-[10.5px] font-semibold rounded-full px-2 py-0.5 mb-1",
                s.status === "Confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              )}>{s.status}</span>
              <p className="text-[14px] font-semibold text-slate-900 truncate">{s.title}</p>
              <p className="text-[12.5px] text-slate-500 truncate">{s.location}</p>
              <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> {s.dateRange}
                <Users className="w-3.5 h-3.5 ml-1" /> {s.guests} guests
              </p>
            </div>
            <div className="text-center bg-slate-50 rounded-xl px-3 py-2 shrink-0">
              <p className="text-[10px] text-slate-400 font-medium">Check-in</p>
              <p className="text-[13px] font-bold text-slate-800">{s.checkInDay}</p>
              <p className="text-[10.5px] text-slate-400">{s.checkInTime}</p>
            </div>
            <Link href={`/customer/bookings/${s.id}`} className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 shrink-0">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
