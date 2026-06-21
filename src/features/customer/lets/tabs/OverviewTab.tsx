"use client"

import Link from "next/link"
import {
  Search, CalendarCheck, FileText, Tag, Key, Calendar, FolderOpen, Wallet, ArrowRight,
  ShieldCheck, CreditCard, Headset, Star, CheckCircle2, MessageSquare, Upload, ChevronRight,
  Home, Gift,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../../components/toast"

/** TODO(supabase): replace with live customer_let_* queries via RLS. */

const JOURNEY = [
  { n: 1, label: "Searching", sub: "Browse available lets", icon: Search, state: "current" },
  { n: 2, label: "Book viewing", sub: "Schedule a visit", icon: Calendar, state: "todo" },
  { n: 3, label: "Submit application", sub: "Apply for your home", icon: FileText, state: "todo" },
  { n: 4, label: "Offer sent", sub: "Agree on terms", icon: Tag, state: "todo" },
  { n: 5, label: "Tenancy active", sub: "Move in!", icon: Key, state: "todo" },
]

const KPIS = [
  { id: "viewings", label: "Upcoming viewings", value: "—", sub: "No viewings yet", icon: Calendar, bg: "bg-blue-50 text-blue-600", href: "/customer/lets/journey?tab=viewings" },
  { id: "apps", label: "Active applications", value: "—", sub: "No applications yet", icon: FileText, bg: "bg-violet-50 text-violet-600", href: "/customer/lets/journey?tab=applications" },
  { id: "offers", label: "Open offers", value: "—", sub: "No offers yet", icon: Tag, bg: "bg-amber-50 text-amber-600", href: "/customer/lets/journey?tab=offers" },
  { id: "tenancies", label: "Active tenancies", value: "—", sub: "No tenancy yet", icon: Key, bg: "bg-emerald-50 text-emerald-600", href: "/customer/lets/journey?tab=tenancy" },
  { id: "docs", label: "Pending documents", value: "—", sub: "No documents pending", icon: FolderOpen, bg: "bg-violet-50 text-violet-600", href: "/customer/lets/journey?tab=applications" },
  { id: "rent", label: "Rent due soon", value: "—", sub: "No payment due", icon: Wallet, bg: "bg-amber-50 text-amber-600", href: "/customer/payments" },
]

const TRUST = [
  { icon: ShieldCheck, title: "Verified landlords", sub: "Every landlord is vetted" },
  { icon: CreditCard, title: "Secure payments", sub: "Rent paid safely online" },
  { icon: Headset, title: "Personal support", sub: "Expert lettings team" },
  { icon: Star, title: "Trusted by renters", sub: "4.8★ average rating" },
]

const TONE: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
}

