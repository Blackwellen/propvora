"use client"

import Link from "next/link"
import { MapPin, Star, ChevronRight } from "lucide-react"
import { propertyImages as IMG } from "../../data/mock"
import type { Booking } from "../data/bookings"

function Card({ title, icon: Icon, children }: { title: string; icon: typeof MapPin; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"><p className="text-[12.5px] font-bold text-slate-900 mb-2.5 flex items-center gap-1.5"><Icon className="w-4 h-4 text-slate-400" /> {title}</p>{children}</div>
}

interface Props { b: Booking }

export default function BookingPropertyHostCards({ b }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Card title="Property & location" icon={MapPin}>
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG.lakeview} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-800">{b.property}</p>
            <p className="text-[11.5px] text-slate-400">Windermere, LA23 · United Kingdom</p>
            <p className="text-[11.5px] text-slate-500 mt-0.5 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9 (128 reviews)</p>
          </div>
        </div>
        <Link href="/customer/stays" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600">View property listing <ChevronRight className="w-3.5 h-3.5" /></Link>
      </Card>
      <Card title="Hosted by" icon={Star}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="w-11 h-11 rounded-full bg-slate-200 shrink-0" /><div><p className="text-[13px] font-semibold text-slate-800">{b.host} <span className="text-[10.5px] text-amber-600 font-semibold ml-1">Superhost</span></p><p className="text-[11.5px] text-slate-500 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9 (87)</p><p className="text-[11px] text-slate-400">Response: 98% · within 1 hour</p></div></div>
        </div>
        <Link href="/customer/messages" className="mt-2 inline-block text-[12px] font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5">Message host</Link>
      </Card>
    </div>
  )
}
