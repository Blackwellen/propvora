"use client"

import { Calendar, Clock, Users, CalendarPlus } from "lucide-react"
import { useCustomerToast } from "../../components/toast"
import type { Booking } from "../data/bookings"
import { propertyImages as IMG } from "../../data/mock"

interface Props {
  b: Booking
}

function DateRow({ icon: Icon, label, value, sub }: { icon: typeof Calendar; label: string; value: string; sub?: string }) {
  return <div className="flex items-start gap-2.5"><Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /><div><p className="text-[10.5px] text-slate-400">{label}</p><p className="text-[12.5px] font-semibold text-slate-800">{value}{sub && <span className="text-slate-400 font-normal"> {sub}</span>}</p></div></div>
}

export default function BookingDetailGallery({ b }: Props) {
  const { toast } = useCustomerToast()
  const gallery = [IMG.lakeview, IMG.cityLoft, IMG.riverside, IMG.seaside, IMG.lakeside]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[0]} alt="" className="col-span-2 row-span-2 w-full h-full object-cover rounded-xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[1]} alt="" className="w-full h-full object-cover rounded-xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[2]} alt="" className="w-full h-full object-cover rounded-xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[3]} alt="" className="w-full h-full object-cover rounded-xl" />
        <button onClick={() => toast("Photo gallery — coming soon", "info")} className="relative rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gallery[4]} alt="" className="w-full h-full object-cover" />
          <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-[15px] font-bold">+18</span>
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <DateRow icon={Calendar} label="Check-in" value="24 May 2025" sub="15:00" />
        <DateRow icon={Calendar} label="Check-out" value="28 May 2025" sub="11:00" />
        <DateRow icon={Clock} label="Duration" value="4 nights" />
        <DateRow icon={Users} label="Guests" value="2 adults" />
        <button onClick={() => toast("Added to calendar", "success")} className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><CalendarPlus className="w-4 h-4" /> Add to calendar</button>
      </div>
    </div>
  )
}
