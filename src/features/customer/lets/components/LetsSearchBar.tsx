"use client"

import { BedDouble, Calendar, MapPin, PawPrint, Search, SlidersHorizontal, Sofa, Wallet } from "lucide-react"
import { useCustomerToast } from "../../components/toast"

function Seg({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 flex-1 min-w-[150px]">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold text-slate-500">{label}</p>
        {children}
      </div>
    </div>
  )
}

function Chip({
  icon: Icon,
  children,
}: {
  icon?: typeof PawPrint
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-[12px] font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
    >
      {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      {children}
    </button>
  )
}

export default function LetsSearchBar() {
  const { toast } = useCustomerToast()
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
      <div className="flex flex-wrap items-end gap-2">
        <Seg icon={MapPin} label="Location">
          <input
            defaultValue="Manchester, M1"
            aria-label="Search location"
            className="w-full bg-transparent text-[13px] text-slate-800 outline-none"
          />
        </Seg>
        <Seg icon={Calendar} label="Move-in date">
          <button onClick={() => toast("Date picker — coming soon", "info")} className="text-[13px] text-slate-500 text-left w-full">
            Anytime
          </button>
        </Seg>
        <Seg icon={Wallet} label="Monthly budget">
          <button onClick={() => toast("Budget — coming soon", "info")} className="text-[13px] text-slate-500 text-left w-full">
            £800 – £2,500
          </button>
        </Seg>
        <Seg icon={BedDouble} label="Bedrooms">
          <button onClick={() => toast("Bedrooms — coming soon", "info")} className="text-[13px] text-slate-500 text-left w-full">
            Any
          </button>
        </Seg>
        <Seg icon={Sofa} label="Furnishing">
          <button onClick={() => toast("Furnishing — coming soon", "info")} className="text-[13px] text-slate-500 text-left w-full">
            Any
          </button>
        </Seg>
        <button
          onClick={() => toast("Searching lets…", "info")}
          aria-label="Search lets"
          className="inline-flex items-center justify-center gap-2 bg-[#0D1B2A] text-white rounded-xl px-5 py-2.5 text-[13px] font-semibold shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 focus-visible:ring-offset-2"
        >
          <Search className="w-4 h-4" aria-hidden="true" /> Search lets
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
        <Chip icon={PawPrint}>Pet friendly</Chip>
        <Chip>Bills included</Chip>
        <Chip>Parking</Chip>
        <Chip>Garden</Chip>
        <button
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          aria-label="More filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" /> More filters
        </button>
      </div>
    </div>
  )
}
