"use client"

import Link from "next/link"
import { ChevronRight, HelpCircle, LifeBuoy, Flag } from "lucide-react"

interface Props {
  toast: (m: string, k?: "success" | "info" | "warning" | "error") => void
}

function RailLink({ href, icon: Icon, title, sub }: { href: string; icon: typeof HelpCircle; title: string; sub: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 py-2 group">
        <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-[var(--brand-soft)] group-hover:text-[var(--brand)] shrink-0"><Icon className="w-4 h-4" /></span>
        <div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold text-slate-800">{title}</p><p className="text-[11px] text-slate-500 truncate">{sub}</p></div>
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </Link>
    </li>
  )
}

export default function BookingSummaryRail({ toast }: Props) {
  const counts = [
    { l: "Total bookings", v: "8" }, { l: "Upcoming", v: "2" }, { l: "Current lets", v: "1" },
    { l: "Completed", v: "5" }, { l: "Cancelled", v: "0" }, { l: "Total spent", v: "£2,865" },
  ]
  return (
    <aside className="space-y-5 sticky top-[84px]">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Booking summary</h3><Link href="/customer/bookings?view=overview" className="text-[12px] font-semibold text-[var(--brand)]">View all activity</Link></div>
        <ul className="space-y-2.5">
          {counts.map((c) => (
            <li key={c.l} className="flex items-center justify-between"><span className="text-[12.5px] text-slate-500">{c.l}</span><span className="text-[13px] font-bold text-slate-900">{c.v}</span></li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">Need help?</h3>
        <ul className="space-y-2">
          <RailLink href="/customer/help" icon={HelpCircle} title="Visit help centre" sub="Find answers to common questions" />
          <RailLink href="/customer/help" icon={LifeBuoy} title="Contact support" sub="Get personalised assistance" />
          <RailLink href="/customer/bookings/disputes" icon={Flag} title="Manage disputes" sub="View and track your disputes" />
        </ul>
      </div>
      <div className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/property-types/holiday.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0D1B2A]/85" />
        <div className="relative p-4">
          <h3 className="text-white text-[14px] font-bold">Rebook and save</h3>
          <p className="text-white/80 text-[12px] mt-1">Many of your hosts offer returning guest discounts.</p>
          <button onClick={() => toast("Exploring stays…", "info")} className="mt-3 inline-flex items-center gap-1.5 bg-white text-[#0D1B2A] rounded-lg px-3 py-1.5 text-[12.5px] font-semibold">Explore stays <ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </aside>
  )
}
