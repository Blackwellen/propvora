"use client"

import Link from "next/link"
import { X, MessageSquare, Flag, Star as StarIcon, PencilLine } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { StatusPill, bookingStatusTone, paymentTone } from "../../components/StatusPill"
import type { Booking } from "../data/bookings"

interface Props {
  b: Booking
  onClose: () => void
  toast: (m: string, k?: "success" | "info" | "warning" | "error") => void
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10.5px] text-slate-400">{label}</p><p className="text-[12.5px] font-semibold text-slate-800">{value}</p></div>
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[12px] py-0.5"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium">{r}</span></div>
}

export default function BookingDetailPanel({ b, onClose }: Props) {
  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><p className="text-[14px] font-bold text-slate-900">Booking {b.ref}</p><StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill></div>
        <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="relative mt-3 rounded-xl overflow-hidden h-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-white text-[13.5px] font-semibold">{b.property}</p>
          <p className="text-white/80 text-[11.5px] flex items-center gap-1">{b.location}{b.rating && <span className="ml-1 inline-flex items-center gap-0.5"><StarIcon className="w-3 h-3 fill-amber-400 text-amber-400" />{b.rating} ({b.reviews})</span>}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field label="Check-in" value={b.checkIn} />
        <Field label="Check-out" value={b.checkOut} />
        <Field label="Guests" value={`${b.guests} guests`} />
        <Field label="Booking type" value={b.type} />
      </div>

      {b.perNightPence && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[12px] font-semibold text-slate-700 mb-2">Price breakdown</p>
          <Row l={`${formatPence(b.perNightPence, "GBP")} × ${b.nights} nights`} r={formatPence(b.perNightPence * (b.nights ?? 1), "GBP")} />
          {b.cleaningPence ? <Row l="Cleaning fee" r={formatPence(b.cleaningPence, "GBP")} /> : null}
          {b.servicePence ? <Row l="Service fee" r={formatPence(b.servicePence, "GBP")} /> : null}
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100"><span className="text-[12.5px] font-semibold text-slate-700">Total paid</span><span className="text-[13px] font-bold text-slate-900">{formatPence(b.totalPence, "GBP")}</span></div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Payment status</p>
        <div className="flex items-center justify-between"><StatusPill tone={paymentTone(b.payment)}>{b.payment}</StatusPill><Link href={`/customer/bookings/${b.id}`} className="text-[12px] font-semibold text-blue-600">View receipt</Link></div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Host / Operator</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-slate-200" /><div><p className="text-[12.5px] font-semibold text-slate-800">{b.host}</p>{b.superhost && <p className="text-[10.5px] text-amber-600">Superhost</p>}</div></div>
          <Link href="/customer/messages" className="text-[12px] font-semibold text-blue-600 border border-slate-200 rounded-lg px-2.5 py-1">Message</Link>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Link href={`/customer/bookings/${b.id}`} className="block text-center bg-[#0D1B2A] hover:bg-[#0b1622] text-white rounded-xl py-2.5 text-[13px] font-semibold">View booking detail</Link>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/customer/messages" className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><MessageSquare className="w-4 h-4" /> Message host</Link>
          <Link href={`/customer/bookings/${b.id}/modify`} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><PencilLine className="w-4 h-4" /> Request change</Link>
        </div>
        <Link href={`/customer/bookings/${b.id}/dispute`} className="flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 rounded-xl py-2 text-[12.5px] font-semibold hover:bg-rose-50"><Flag className="w-4 h-4" /> Open dispute</Link>
      </div>
    </aside>
  )
}