export default function OverviewTab() {
  const { toast } = useCustomerToast()
  return (
    <div className="space-y-5">
      {/* Journey tracker */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0D1B2A] text-white p-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-5">
              <h3 className="text-[15px] font-bold">Your letting journey</h3>
              <span className="text-[11.5px] text-white/60">Track your progress</span>
            </div>
            <ol className="flex items-start justify-between gap-2">
              {JOURNEY.map((s, i) => {
                const Icon = s.icon
                return (
                  <li key={s.n} className="flex-1 flex flex-col items-center text-center relative">
                    {i < JOURNEY.length - 1 && (
                      <span className={cn("absolute top-5 left-1/2 w-full h-0.5", s.state === "done" ? "bg-blue-400" : "bg-white/15")} />
                    )}
                    <span
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0",
                        s.state === "done" ? "bg-blue-500" : s.state === "current" ? "bg-white text-[#0D1B2A]" : "bg-white/10 text-white/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <p className="text-[11.5px] font-semibold mt-2">{s.n}. {s.label}</p>
                    <p className="text-[10.5px] text-white/55">{s.sub}</p>
                  </li>
                )
              })}
            </ol>
          </div>
          {/* No fake property preview — shown only when a real upcoming viewing exists */}
          <div className="relative w-56 shrink-0 rounded-xl overflow-hidden hidden lg:flex items-center justify-center bg-white/10 min-h-[112px]">
            <div className="text-center px-4">
              <Home className="w-8 h-8 text-white/40 mx-auto mb-2" />
              <p className="text-[11px] text-white/60">Your next property will appear here once you book a viewing.</p>
              <Link href="/customer/lets/search" className="mt-2 inline-block bg-white text-[#0D1B2A] rounded-lg px-2.5 py-1 text-[11px] font-semibold">
                Start searching
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}>
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <p className="text-[18px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
              <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
              <p className="text-[10.5px] text-slate-400">{k.sub}</p>
              <Link href={k.href} className="text-[11px] font-semibold text-blue-600 mt-1 inline-block">
                View all →
              </Link>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-5">
          {/* Recommended homes placeholder */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[15px] font-bold text-slate-900">Recommended homes for you</h3>
              <Link href="/customer/lets/search" className="text-[12px] font-semibold text-blue-600">
                Browse all homes →
              </Link>
            </div>
            <p className="text-[12.5px] text-slate-500 mb-3">Curated long-term lets based on your preferences.</p>
            <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-xl border border-slate-100">
              <Home className="w-8 h-8 text-slate-300 mb-3" />
              <p className="text-[13px] font-semibold text-slate-700 mb-1">No recommendations yet</p>
              <p className="text-[12px] text-slate-400 max-w-xs mb-3">
                Complete your profile and set your preferences to get personalised recommendations.
              </p>
              <Link
                href="/customer/lets/search"
                className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-4 py-2 text-[12.5px] font-semibold"
              >
                Search lets <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              {TRUST.map((t) => {
                const Icon = t.icon
                return (
                  <div key={t.title} className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-[11.5px] font-semibold text-slate-800">{t.title}</p>
                      <p className="text-[10.5px] text-slate-400">{t.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Activity + support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-slate-900">Recent activity</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-7 h-7 text-slate-300 mb-2" />
                <p className="text-[12.5px] font-semibold text-slate-600 mb-0.5">No recent activity yet</p>
                <p className="text-[11.5px] text-slate-400">Your viewings, applications and offers will appear here.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-[14px] font-bold text-slate-900 mb-3">Support &amp; help</h3>
              <ul className="space-y-1">
                {[
                  ["Find a home guide", "Tips for finding the right long-term rental"],
                  ["How applications work", "Understand the process"],
                  ["Tenant rights & responsibilities", "Important information for renters"],
                  ["Renting with pets", "Find pet-friendly lets"],
                ].map(([t, s]) => (
                  <li key={t}>
                    <Link href="/customer/help" className="flex items-center gap-2.5 py-1.5 group">
                      <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800">{t}</p>
                        <p className="text-[10.5px] text-slate-400 truncate">{s}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-2 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-[11.5px] text-slate-500 inline-flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" /> Still need help?
                </span>
                <button
                  onClick={() => toast("Starting chat…", "info")}
                  className="bg-[#0D1B2A] text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                >
                  Start chat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3">Next steps</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarCheck className="w-7 h-7 text-slate-300 mb-2" />
              <p className="text-[12.5px] font-semibold text-slate-600 mb-0.5">Nothing to action yet</p>
              <p className="text-[11.5px] text-slate-400 max-w-[200px]">
                Complete your profile and start searching for your next home.
              </p>
              <Link
                href="/customer/lets/search"
                className="mt-3 inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-slate-700"
              >
                Search lets <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-slate-900">Account summary</h3>
              <Link href="/customer/account-settings" className="text-[12px] font-semibold text-blue-600">
                View profile →
              </Link>
            </div>
            <dl className="space-y-2">
              {[
                ["Full name", "—"],
                ["Email address", "—"],
                ["Phone number", "—"],
                ["Preferred areas", "—"],
                ["Move-in date range", "—"],
                ["Budget", "—"],
                ["Household", "—"],
              ].map(([l, r]) => (
                <div key={l} className="flex items-center justify-between gap-3">
                  <dt className="text-[12px] text-slate-500 shrink-0">{l}</dt>
                  <dd className="text-[12px] font-semibold text-slate-800 text-right truncate">{r}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-semibold text-slate-800">Refer a friend</p>
                <p className="text-[11px] text-slate-400">Earn £100 when they move in</p>
              </div>
            </div>
            <button
              onClick={() => toast("Referral link copied", "success")}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-slate-700 shrink-0"
            >
              Invite friends
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
