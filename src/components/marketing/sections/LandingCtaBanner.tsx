import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getServerLocale, t } from "@/lib/i18n"

export default async function LandingCtaBanner() {
  const locale = await getServerLocale()
  const tr = (k: string) => t(locale, `marketing.${k}`)
  return (
    <section className="bg-white px-4 py-24 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[36px] bg-gradient-to-br from-[#07152d] to-[#102e63] px-6 py-14 text-center text-white shadow-2xl sm:px-12 lg:py-20">
        <h2 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">{tr("ctaBannerTitle")}</h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{tr("ctaBannerBody")}</p>
        <Link href="/register" className="mt-8 inline-flex h-13 items-center gap-2 rounded-xl bg-white px-7 font-bold text-[#07152d] hover:bg-blue-50">
          {tr("ctaPrimary")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
