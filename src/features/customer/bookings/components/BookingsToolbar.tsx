"use client"

import { Search, Building2, Map as MapIcon, Calendar, Filter, ArrowUpDown } from "lucide-react"

export type BookingSort = "recent" | "oldest" | "price_desc" | "price_asc"

interface Props {
  checkedCount: number
  showBulk: boolean
  sort: BookingSort
  onSortChange: (s: BookingSort) => void
  search: string
  onSearchChange: (v: string) => void
  onBulkMessage: () => void
  onBulkDownload: () => void
  onBulkCancel: () => void
  onBulkMore: () => void
}

function FilterBtn({ icon: Icon, children }: { icon: typeof Calendar; children: React.ReactNode }) {
  return <button className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50"><Icon className="w-4 h-4 text-slate-400" /> {children}</button>
}
function BulkBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold border ${disabled ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{children}</button>
}

export default function BookingsToolbar({ checkedCount, showBulk, sort, onSortChange, search, onSearchChange, onBulkMessage, onBulkDownload, onBulkCancel, onBulkMore }: Props) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search bookings, property or host" className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[var(--color-brand-100)]" />
        </div>
        <FilterBtn icon={Building2}>All types</FilterBtn>
        <FilterBtn icon={MapIcon}>All locations</FilterBtn>
        <FilterBtn icon={Calendar}>Any dates</FilterBtn>
        <FilterBtn icon={Filter}>More filters</FilterBtn>
        <div className="relative ml-auto inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
          <ArrowUpDown className="w-4 h-4" />
          <select value={sort} onChange={(e) => onSortChange(e.target.value as BookingSort)} className="bg-transparent outline-none cursor-pointer pr-1" aria-label="Sort bookings">
            <option value="recent">Sort: Most recent</option>
            <option value="oldest">Sort: Oldest first</option>
            <option value="price_desc">Sort: Price high–low</option>
            <option value="price_asc">Sort: Price low–high</option>
          </select>
        </div>
      </div>

      {showBulk && (
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-slate-500 font-medium">{checkedCount} selected</span>
          <BulkBtn disabled={!checkedCount} onClick={onBulkMessage}>Message</BulkBtn>
          <BulkBtn disabled={!checkedCount} onClick={onBulkDownload}>Download</BulkBtn>
          <BulkBtn disabled={!checkedCount} onClick={onBulkCancel}>Cancel booking</BulkBtn>
          <BulkBtn onClick={onBulkMore}>More actions</BulkBtn>
        </div>
      )}
    </>
  )
}
