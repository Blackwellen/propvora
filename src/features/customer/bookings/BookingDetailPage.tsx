"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Copy, Calendar, Clock, Users, CalendarPlus, MapPin, Star, Shield, CheckCircle2,
  MessageSquare, KeyRound, Download, PencilLine, Flag, Wifi, Wind, ChefHat, Thermometer,
  WashingMachine, Tv, Car, Utensils, Eye, FileText, ChevronRight, HelpCircle, LifeBuoy, Phone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill, bookingStatusTone } from "../components/StatusPill"
import { propertyImages as IMG } from "../data/mock"
import type { Booking } from "../data/bookings"

const TABS = ["Overview", "Itinerary", "Messages", "Payments", "Documents", "Dispute"]
const AMENITIES = [
  { icon: Wifi, label: "Free Wi-Fi" }, { icon: Wind, label: "Air conditioning" }, { icon: ChefHat, label: "Kitchen" },
  { icon: Thermometer, label: "Heating" }, { icon: WashingMachine, label: "Washer" }, { icon: Tv, label: "Smart TV" },
  { icon: Car, label: "Free parking" }, { icon: Utensils, label: "Dishwasher" },
]

export default function BookingDetailPage({ b }: { b: Booking }) {
  const { toast } = useCustomerToast()
  const [tab, setTab] = useState("Overview")
  const gallery = [IMG.lakeview, IMG.cityLoft, IMG.riverside, IMG.seaside, IMG.lakeside]

  return (
    <div className="space-y-5">
      <Link href="/customer/bookings" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="w-4 h-4" /> Back to bookings</Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2"><h1 className="text-[24px] font-bold text-slate-900">{b.property}</h1><StatusPill tone={bookingStatusTone(b.status === "Upcoming" ? "Confirmed" : b.status)}>Confirmed</StatusPill></div>
        <p className="text-[12.5px] text-slate-400 mt-1 flex items-center gap-1.5">Booking ID: {b.ref} <button onClick={() => toast("Booking ID copied", "success")}><Copy className="w-3.5 h-3.5" /></button> · Booked on 24 May 2025</p>
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
          {/* Gallery + date card */}
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

          {/* Property & host */}
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
              <button onClick={() => toast("Opening host profile…", "info")} className="mt-2 text-[12px] font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5">View host profile</button>
            </Card>
          </div>

          {/* Guest / check-in / rules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card title="Guest details" icon={Users}>
              <p className="text-[12.5px] font-semibold text-slate-800 flex items-center gap-1.5">Sarah Johnson <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></p>
              <p className="text-[11.5px] text-slate-400">sarah.johnson@email.com</p>
              <p className="text-[11.5px] text-slate-400">+44 7700 900123</p>
              <button onClick={() => toast("Manage guests — coming soon", "info")} className="mt-2 text-[12px] font-semibold text-blue-600">Manage guests</button>
            </Card>
            <Card title="Check-in instructions" icon={KeyRound}>
              <Tiny l="Check-in time" r="From 15:00 on 24 May" />
              <Tiny l="Key collection" r="Keypad — code sent 1 day before" />
              <Tiny l="Parking" r="1 free space on premises" />
              <Link href="#" className="mt-1 inline-block text-[12px] font-semibold text-blue-600">View full instructions →</Link>
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
              <Link href="#" className="mt-2 inline-block text-[12px] font-semibold text-blue-600">View all amenities →</Link>
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
              <Tiny l="Subtotal (4 nights)" r="£880.00" />
              <Tiny l="Cleaning fee" r="£60.00" />
              <Tiny l="Service fee" r="£54.40" />
              <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100"><span className="text-[12.5px] font-semibold text-slate-700">Total paid</span><span className="text-[13px] font-bold text-slate-900">£994.40</span></div>
              <Link href="/customer/payments" className="mt-1 inline-block text-[12px] font-semibold text-blue-600">View payment breakdown →</Link>
            </Card>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[12.5px] text-slate-600">This booking is protected by Propvora's Guest Protection. <Link href="/customer/help" className="font-semibold text-emerald-700">Learn more about our protection</Link></p>
          </div>
        </div>

        {/* Right rail */}
        <aside className="space-y-5 sticky top-[84px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <button onClick={() => toast(`Messaging ${b.host}…`, "info")} className="w-full inline-flex items-center justify-center gap-2 bg-[#0D1B2A] text-white rounded-xl py-2.5 text-[13px] font-semibold"><MessageSquare className="w-4 h-4" /> Message host</button>
            <RailBtn icon={KeyRound} onClick={() => toast("Check-in details — coming soon", "info")}>Check-in details</RailBtn>
            <RailBtn icon={Download} onClick={() => toast("Downloading receipt…", "info")}>Download receipt</RailBtn>
            <RailBtn icon={PencilLine} onClick={() => toast("Edit booking — coming soon", "info")}>View / edit booking</RailBtn>
            <button onClick={() => toast("Cancellation flow — coming soon", "info")} className="w-full inline-flex items-center justify-center gap-2 border border-rose-200 text-rose-600 rounded-xl py-2.5 text-[13px] font-semibold hover:bg-rose-50"><Flag className="w-4 h-4" /> Cancel booking</button>
            <p className="text-[11px] text-rose-500 text-center">Free cancellation until 20 May 2025</p>
            <Link href={`/customer/bookings/${b.id}/dispute`} className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 rounded-xl py-2.5 text-[13px] font-semibold hover:bg-slate-50"><Shield className="w-4 h-4" /> Open dispute</Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3"><h3 className="text-[13px] font-bold text-slate-900">Booking activity</h3><button className="text-[11.5px] font-semibold text-blue-600">View all</button></div>
            <ol className="space-y-2.5">
              <Act tone="emerald" title="Booking confirmed" sub="Your booking has been confirmed" when="24 May · 10:24" />
              <Act tone="amber" title="Payment successful" sub="£994.40 paid in full" when="24 May · 10:24" />
              <Act tone="blue" title="Host accepted" sub="James accepted your booking" when="24 May · 10:27" />
              <Act tone="violet" title="Check-in instructions sent" sub="Details are now available" when="23 May · 09:12" last />
            </ol>
            <button onClick={() => toast("Full timeline — coming soon", "info")} className="mt-3 w-full border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50">View full timeline</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[13px] font-bold text-slate-900">Need help?</h3>
            <p className="text-[11.5px] text-slate-400 mb-2">We're here 24/7</p>
            <NeedLink icon={HelpCircle} title="Visit our Help Centre" sub="Find answers to common questions" href="/customer/help" />
            <NeedLink icon={LifeBuoy} title="Contact support" sub="We typically reply in under 5 minutes" href="/customer/help" />
            <NeedLink icon={Phone} title="Emergency assistance" sub="For urgent matters during your stay" href="/customer/help" />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* helpers */
function Card({ title, icon: Icon, children }: { title: string; icon: typeof MapPin; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"><p className="text-[12.5px] font-bold text-slate-900 mb-2.5 flex items-center gap-1.5"><Icon className="w-4 h-4 text-slate-400" /> {title}</p>{children}</div>
}
function DateRow({ icon: Icon, label, value, sub }: { icon: typeof Calendar; label: string; value: string; sub?: string }) {
  return <div className="flex items-start gap-2.5"><Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /><div><p className="text-[10.5px] text-slate-400">{label}</p><p className="text-[12.5px] font-semibold text-slate-800">{value}{sub && <span className="text-slate-400 font-normal"> {sub}</span>}</p></div></div>
}
function Tiny({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[11.5px] py-0.5"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium text-right">{r}</span></div>
}
function RailBtn({ icon: Icon, children, onClick }: { icon: typeof Download; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"><Icon className="w-4 h-4" /> {children}</button>
}
const ACT_TONE: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", amber: "bg-amber-100 text-amber-600", blue: "bg-blue-100 text-blue-600", violet: "bg-violet-100 text-violet-600" }
function Act({ tone, title, sub, when, last }: { tone: string; title: string; sub: string; when: string; last?: boolean }) {
  return (
    <li className="relative flex gap-2.5">
      {!last && <span className="absolute left-[11px] top-6 bottom-[-10px] w-px bg-slate-100" />}
      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10", ACT_TONE[tone])}><CheckCircle2 className="w-3 h-3" /></span>
      <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-semibold text-slate-800">{title}</p><p className="text-[10px] text-slate-400 shrink-0">{when}</p></div><p className="text-[11px] text-slate-500">{sub}</p></div>
    </li>
  )
}
function NeedLink({ icon: Icon, title, sub, href }: { icon: typeof HelpCircle; title: string; sub: string; href: string }) {
  return <Link href={href} className="flex items-center gap-2.5 py-2 group"><span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0"><Icon className="w-4 h-4" /></span><div className="flex-1 min-w-0"><p className="text-[12px] font-semibold text-slate-800">{title}</p><p className="text-[10.5px] text-slate-500 truncate">{sub}</p></div><ChevronRight className="w-4 h-4 text-slate-300 shrink-0" /></Link>
}
