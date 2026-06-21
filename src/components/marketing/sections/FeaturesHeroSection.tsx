import Link from "next/link"
import { ArrowRight } from "lucide-react"
import PremiumProductImage from "../PremiumProductImage"

export default function FeaturesHeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#f7faff] px-4 pb-16 pt-36 sm:px-6 lg:pb-20 lg:pt-44">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(124,58,237,0.12),transparent_28%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Propvora platform</p>
        <h1 className="mt-5 max-w-5xl text-balance text-5xl font-black leading-[1.02] tracking-[-0.055em] text-[#06122f] sm:text-6xl lg:text-7xl">One workspace for the full property operation.</h1>
        <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">Nine modules, one connected workspace. Explore the real product surfaces used by property operators every day.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-7 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/register" className="inline-flex h-12 items-center rounded-xl border border-slate-300 bg-white px-7 font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700">
            See the walkthrough
          </Link>
        </div>
        <div className="relative mx-auto mt-14 max-w-[1220px] lg:mt-20">
          <PremiumProductImage label="Operations overview" src="/images/marketing/product/enriched/01-home.png" alt="Propvora property operations home dashboard using illustrative demo data" priority />
        </div>
      </div>
    </section>
  )
}
