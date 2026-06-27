import { SlidersHorizontal } from "lucide-react"

export default function StayCompareHeader() {
  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--brand)]">
        <SlidersHorizontal className="w-3.5 h-3.5" /> Compare
      </div>
      <h1 className="mt-3 text-[22px] sm:text-[26px] font-bold tracking-tight text-[#0B1B3F]">Compare stays</h1>
      <p className="mt-1.5 max-w-2xl text-[13.5px] text-slate-600">
        See price, rating, cancellation policy, capacity and type side by side before you book.
      </p>
    </>
  )
}
