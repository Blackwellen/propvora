import PremiumProductImage from "../PremiumProductImage"
import { getServerLocale, t } from "@/lib/i18n"

export default async function LandingCopilotSection() {
  const locale = await getServerLocale()
  const tr = (k: string) => t(locale, `marketing.${k}`)
  return (
    <section className="bg-[#f7faff] px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-600">{tr("coEyebrow")}</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">{tr("coTitle")}</h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{tr("coBody")}</p>
        <div className="mt-12 max-w-[1180px]">
          <PremiumProductImage src="/images/marketing/product/enriched/13-copilot-chat.png" alt="Propvora Copilot preparing review-first draft actions using illustrative demo data" />
        </div>
      </div>
    </section>
  )
}
