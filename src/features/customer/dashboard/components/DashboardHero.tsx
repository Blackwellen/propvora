"use client"

import { MapPin, Calendar, Users, Search } from "lucide-react"
import { useCustomerToast } from "../../components/toast"

interface Props {
  firstName: string
  where: string
  onWhereChange: (v: string) => void
  onSearch: () => void
}

function SearchSeg({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 flex-1 min-w-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-700">{label}</p>
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return <span className="hidden sm:block w-px self-stretch my-2 bg-slate-100" />
}

export default function DashboardHero({ firstName, where, onWhereChange, onSearch }: Props) {
  const { toast } = useCustomerToast()

  return (
    <section className="relative overflow-hidden rounded-3xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/property-types/holiday.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/55 to-slate-900/20" />
      <div className="relative px-6 sm:px-10 py-10 sm:py-12">
        <h1 className="text-white text-[28px] sm:text-[32px] font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
        <p className="text-white/85 text-[14.5px] mt-2 max-w-md">
          Discover incredible places to stay and unforgettable experiences, all in one place.
        </p>

        <div className="mt-6 bg-white rounded-2xl shadow-[0_18px_50px_rgba(15,23,42,0.18)] p-2 flex flex-col sm:flex-row items-stretch gap-1 max-w-3xl">
          <SearchSeg icon={MapPin} label="Where to?">
            <input
              value={where}
              onChange={(e) => onWhereChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="Search destinations"
              aria-label="Search destinations"
            className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </SearchSeg>
          <Divider />
          <SearchSeg icon={Calendar} label="Check in">
            <button onClick={() => toast("Date picker — coming soon", "info")} className="text-[13px] text-slate-400 text-left w-full">Add dates</button>
          </SearchSeg>
          <Divider />
          <SearchSeg icon={Calendar} label="Check out">
            <button onClick={() => toast("Date picker — coming soon", "info")} className="text-[13px] text-slate-400 text-left w-full">Add dates</button>
          </SearchSeg>
          <Divider />
          <SearchSeg icon={Users} label="Guests">
            <button onClick={() => toast("Guest picker — coming soon", "info")} className="text-[13px] text-slate-600 text-left w-full">2 guests</button>
          </SearchSeg>
          <button
            onClick={onSearch}
            aria-label="Search stays"
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#0D1B2A] hover:bg-[#0b1622] text-white rounded-xl px-5 py-3 text-[13.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 focus-visible:ring-offset-2"
          >
            <Search className="w-4 h-4" aria-hidden="true" /> Search stays
          </button>
        </div>
      </div>
    </section>
  )
}
