import type { Metadata } from "next"
import Link from "next/link"
import {
  Building2,
  ShieldCheck,
  LineChart,
  Target,
  Compass,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"

export const metadata: Metadata = {
  title: "About Propvora",
  description:
    "Propvora is the property operations, compliance and profit-control platform for serious property operators. Learn what we build and why.",
  openGraph: {
    title: "About Propvora",
    description:
      "Propvora is the property operations, compliance and profit-control platform for serious property operators.",
    type: "website",
  },
}

const principles = [
  {
    icon: Compass,
    title: "Operations first",
    body: "Propvora is built for the day-to-day reality of running property: tenancies, work orders, suppliers, compliance and money — not portfolio vanity metrics.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance you can trust",
    body: "Certificates, inspections and renewals are tracked with clear expiry states, so nothing important slips past a deadline.",
  },
  {
    icon: LineChart,
    title: "Profit control",
    body: "Income, expenses, invoices and planning models sit alongside your operations, so you always know where margin is made or lost.",
  },
  {
    icon: Target,
    title: "Grounded, not hyped",
    body: "We describe what the product actually does today. No fabricated stats, no invented testimonials — just tools that do the work.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-5 border border-blue-200">
            <Building2 className="h-3.5 w-3.5" />
            About Propvora
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight tracking-tight">
            The operating system for property operators
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Propvora replaces scattered spreadsheets and disconnected tools with one
            connected workspace for property operations, compliance and profit control —
            built for landlords, managers and operators who run real portfolios.
          </p>
        </div>
      </section>

      {/* What we are */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">What Propvora is</h2>
          <p className="text-slate-600 leading-relaxed">
            Propvora is a property operations, compliance and profit-control platform. It
            brings your properties, units, tenancies, contacts, work, suppliers, calendar,
            documents and money into a single, premium workspace — with a planning engine
            that models deals across every operation profile and an AI Copilot that helps
            you move faster while keeping a human in control.
          </p>
          <p className="text-slate-600 leading-relaxed">
            We are deliberately not a property investment marketplace or a place to buy and
            sell deals. Propvora is the tooling you use to <span className="font-semibold text-slate-800">run</span>{" "}
            the property you already operate, profitably and compliantly.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">
            What we believe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {principles.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <p.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Who it&apos;s for</h2>
          <ul className="space-y-3">
            {[
              "Landlords running long-term lets who want compliance and cashflow in one place",
              "HMO and co-living operators managing rooms, licensing and bills",
              "Rent-to-rent and serviced-accommodation operators tracking margin per unit",
              "Property managers handling work orders, suppliers and multiple owners",
              "Mixed portfolios that span several operation models at once",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#0D1B2A] px-8 py-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              See Propvora with your own operations
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Start a free trial, or take the guided walkthrough to see how it fits your
              portfolio before you commit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/walkthrough"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors border border-white/15"
              >
                Take the walkthrough
              </Link>
            </div>
          </div>
        </div>
      </section>
      </main>

      <PublicFooter />
    </div>
  )
}
