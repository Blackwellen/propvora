import Link from "next/link"
import { Heart, Search } from "lucide-react"

export default function StayWishlistHero() {
  return (
    <div className="rounded-2xl border border-[#E2EAF6] bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-semibold text-rose-600">
          <Heart className="w-3.5 h-3.5" /> Saved stays
        </div>
        <h1 className="mt-3 text-[22px] font-bold tracking-tight text-[#0B1B3F]">Keep your favourites</h1>
        <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-slate-600">
          Sign in to your Propvora account to save stays and pick up where you left off. Your saved stays stay
          private to you.
        </p>
      </div>
      <div className="flex gap-2.5 shrink-0">
        <Link
          href="/customer/saved"
          className="h-11 px-4 rounded-xl bg-[#1D4ED8] text-white text-[13.5px] font-semibold inline-flex items-center hover:bg-[#1A45BE]"
        >
          Go to saved
        </Link>
        <Link
          href="/stay/search"
          className="h-11 px-4 rounded-xl border border-[#D6E0F0] text-slate-600 text-[13.5px] font-semibold inline-flex items-center gap-1.5 hover:border-slate-300"
        >
          <Search className="w-4 h-4" /> Browse stays
        </Link>
      </div>
    </div>
  )
}
