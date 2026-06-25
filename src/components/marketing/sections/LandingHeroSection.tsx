import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import PremiumProductImage from "../PremiumProductImage"

export default function LandingHeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#f7faff] px-4 pb-20 pt-36 sm:px-6 lg:pb-28 lg:pt-44">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(124,58,237,0.12),transparent_28%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center text-center">
        <h1 className="max-w-5xl text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#06122f] sm:text-6xl lg:text-[78px]">
          Run every property operation with clarity.
        </h1>
        <p className="mt-7 max-w-3xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">
          Propvora connects portfolio management, tenancies, work, compliance, money, planning and communication in one operational workspace.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex h-13 items-center gap-2 rounded-xl bg-blue-600 px-7 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/features" className="inline-flex h-13 items-center rounded-xl border border-slate-300 bg-white px-7 font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700">
            Explore the platform
          </Link>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
          {["7-day trial", "No credit card required", "Cancel anytime"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />{item}
            </span>
          ))}
        </div>
        <div className="relative mx-auto mt-14 max-w-[1220px] lg:mt-20">
          <div className="absolute -left-5 top-[18%] z-10 hidden w-56 rounded-2xl border border-blue-100 bg-white/95 p-4 text-left shadow-[0_20px_55px_rgba(37,99,235,0.16)] backdrop-blur lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Compliance watch</p>
            <p className="mt-1 text-sm font-bold text-slate-900">Renewals surfaced early</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Evidence, owners and due dates stay connected.</p>
          </div>
          <div className="absolute -right-5 bottom-[14%] z-10 hidden w-60 rounded-2xl border border-violet-100 bg-white/95 p-4 text-left shadow-[0_20px_55px_rgba(76,29,149,0.14)] backdrop-blur lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Review-first Copilot</p>
            <p className="mt-1 text-sm font-bold text-slate-900">Drafted. Never sent blindly.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">You approve every material action.</p>
          </div>
          <PremiumProductImage label="Operations overview" src="/images/marketing/product/enriched/01-home.png" alt="Propvora property operations home dashboard using illustrative demo data" priority />
        </div>
      </div>
    </section>
  )
}
