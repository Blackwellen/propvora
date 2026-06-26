import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getServerLocale, t } from "@/lib/i18n"

export default async function FeaturesCta() {
  const locale = await getServerLocale()
  const tr = (k: string) => t(locale, `marketing.${k}`)
  return (
    <section className="bg-white px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-[36px] bg-[#07152d] px-8 py-16 text-center text-white sm:px-14">
        <h2 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">{tr("featCtaTitle")}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">{tr("featCtaSubtitle")}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 font-bold text-white hover:bg-blue-500">
            {tr("featCtaTrial")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/walkthrough" className="inline-flex h-13 items-center justify-center rounded-xl border border-white/20 px-7 font-bold hover:bg-white/10">
            {tr("featCtaWalkthrough")}
          </Link>
        </div>
      </div>
    </section>
  )
}
