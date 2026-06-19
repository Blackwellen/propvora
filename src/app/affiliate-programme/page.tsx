import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Percent,
  Clock,
  Wallet,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import PremiumProductImage from "@/components/marketing/PremiumProductImage"
import { AFFILIATE_LEVELS, formatPence } from "@/lib/affiliate/levels"

export const metadata: Metadata = {
  title: "Affiliate Programme — Earn with Propvora",
  description:
    "Refer property operators to Propvora and earn 10% recurring commission for 6 months. Built for consultants, agents, educators, accountants and partners.",
  openGraph: {
    title: "Propvora Affiliate Programme",
    description:
      "Earn 10% recurring commission for 6 months by referring property operators to Propvora.",
    type: "website",
  },
}

const AUDIENCE = [
  "Property consultants",
  "Letting agents",
  "Property managers",
  "Landlord educators",
  "Property content creators",
  "Supplier networks",
  "Accountants & bookkeepers",
  "Compliance consultants",
  "Software & service partners",
  "Existing Propvora customers",
]

const PERKS = [
  { icon: Percent, title: "10% recurring", sub: "On eligible subscription revenue, for 6 months per referral." },
  { icon: Clock, title: "60-day cookie", sub: "Last-click attribution within a 60-day window." },
  { icon: Wallet, title: "£50 payout threshold", sub: "Withdraw once cleared commission reaches £50." },
  { icon: Users, title: "Real dashboard", sub: "Live links, referrals, earnings and payout status." },
]

const STEPS = [
  { n: 1, title: "Apply", body: "Tell us who you are and how you'll promote Propvora. We review every application." },
  { n: 2, title: "Share your link", body: "Once approved you get a unique referral link, code and brand assets." },
  { n: 3, title: "Earn on paying customers", body: "When a referral subscribes and pays, commission accrues — cleared after a 30-day cooling-off period." },
]

const NOT_ALLOWED = [
  "Self-referrals or referring your own workspaces",
  "Spam, fake accounts or misleading claims",
  "Brand bidding on “Propvora” unless explicitly approved",
  "Coupon abuse or guaranteed-earnings claims",
  "Pretending to be Propvora or Blackwellen",
]

export default function AffiliateProgrammePage() {
  return (
    <div className="min-h-screen bg-[#F6FAFF] flex flex-col">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none flex-1">
        {/* Hero */}
        <section className="px-6 pt-28 pb-12 max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            <TrendingUp className="w-3.5 h-3.5" /> Partner Programme
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-[#0D1B2A]">
            Earn by referring property operators to Propvora
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Refer landlords, property managers, suppliers, consultants and property teams who need a
            cleaner way to manage portfolios, work, money, compliance, legal readiness, documents and
            operations. Earn <strong className="text-[#2563EB]">10% recurring commission for 6 months</strong>{" "}
            on every paying customer you bring.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/affiliate-programme/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              Apply to become a partner <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/affiliate-programme/earnings"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
            >
              View earnings examples
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            No fake income claims. Commission is earned only on valid, approved, paying customers.
          </p>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-12">
          <div className="grid items-center gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Partner workspace</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0D1B2A]">Track links, valid referrals and cleared earnings.</h2>
              <p className="mt-4 leading-7 text-slate-600">The affiliate dashboard separates clicks, conversions, pending commission and cleared payouts so programme performance is transparent.</p>
              <ul className="mt-6 space-y-3 text-sm font-semibold text-slate-700">
                {["Referral links and attribution", "Referral status and commission trail", "Payout eligibility and history"].map(item => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</li>)}
              </ul>
            </div>
            <PremiumProductImage label="Affiliate overview" src="/images/marketing/product/enriched/19-affiliate.png" alt="Propvora affiliate dashboard using illustrative demo data" />
          </div>
        </section>

        {/* Who it's for */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0D1B2A] text-center">Who the programme is for</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {AUDIENCE.map((a) => (
              <span
                key={a}
                className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                {a}
              </span>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0D1B2A] text-center">How referrals work</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl bg-white border border-slate-200 p-6">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partner levels */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0D1B2A] text-center">Partner levels</h2>
          <p className="mt-2 text-sm text-slate-500 text-center">
            Levels are based on active, valid, paying referred customers — never clicks or sign-ups.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2">Level</th>
                  <th className="px-4 py-2">Active referrals</th>
                  <th className="px-4 py-2">Commission</th>
                  <th className="px-4 py-2">Benefits</th>
                </tr>
              </thead>
              <tbody>
                {AFFILIATE_LEVELS.map((lvl) => (
                  <tr key={lvl.band} className="bg-white">
                    <td className="px-4 py-3 rounded-l-xl border-y border-l border-slate-200 font-semibold text-slate-900">
                      {lvl.name}
                    </td>
                    <td className="px-4 py-3 border-y border-slate-200 text-slate-600">
                      {lvl.minReferrals}
                      {lvl.band < AFFILIATE_LEVELS.length ? "+" : "+"}
                    </td>
                    <td className="px-4 py-3 border-y border-slate-200">
                      <span className="font-semibold text-[#2563EB]">
                        {Math.round(lvl.rate * 100)}% / {lvl.durationMonths}mo
                      </span>
                    </td>
                    <td className="px-4 py-3 rounded-r-xl border-y border-r border-slate-200 text-slate-500">
                      {lvl.blurb}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400 text-center">
            Strategic Partner (50+) terms are approved individually. Minimum payout {formatPence(5000)};
            commission clears after a 30-day cooling-off period.
          </p>
        </section>

        {/* What you get */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.title} className="rounded-2xl bg-white border border-slate-200 p-5">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{p.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* What's not allowed */}
        <section className="px-6 py-12 max-w-5xl mx-auto">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#0D1B2A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-400" /> What is not allowed
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {NOT_ALLOWED.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-slate-600">
                  <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" /> {r}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              Commission reverses on refund, chargeback, cancellation or failed payment. Abuse leads to
              suspension. Full rules in the{" "}
              <Link href="/affiliate-programme/terms" className="text-[#2563EB] hover:underline">
                Affiliate Terms
              </Link>
              .
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#0D1B2A]">Ready to partner with Propvora?</h2>
          <p className="mt-3 text-slate-600">
            Apply in a couple of minutes. We review every application and approve genuine partners.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/affiliate-programme/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Apply to become a partner <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/affiliate-programme/faq"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
            >
              Read the FAQ
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Already a Propvora customer? You can enrol in one click from Settings.
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
