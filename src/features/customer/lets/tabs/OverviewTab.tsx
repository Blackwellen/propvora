"use client"

import Link from "next/link"
import {
  Search, CalendarCheck, FileText, Tag, Key, Calendar, FolderOpen, Wallet, ArrowRight,
  ShieldCheck, CreditCard, Headset, Star, CheckCircle2, MessageSquare, Upload, ChevronRight,
  Home, Gift,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../../components/toast"
import { CustomerPropertyCard } from "../../components/PropertyCard"
import { recommendedLets } from "../../data/lets"
import { propertyImages as IMG } from "../../data/mock"

const JOURNEY = [
  { n: 1, label: "Searching", sub: "Explore properties", icon: Search, state: "done" },
  { n: 2, label: "Booked viewing", sub: "You have 1 upcoming", icon: Calendar, state: "done" },
  { n: 3, label: "Application under review", sub: "2 applications in progress", icon: FileText, state: "current" },
  { n: 4, label: "Offer sent", sub: "1 offer awaiting response", icon: Tag, state: "todo" },
  { n: 5, label: "Tenancy active", sub: "You're all set!", icon: Key, state: "todo" },
]
const KPIS = [
  { id: "viewings", label: "Upcoming viewings", value: "1", sub: "Next: 24 May, 11:00", icon: Calendar, bg: "bg-blue-50 text-blue-600", href: "/customer/lets?tab=viewings" },
  { id: "apps", label: "Active applications", value: "2", sub: "1 under review", icon: FileText, bg: "bg-violet-50 text-violet-600", href: "/customer/lets?tab=applications" },
  { id: "offers", label: "Open offers", value: "1", sub: "Awaiting response", icon: Tag, bg: "bg-amber-50 text-amber-600", href: "/customer/lets?tab=offers" },
  { id: "tenancies", label: "Active tenancies", value: "1", sub: "Since 1 Apr 2025", icon: Key, bg: "bg-emerald-50 text-emerald-600", href: "/customer/lets?tab=tenancy" },
  { id: "docs", label: "Pending documents", value: "2", sub: "Require your action", icon: FolderOpen, bg: "bg-violet-50 text-violet-600", href: "/customer/lets?tab=applications" },
  { id: "rent", label: "Rent due soon", value: "£1,450", sub: "Due on 1 Jun 2025", icon: Wallet, bg: "bg-amber-50 text-amber-600", href: "/customer/payments" },
]
const TRUST = [
  { icon: ShieldCheck, title: "Verified landlords", sub: "Every landlord is vetted" },
  { icon: CreditCard, title: "Secure payments", sub: "Rent paid safely online" },
  { icon: Headset, title: "Personal support", sub: "Expert lettings team" },
  { icon: Star, title: "Trusted by renters", sub: "4.8★ average rating" },
]
const ACTIVITY = [
  { icon: CheckCircle2, tone: "emerald", title: "Your application is under review", sub: "Riverside Apartment, M1", when: "Today, 10:24" },
  { icon: Calendar, tone: "blue", title: "Viewing confirmed", sub: "Riverside Apartment, M1 – 24 May 2025 at 11:00", when: "Yesterday, 16:45" },
  { icon: Tag, tone: "amber", title: "Offer sent by landlord", sub: "City View Flat, M50", when: "Yesterday, 14:12" },
  { icon: Upload, tone: "violet", title: "Document uploaded", sub: "Right to Rent – Passport", when: "12 May 2025" },
]
const NEXT_STEPS = [
  { icon: FileText, tone: "emerald", title: "Complete application", sub: "Riverside Apartment, M1", cta: "Continue", href: "/customer/lets/applications/AP-7841/wizard" },
  { icon: Upload, tone: "violet", title: "Upload documents", sub: "2 documents pending", cta: "Upload", href: "/customer/lets?tab=applications" },
  { icon: Calendar, tone: "amber", title: "Confirm viewing", sub: "24 May 2025 at 11:00", cta: "View details", href: "/customer/lets/viewings/VW-2051" },
  { icon: FolderOpen, tone: "blue", title: "Review tenancy pack", sub: "Riverside Apartment, M1", cta: "Review", href: "/customer/lets/tenancies/TN-55421" },
]
const TONE: Record<string, string> = { emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600" }

export default function OverviewTab() {
  const { toast } = useCustomerToast()
  return (
    <div className="space-y-5">
      {/* Journey tracker */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0D1B2A] text-white p-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-5"><h3 className="text-[15px] font-bold">Your letting journey</h3><span className="text-[11.5px] text-white/60">Track your progress</span></div>
            <ol className="flex items-start justify-between gap-2">
              {JOURNEY.map((s, i) => { const Icon = s.icon; return (
                <li key={s.n} className="flex-1 flex flex-col items-center text-center relative">
                  {i < JOURNEY.length - 1 && <span className={cn("absolute top-5 left-1/2 w-full h-0.5", s.state === "done" ? "bg-blue-400" : "bg-white/15")} />}
                  <span className={cn("w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0", s.state === "done" ? "bg-blue-500" : s.state === "current" ? "bg-white text-[#0D1B2A]" : "bg-white/10 text-white/50")}><Icon className="w-4 h-4" /></span>
                  <p className="text-[11.5px] font-semibold mt-2">{s.n}. {s.label}</p>
                  <p className="text-[10.5px] text-white/55">{s.sub}</p>
                </li>
              )})}
            </ol>
          </div>
          <div className="relative w-56 shrink-0 rounded-xl overflow-hidden hidden lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.riverside} alt="" className="w-full h-28 object-cover" />
            <div className="absolute inset-0 bg-black/35 p-3 flex flex-col justify-between">
              <p className="text-[10.5px] text-white/80">Next up: Riverside Apartment, M1<br />Viewing on 24 May 2025 at 11:00</p>
              <Link href="/customer/lets/viewings/VW-2051" className="bg-white text-[#0D1B2A] rounded-lg px-2.5 py-1 text-[11px] font-semibold w-fit">View details</Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
            <p className="text-[18px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
            <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
            <p className="text-[10.5px] text-slate-400">{k.sub}</p>
            <Link href={k.href} className="text-[11px] font-semibold text-blue-600 mt-1 inline-block">View all →</Link>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-5">
          {/* Recommended homes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1"><h3 className="text-[15px] font-bold text-slate-900">Recommended homes for you</h3><Link href="/customer/lets/search" className="text-[12px] font-semibold text-blue-600">View all homes →</Link></div>
            <p className="text-[12.5px] text-slate-500 mb-3">Curated long-term lets based on your preferences.</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedLets.map((l) => <CustomerPropertyCard key={l.id} p={{ id: l.id, title: l.title, location: l.location, image: l.image, pricePence: l.rentPence, pricePer: "month", badge: l.available, href: `/customer/lets/properties/${l.id}` }} onToggleSave={() => toast("Saved to favourites", "success")} />)}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              {TRUST.map((t) => { const Icon = t.icon; return <div key={t.title} className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span><div><p className="text-[11.5px] font-semibold text-slate-800">{t.title}</p><p className="text-[10.5px] text-slate-400">{t.sub}</p></div></div> })}
            </div>
          </div>

          {/* activity + support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Recent activity</h3><Link href="#" className="text-[12px] font-semibold text-blue-600">View all activity →</Link></div>
              <ul className="space-y-1">
                {ACTIVITY.map((a, i) => { const Icon = a.icon; return (
                  <li key={i} className="flex items-center gap-3 py-1.5"><span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", TONE[a.tone])}><Icon className="w-4 h-4" /></span><div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold text-slate-800">{a.title}</p><p className="text-[11px] text-slate-400 truncate">{a.sub}</p></div><span className="text-[10.5px] text-slate-400 shrink-0">{a.when}</span></li>
                )})}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-[14px] font-bold text-slate-900 mb-3">Support &amp; help</h3>
              <ul className="space-y-1">
                {[["Find a home guide", "Tips for finding the right long-term rental"], ["How applications work", "Understand the process"], ["Tenant rights & responsibilities", "Important information for renters"], ["Renting with pets", "Find pet-friendly lets"]].map(([t, s]) => <li key={t}><Link href="/customer/help" className="flex items-center gap-2.5 py-1.5 group"><span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0"><FileText className="w-4 h-4" /></span><div className="flex-1 min-w-0"><p className="text-[12px] font-semibold text-slate-800">{t}</p><p className="text-[10.5px] text-slate-400 truncate">{s}</p></div><ChevronRight className="w-4 h-4 text-slate-300" /></Link></li>)}
              </ul>
              <div className="mt-2 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between"><span className="text-[11.5px] text-slate-500 inline-flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-slate-400" /> Still need help?</span><button onClick={() => toast("Starting chat…", "info")} className="bg-[#0D1B2A] text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold">Start chat</button></div>
            </div>
          </div>
        </div>

        {/* right rail */}
        <aside className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3">Next steps</h3>
            <ul className="space-y-2">
              {NEXT_STEPS.map((s) => { const Icon = s.icon; return (
                <li key={s.title} className="flex items-center gap-3"><span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", TONE[s.tone])}><Icon className="w-4 h-4" /></span><div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold text-slate-800">{s.title}</p><p className="text-[11px] text-slate-400 truncate">{s.sub}</p></div><Link href={s.href} className="text-[11.5px] font-semibold text-blue-600 border border-slate-200 rounded-lg px-2.5 py-1 shrink-0">{s.cta}</Link></li>
              )})}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Account summary</h3><Link href="/customer/account-settings" className="text-[12px] font-semibold text-blue-600">View profile →</Link></div>
            <dl className="space-y-2">
              {[["Full name", "Sarah Johnson"], ["Email address", "sarah.johnson@email.com"], ["Phone number", "+44 7700 900123"], ["Preferred areas", "Manchester, Salford, MediaCity"], ["Move-in date range", "May – July 2025"], ["Budget", "£1,000 – £2,000 / month"], ["Household", "1 adult"]].map(([l, r]) => <div key={l} className="flex items-center justify-between gap-3"><dt className="text-[12px] text-slate-500 shrink-0">{l}</dt><dd className="text-[12px] font-semibold text-slate-800 text-right truncate">{r}</dd></div>)}
            </dl>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5"><span className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Gift className="w-4 h-4" /></span><div><p className="text-[12.5px] font-semibold text-slate-800">Refer a friend</p><p className="text-[11px] text-slate-400">Earn £100 when they move in</p></div></div>
            <button onClick={() => toast("Referral link copied", "success")} className="border border-slate-200 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-slate-700 shrink-0">Invite friends</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
