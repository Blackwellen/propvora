import Link from "next/link"
import { Share2, CheckCircle2, ArrowRight, UserPlus, Wallet, LineChart } from "lucide-react"

const bullets = [
  "Two enrolment doors — join externally or from inside your workspace",
  "One transparent cash-commission ledger for every referral",
  "Track clicks, sign-ups and conversions in real time",
  "Clear, plain-English affiliate terms",
]

const steps = [
  { icon: UserPlus, title: "Enrol", desc: "Join the programme and get your referral link." },
  { icon: LineChart, title: "Refer", desc: "Share Propvora and track every click and sign-up." },
  { icon: Wallet, title: "Earn", desc: "Commission accrues to a single cash ledger." },
]

export default function AffiliateSection() {
  return (
    <section id="affiliate" className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-pink-200">
              <Share2 className="h-3.5 w-3.5" />
              Affiliate Programme
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Earn by introducing{" "}
              <span className="text-pink-600">Propvora</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Refer other operators and agencies and earn cash commission tracked through a single,
              transparent ledger. Enrol from outside or from inside your workspace.
            </p>
            <ul className="space-y-3 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/affiliate-programme"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              >
                Explore the programme
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/affiliate-programme/terms"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm transition-colors"
              >
                Affiliate terms
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div
                  key={s.title}
                  className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-pink-400">
                        Step {i + 1}
                      </span>
                      <h3 className="text-[15px] font-bold text-slate-900">{s.title}</h3>
                    </div>
                    <p className="text-[13.5px] text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
