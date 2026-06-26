import Link from "next/link"
import { ArrowRight } from "lucide-react"
import PremiumProductImage from "../PremiumProductImage"
import { getServerLocale, t } from "@/lib/i18n"

export default async function LandingPortfolioSection() {
  const locale = await getServerLocale()
  const tr = (k: string) => t(locale, `marketing.${k}`)
  return (
    <section className="overflow-hidden bg-[#07152d] px-4 py-24 text-white sm:px-6 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">{tr("pfEyebrow")}</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">{tr("pfTitle")}</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">{tr("pfBody")}</p>
          <Link href="/features" className="mt-8 inline-flex items-center gap-2 font-bold text-sky-300 hover:text-white">{tr("pfLink")} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <PremiumProductImage src="/images/marketing/product/enriched/02-portfolio.png" alt="Propvora portfolio page with illustrative demo properties" />
      </div>
    </section>
  )
}
