"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCustomerToast } from "../components/toast"
import { cn } from "@/lib/utils"
import { Headset } from "lucide-react"
import OverviewTab from "./tabs/OverviewTab"
import ViewingsTab from "./tabs/ViewingsTab"
import ApplicationsTab from "./tabs/ApplicationsTab"
import OffersTab from "./tabs/OffersTab"
import TenancyTab from "./tabs/TenancyTab"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "viewings", label: "Viewings" },
  { id: "applications", label: "Applications" },
  { id: "offers", label: "Offers" },
  { id: "tenancy", label: "Tenancy" },
]

export default function LetsClient({ initialTab = "overview" }: { initialTab?: string }) {
  const router = useRouter()
  const { toast } = useCustomerToast()
  const [tab, setTab] = useState(initialTab)

  function changeTab(id: string) {
    setTab(id)
    router.replace(id === "overview" ? "/customer/lets/journey" : `/customer/lets/journey?tab=${id}`, { scroll: false })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900">Lets</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">Manage your long-term rental journey — from viewings and applications to offers and tenancy.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex items-center gap-3 max-w-sm">
          <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Headset className="w-5 h-5" /></span>
          <div className="min-w-0"><p className="text-[12px] font-semibold text-slate-700">Need help finding the right home?</p><p className="text-[11px] text-slate-400">Book a call with our lettings team.</p></div>
          <button onClick={() => toast("Booking consultation…", "info")} className="bg-[#0D1B2A] text-white rounded-xl px-3 py-2 text-[11.5px] font-semibold shrink-0">Book a free consultation</button>
        </div>
      </div>

      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden border-b border-slate-200 pb-2.5">
        <select
          value={tab}
          onChange={(e) => changeTab(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {TABS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => <button key={t.id} onClick={() => changeTab(t.id)} className={cn("px-4 py-2.5 text-[13.5px] font-semibold border-b-2 -mb-px whitespace-nowrap", t.id === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800")}>{t.label}</button>)}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "viewings" && <ViewingsTab />}
      {tab === "applications" && <ApplicationsTab />}
      {tab === "offers" && <OffersTab />}
      {tab === "tenancy" && <TenancyTab />}
    </div>
  )
}
