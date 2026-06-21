"use client"

import Link from "next/link"
import { CalendarCheck, FileText, Tag, Key, Map } from "lucide-react"
import LetsSearchBar from "./components/LetsSearchBar"
import LetsKpiStrip from "./components/LetsKpiStrip"
import LetsResultsGrid from "./components/LetsResultsGrid"

const JOURNEY_LINKS = [
  { label: "My letting journey", href: "/customer/lets/journey", icon: Map },
  { label: "My viewings", href: "/customer/lets/journey?tab=viewings", icon: CalendarCheck },
  { label: "My applications", href: "/customer/lets/journey?tab=applications", icon: FileText },
  { label: "My offers", href: "/customer/lets/journey?tab=offers", icon: Tag },
  { label: "My tenancy", href: "/customer/lets/journey?tab=tenancy", icon: Key },
]

export default function LetsSearch() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900">Let&apos;s find your next home</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            Discover quality long-term lets from verified landlords and agents.
          </p>
        </div>
      </div>

      {/* Secondary nav — quick links to letting journey tabs */}
      <nav aria-label="Letting journey" className="flex items-center gap-2 overflow-x-auto pb-1">
        {JOURNEY_LINKS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 shadow-sm whitespace-nowrap hover:bg-slate-50 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <LetsSearchBar />
      <LetsKpiStrip />
      <LetsResultsGrid />
    </div>
  )
}
