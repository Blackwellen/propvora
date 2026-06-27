import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"
import PremiumProductImage from "../PremiumProductImage"
import { getServerLocale, t } from "@/lib/i18n"

export default async function FeaturesHeroSection() {
  const locale = await getServerLocale()
  const tr = (k: string) => t(locale, `marketing.${k}`)
  return (
    <section className="relative overflow-hidden bg-[#f7faff] px-4 pb-16 pt-36 sm:px-6 lg:pb-20 lg:pt-44">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(124,58,237,0.12),transparent_28%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">{tr("featHeroEyebrow")}</p>
        <h1 className="mt-5 max-w-5xl text-balance text-5xl font-black leading-[1.02] tracking-[-0.055em] text-[#06122f] sm:text-6xl lg:text-7xl">{tr("featHeroTitle")}</h1>
        <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">{tr("featHeroSubtitle")}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-7 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
            {tr("featHeroCta")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/walkthrough" className="inline-flex h-12 items-center rounded-xl border border-slate-300 bg-white px-7 font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700">
            {tr("featHeroWalkthrough")}
          </Link>
        </div>

        {/* Trust strip — mirrors the landing hero for cross-page consistency */}
        <div className="mt-10 w-full max-w-3xl">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {tr("trustEyebrow")}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5">
            {[tr("trust1"), tr("trust2"), tr("trust3"), tr("trust4")].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-[1220px] lg:mt-20">
          <PremiumProductImage label="Operations overview" src="/images/marketing/product/enriched/01-home.png" alt="Propvora property operations home dashboard using illustrative demo data" priority />
        </div>
      </div>
    </section>
  )
}
