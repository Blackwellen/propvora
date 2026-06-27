"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Copy, MapPin, Star, Shield, CheckCircle2, Users, KeyRound, FileText,
  ChevronRight, Wifi, Wind, ChefHat, Thermometer, WashingMachine, Tv, Car, Utensils, Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { StatusPill, bookingStatusTone } from "../components/StatusPill"
import { formatPence } from "@/lib/marketplace/money"
import type { Booking } from "../data/bookings"
import BookingDetailGallery from "./components/BookingDetailGallery"
import BookingPropertyHostCards from "./components/BookingPropertyHostCards"
import BookingDetailRail from "./components/BookingDetailRail"

const TABS = ["Overview", "Itinerary", "Messages", "Payments", "Documents", "Dispute"]
const AMENITIES = [
  { icon: Wifi, label: "Free Wi-Fi" }, { icon: Wind, label: "Air conditioning" }, { icon: ChefHat, label: "Kitchen" },
  { icon: Thermometer, label: "Heating" }, { icon: WashingMachine, label: "Washer" }, { icon: Tv, label: "Smart TV" },
  { icon: Car, label: "Free parking" }, { icon: Utensils, label: "Dishwasher" },
]

function Card({ title, icon: Icon, children }: { title: string; icon: typeof MapPin; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"><p className="text-[12.5px] font-bold text-slate-900 mb-2.5 flex items-center gap-1.5"><Icon className="w-4 h-4 text-slate-400" /> {title}</p>{children}</div>
}
function Tiny({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[11.5px] py-0.5"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium text-right">{r}</span></div>
}

export default function BookingDetailPage({ b }: { b: Booking }) {
  const { toast } = useCustomerToast()
  const [tab, setTab] = useState("Overview")

  return (
    <div className="space-y-5">
      <Link href="/customer/bookings" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="w-4 h-4" /> Back to bookings</Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2"><h1 className="text-[24px] font-bold text-slate-900">{b.property}</h1><StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill></div>
        <p className="text-[12.5px] text-slate-400 mt-1 flex items-center gap-1.5">Booking ID: {b.ref} <button onClick={() => { void navigator.clipboard?.writeText(b.ref); toast("Booking ID copied", "success") }}><Copy className="w-3.5 h-3.5" /></button>{b.dateRange ? ` · ${b.dateRange}` : ""}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-3.5 py-2.5 text-[13.5px] font-semibold border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5", t === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>
            {t}{t === "Messages" && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">2</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-5">
          <BookingDetailGallery b={b} />
          <BookingPropertyHostCards b={b} />

          {/* Guest / check-in / rules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card title="Guest details" icon={Users}>
              <p className="text-[12.5px] font-semibold text-slate-800 flex items-center gap-1.5">You <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></p>
              <p className="text-[11.5px] text-slate-400">See your profile for contact details</p>
              <Link href={`/customer/bookings/${b.id}/modify`} className="mt-2 inline-block text-[12px] font-semibold text-blue-600">Manage guests</Link>
            </Card>
            <Card title="Check-in instructions" icon={KeyRound}>
              <p className="text-[11.5px] text-slate-500">Your host will share check-in details (arrival time, key collection and parking) before your stay.</p>
              <Link href="/customer/messages" className="mt-1 inline-block text-[12px] font-semibold text-blue-600">Message host →</Link>
            </Card>
            <Card title="House rules" icon={Shield}>
              {["No smoking", "No pets", "No parties or events", "Quiet hours: 22:00 – 08:00", "Maximum 2 guests"].map((r) => (
                <p key={r} className="text-[11.5px] text-slate-600 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {r}</p>
              ))}
            </Card>
          </div>

          {/* Amenities / docs / receipt */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card title="Amenities" icon={CheckCircle2}>
              <div className="grid grid-cols-2 gap-1.5">
                {AMENITIES.map((a) => { const I = a.icon; return <p key={a.label} className="text-[11.5px] text-slate-600 flex items-center gap-1.5"><I className="w-3.5 h-3.5 text-slate-400" /> {a.label}</p> })}
              </div>
            </Card>
            <Card title="Important documents" icon={FileText}>
              {[["House manual", "PDF · 2.4 MB"], ["Wi-Fi details", "PDF · 0.6 MB"], ["Local guide", "PDF · 3.1 MB"]].map(([n, s]) => (
                <button key={n} onClick={() => toast(`Downloading ${n}…`, "info")} className="w-full flex items-center justify-between py-1 group">
                  <span className="text-left"><span className="block text-[12px] font-medium text-slate-700">{n}</span><span className="block text-[10.5px] text-slate-400">{s}</span></span>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </button>
              ))}
              <Link href="/customer/lets/tenancies/x/documents" className="mt-1 inline-block text-[12px] font-semibold text-blue-600">View all documents →</Link>
            </Card>
            <Card title="Receipt summary" icon={FileText}>
              {b.perNightPence ? <Tiny l={`Subtotal (${b.nights ?? 1} night${(b.nights ?? 1) === 1 ? "" : "s"})`} r={formatPence(b.perNightPence * (b.nights ?? 1), "GBP")} /> : null}
              {b.cleaningPence ? <Tiny l="Cleaning fee" r={formatPence(b.cleaningPence, "GBP")} /> : null}
              {b.servicePence ? <Tiny l="Service fee" r={formatPence(b.servicePence, "GBP")} /> : null}
              <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100"><span className="text-[12.5px] font-semibold text-slate-700">Total paid</span><span className="text-[13px] font-bold text-slate-900">{formatPence(b.totalPence, "GBP")}</span></div>
              <a href={`/api/customer/bookings/${b.id}/receipt`} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600"><Download className="w-3.5 h-3.5" /> Download receipt (PDF)</a>
            </Card>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[12.5px] text-slate-600">This booking is protected by Propvora's Guest Protection. <Link href="/customer/help" className="font-semibold text-emerald-700">Learn more about our protection</Link></p>
          </div>
        </div>

        <BookingDetailRail b={b} />
      </div>
    </div>
  )
}
