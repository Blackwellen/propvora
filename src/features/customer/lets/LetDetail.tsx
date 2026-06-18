"use client"

import Link from "next/link"
import {
  ArrowLeft, Heart, BedDouble, Bath, Maximize, Sofa, Calendar, Star, ShieldCheck, Check,
  MapPin, Train, GraduationCap, FileText, Wallet, CheckCircle2, Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill } from "../components/StatusPill"
import type { LetProperty } from "../data/lets"
import { propertyImages as IMG } from "../data/mock"

const AMENITIES = ["Lift access", "Concierge", "Gym", "Parking", "Balcony", "Dishwasher", "Washer/dryer", "Pet friendly"]
const SPECS = [["Council tax band", "C"], ["EPC rating", "B"], ["Floor area", "78 m²"], ["Deposit", "5 weeks' rent"], ["Min. tenancy", "12 months"], ["Bills included", "No"]]

export default function LetDetail({ p }: { p: LetProperty }) {
  const { toast } = useCustomerToast()
  const gallery = [p.image, IMG.cityLoft, IMG.riverside, IMG.greenQuarter, IMG.dockside]

  return (
    <div className="space-y-5">
      <Link href="/customer/lets/search" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="w-4 h-4" /> Back to search</Link>

      {/* Gallery */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[320px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[0]} alt="" className="col-span-2 row-span-2 w-full h-full object-cover rounded-2xl" />
        {gallery.slice(1, 5).map((g, i) => (
          <div key={i} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={g} alt="" className="w-full h-full object-cover rounded-2xl" />{i === 3 && <button onClick={() => toast("Gallery — coming soon", "info")} className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white text-[13px] font-semibold">View all photos</button>}</div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div><h1 className="text-[22px] font-bold text-slate-900">{p.title}</h1><p className="text-[13px] text-slate-500 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {p.location}</p></div>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-3 py-1.5"><ShieldCheck className="w-4 h-4" /> Verified landlord</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <Spec icon={BedDouble} label={`${p.beds} bedrooms`} /><Spec icon={Bath} label={`${p.baths} bathrooms`} /><Spec icon={Maximize} label="78 m²" /><Spec icon={Sofa} label={p.furnished ? "Furnished" : "Unfurnished"} /><Spec icon={Calendar} label={p.available} />
            </div>
          </div>

          <Card title="About this property"><p className="text-[12.5px] text-slate-600 leading-relaxed">A stunning {p.beds}-bedroom apartment in the heart of {p.location.split(",")[0]}, offering bright open-plan living, floor-to-ceiling windows and premium finishes throughout. Moments from transport links, shops and restaurants. Managed by a verified, professional landlord with secure online rent payments.</p></Card>

          <Card title="Property details">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{SPECS.map(([l, r]) => <div key={l}><p className="text-[10.5px] text-slate-400">{l}</p><p className="text-[12.5px] font-semibold text-slate-800">{r}</p></div>)}</div>
          </Card>

          <Card title="Amenities">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{AMENITIES.map((a) => <p key={a} className="text-[12px] text-slate-600 flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> {a}</p>)}</div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card title="Transport links"><Mini icon={Train} label="New Bailey tram" sub="3 min walk" /><Mini icon={Train} label="Salford Central rail" sub="6 min walk" /><Mini icon={Train} label="Deansgate" sub="12 min walk" /></Card>
            <Card title="Nearby schools"><Mini icon={GraduationCap} label="St John's Primary" sub="Outstanding · 0.4 mi" /><Mini icon={GraduationCap} label="Manchester Academy" sub="Good · 0.9 mi" /></Card>
          </div>

          <Card title="Documents">
            {[["EPC certificate", "PDF · 0.4 MB"], ["Floorplan", "PDF · 0.8 MB"], ["How to Rent guide", "PDF · 1.1 MB"]].map(([n, s]) => <button key={n} onClick={() => toast(`Downloading ${n}…`, "info")} className="w-full flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0 text-left"><FileText className="w-4 h-4 text-slate-400" /><span className="flex-1"><span className="block text-[12px] font-medium text-slate-700">{n}</span><span className="block text-[10px] text-slate-400">{s}</span></span></button>)}
          </Card>
        </div>

        {/* Right rail */}
        <aside className="space-y-5 sticky top-[84px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-end justify-between"><div><p className="text-[24px] font-bold text-slate-900">{formatPence(p.rentPence, "GBP")}<span className="text-[13px] text-slate-400 font-medium">/month</span></p><StatusPill tone="emerald">{p.available}</StatusPill></div></div>
            <div className="mt-3 space-y-2">
              <Link href={`/customer/lets/viewings/VW-2042`} className="block text-center bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold">Book a viewing</Link>
              <Link href={`/customer/lets/applications/AP-7841/wizard`} className="block text-center border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50">Start application</Link>
              <Link href={`/customer/lets/offers/OFF-250418-22`} className="block text-center border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50">Make an offer</Link>
              <button onClick={() => toast("Saved to favourites", "success")} className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Heart className="w-4 h-4" /> Save to favourites</button>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
              <Row l="Monthly rent" r={formatPence(p.rentPence, "GBP")} />
              <Row l="Holding deposit" r={formatPence(Math.round(p.rentPence * 0.23), "GBP")} />
              <Row l="Security deposit" r={formatPence(Math.round(p.rentPence * 1.15), "GBP")} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2">Your journey to a new home</p>
            <ol className="space-y-2">
              <J done text="Browse & shortlist" /><J done text="Book a viewing" /><J text="Apply & reference" /><J text="Make an offer" /><J text="Sign & move in" />
            </ol>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-2 flex items-center gap-1.5"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Reviews from tenants</p>
            <p className="text-[12px] text-slate-600">"Brilliant building and a responsive landlord — everything was sorted within hours."</p>
            <p className="text-[10.5px] text-slate-400 mt-1">— Previous tenant · 4.9/5</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"><p className="text-[14px] font-bold text-slate-900 mb-3">{title}</p>{children}</div>
}
function Spec({ icon: Icon, label }: { icon: typeof BedDouble; label: string }) {
  return <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-700"><Icon className="w-4 h-4 text-slate-400" /> {label}</span>
}
function Mini({ icon: Icon, label, sub }: { icon: typeof Train; label: string; sub: string }) {
  return <div className="flex items-center gap-2.5 py-1.5"><span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span><div><p className="text-[12px] font-semibold text-slate-800">{label}</p><p className="text-[10.5px] text-slate-400">{sub}</p></div></div>
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[12px]"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium">{r}</span></div>
}
function J({ text, done }: { text: string; done?: boolean }) {
  return <li className="flex items-center gap-2">{done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 shrink-0" />}<span className="text-[11.5px] text-slate-600">{text}</span></li>
}
