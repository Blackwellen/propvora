import Link from "next/link"
import { ArrowRight, FileCheck2, CalendarClock, FolderCheck } from "lucide-react"
import PremiumProductImage from "../PremiumProductImage"
import { getServerLocale, t } from "@/lib/i18n"

// The compliance "wedge" — Propvora's sharpest UK differentiator. Sells the
// requirement → deadline/task → evidence chain that competitors don't have,
// grounded in the real compliance screenshot. Copy lives under the `marketing`
// namespace; UK certificate names are proper nouns kept literal.
const CERTS = [
  "Gas Safety (CP12)",
  "EICR",
  "EPC",
  "HMO licence",
  "Legionella",
  "Fire safety",
  "PAT",
  "RRA 2026",
]

export default async function LandingComplianceSection() {
  const locale = await getServerLocale()
  const tr = (k: string) => t(locale, `marketing.${k}`)

  const chain = [
    { icon: FileCheck2, title: tr("compChain1"), sub: tr("compChain1Sub") },
    { icon: CalendarClock, title: tr("compChain2"), sub: tr("compChain2Sub") },
    { icon: FolderCheck, title: tr("compChain3"), sub: tr("compChain3Sub") },
  ]

  return (
    <section className="bg-[#f7faff] px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">{tr("compEyebrow")}</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-[#06122f] sm:text-5xl">{tr("compTitle")}</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">{tr("compBody")}</p>
        </div>

        {/* Requirement → Deadline → Evidence chain */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {chain.map(({ icon: Icon, title, sub }, i) => (
            <div key={title} className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
              <p className="mt-2 leading-7 text-slate-600">{sub}</p>
              {i < chain.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-blue-300 md:block" />
              )}
            </div>
          ))}
        </div>

        {/* Certificate-type chips */}
        <div className="mt-10 flex flex-wrap gap-2.5">
          {CERTS.map((cert) => (
            <span
              key={cert}
              className="rounded-full border border-blue-100 bg-blue-50/70 px-3.5 py-1.5 text-sm font-semibold text-blue-700"
            >
              {cert}
            </span>
          ))}
        </div>

        {/* Product proof */}
        <div className="mt-12">
          <PremiumProductImage
            label="Compliance control centre"
            src="/images/marketing/product/enriched/12-compliance.png"
            alt="Propvora compliance control centre tracking UK certificate renewals using illustrative demo data"
          />
        </div>

        <Link
          href="/features"
          className="mt-8 inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700"
        >
          {tr("compLink")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
