import type { Metadata } from "next"
import Link from "next/link"
import {
  Building2,
  Wrench,
  ShieldCheck,
  Wallet,
  CalendarDays,
  Brain,
  Users,
  ArrowRight,
  PlayCircle,
} from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"

export const metadata: Metadata = {
  title: "Product Walkthrough",
  description:
    "A step-by-step walkthrough of how Propvora runs your property operations — from setting up your portfolio to compliance, work, money and AI.",
  openGraph: {
    title: "Product Walkthrough | Propvora",
    description:
      "A step-by-step walkthrough of how Propvora runs your property operations.",
    type: "website",
  },
}

const steps = [
  {
    icon: Building2,
    title: "Set up your portfolio",
    body: "Create your workspace, add properties and units, and record tenancies. Choose your operation profile so the app shapes itself around how you actually work — long-term let, HMO, rent-to-rent, serviced accommodation and more.",
  },
  {
    icon: Users,
    title: "Bring in your contacts",
    body: "Add landlords, tenants, suppliers and professionals in one place. Every record links back to the properties and work it relates to, so context is never more than a click away.",
  },
  {
    icon: Wrench,
    title: "Run the work",
    body: "Raise tasks and jobs, assign them, request supplier quotes, and track everything from new to invoiced. Your team and suppliers stay in sync without endless email threads.",
  },
  {
    icon: ShieldCheck,
    title: "Stay compliant",
    body: "Track certificates, inspections and renewals with clear expiry states. Propvora surfaces what's due so nothing important slips past a deadline.",
  },
  {
    icon: Wallet,
    title: "Control the money",
    body: "Record income and expenses, raise invoices, and use the planning engine to model deal economics — gross and net yield, ROI, breakeven and risk — before you commit.",
  },
  {
    icon: CalendarDays,
    title: "Plan your time",
    body: "A connected calendar pulls together rent dates, tenancy events, inspections, viewings and deadlines across the whole portfolio, in the view that suits you.",
  },
  {
    icon: Brain,
    title: "Work with the AI Copilot",
    body: "Ask questions about your portfolio, draft messages and summarise records. The Copilot keeps a human in control — it proposes, you approve.",
  },
]

export default function WalkthroughPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-5 border border-blue-200">
            <PlayCircle className="h-3.5 w-3.5" />
            Product walkthrough
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight tracking-tight">
            See how Propvora runs your operations
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Follow the path most operators take when they move onto Propvora — from first
            property to a fully connected workspace. Every step below maps to a real part of
            the product.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="relative space-y-8">
            {steps.map((step, i) => (
              <li key={step.title} className="relative flex gap-5">
                {/* connector line */}
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[27px] top-14 bottom-[-2rem] w-px bg-slate-200"
                  />
                )}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
                  <step.icon className="h-6 w-6 text-blue-600" />
                  <span className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <div className="pt-1">
                  <h2 className="text-lg font-bold text-slate-900 mb-1.5">{step.title}</h2>
                  <p className="text-slate-600 leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Ready to try it on your own portfolio?
            </h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Create a free workspace and choose to start blank or explore with realistic
              demo data. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-white/70 transition-colors"
              >
                Explore all features
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
