"use client"

import Link from "next/link"
import {
  Search, FileText, Tag, Key, Calendar, FolderOpen, Wallet,
  ShieldCheck, CreditCard, Headset, Star, CheckCircle2, MessageSquare, Upload, ChevronRight,
  Gift, Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../../components/toast"
import type { PublicLongTermRental } from "@/lib/public-marketplace/types"

const JOURNEY = [
  { n: 1, label: "Searching", sub: "Explore properties", icon: Search, state: "todo" },
  { n: 2, label: "Book viewing", sub: "Schedule a visit", icon: Calendar, state: "todo" },
  { n: 3, label: "Apply", sub: "Submit application", icon: FileText, state: "todo" },
  { n: 4, label: "Receive offer", sub: "Await landlord response", icon: Tag, state: "todo" },
  { n: 5, label: "Tenancy active", sub: "You're all set!", icon: Key, state: "todo" },
]
const KPIS = [
  { id: "viewings", label: "Upcoming viewings", value: "—", sub: "No viewings yet", icon: Calendar, bg: "bg-blue-50 text-blue-600", href: "/customer/lets?tab=viewings" },
  { id: "apps", label: "Active applications", value: "—", sub: "No applications yet", icon: FileText, bg: "bg-violet-50 text-violet-600", href: "/customer/lets?tab=applications" },
  { id: "offers", label: "Open offers", value: "—", sub: "No offers yet", icon: Tag, bg: "bg-amber-50 text-amber-600", href: "/customer/lets?tab=offers" },
  { id: "tenancies", label: "Active tenancies", value: "—", sub: "No active tenancy", icon: Key, bg: "bg-emerald-50 text-emerald-600", href: "/customer/lets?tab=tenancy" },
  { id: "docs", label: "Pending documents", value: "—", sub: "No pending documents", icon: FolderOpen, bg: "bg-violet-50 text-violet-600", href: "/customer/lets?tab=applications" },
  { id: "rent", label: "Rent due soon", value: "—", sub: "No rent due", icon: Wallet, bg: "bg-amber-50 text-amber-600", href: "/customer/payments" },
]
const TRUST = [
  { icon: ShieldCheck, title: "Verified landlords", sub: "Every landlord is vetted" },
  { icon: CreditCard, title: "Secure payments", sub: "Rent paid safely online" },
  { icon: Headset, title: "Personal support", sub: "Expert lettings team" },
  { icon: Star, title: "Trusted by renters", sub: "4.8★ average rating" },
]
const TONE: Record<string, string> = { emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600" }

export default function OverviewTab() {
  const { toast } = useCustomerToast()
  const rentals: PublicLongTermRental[] = []

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
          {/* Recommended homes — honest empty state */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[15px] font-bold text-slate-900">Recommended homes for you</h3>
              <Link href="/customer/lets" className="text-[12px] font-semibold text-blue-600">Browse all lets →</Link>
            </div>
            <p className="text-[12.5px] text-slate-500 mb-3">Curated long-term lets based on your preferences.</p>
            {rentals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Home className="w-6 h-6" /></span>
                <p className="text-[14px] font-semibold text-slate-700">No lets found</p>
                <p className="text-[13px] text-slate-400 max-w-xs">Browse available long-term rentals to find your next home.</p>
                <Link href="/customer/lets" className="mt-1 bg-[#0D1B2A] text-white rounded-xl px-4 py-2 text-[13px] font-semibold">Browse available long-term rentals</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rentals.map(() => null)}
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              {TRUST.map((t) => { const Icon = t.icon; return <div key={t.title} className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span><div><p className="text-[11.5px] font-semibold text-slate-800">{t.title}</p><p className="text-[10.5px] text-slate-400">{t.sub}</p></div></div> })}
            </div>
          </div>

          {/* activity + support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Recent activity</h3></div>
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-slate-200" />
                <p className="text-[13px] text-slate-400">No activity yet. Start browsing to find your next home.</p>
              </div>
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
            <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
              <Upload className="w-7 h-7 text-slate-200" />
              <p className="text-[12.5px] text-slate-400">Complete your profile to get started.</p>
              <Link href="/customer/account-settings" className="text-[12px] font-semibold text-blue-600 hover:underline">Complete profile →</Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Account summary</h3><Link href="/customer/account-settings" className="text-[12px] font-semibold text-blue-600">View profile →</Link></div>
            <p className="text-[12.5px] text-slate-400">Complete your profile to personalise your letting experience.</p>
            <Link href="/customer/account-settings" className="mt-3 inline-block text-[12px] font-semibold text-blue-600 hover:underline">Set up profile →</Link>
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
