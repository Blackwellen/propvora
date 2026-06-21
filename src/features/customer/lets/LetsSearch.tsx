"use client"

import LetsSearchBar from "./components/LetsSearchBar"
import LetsKpiStrip from "./components/LetsKpiStrip"
import LetsResultsGrid from "./components/LetsResultsGrid"

export default function LetsSearch() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold text-slate-900">Let&apos;s find your next home</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">
          Discover quality long-term lets from verified landlords and agents.
        </p>
      </div>

      <LetsSearchBar />
      <LetsKpiStrip />
      <LetsResultsGrid />
    </div>
  )
}
