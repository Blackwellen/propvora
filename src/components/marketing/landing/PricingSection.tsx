import Link from "next/link"
import { CheckCircle2, ArrowRight, Zap, Star } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "£29",
    period: "/mo",
    tagline: "For operators getting started",
    highlight: false,
    cta: "Start free trial",
    ctaHref: "/register",
    features: [
      "Up to 5 properties",
      "Portfolio, Work, Contacts & Calendar",
      "1 team member",
      "2 GB document storage",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "£79",
    period: "/mo",
    tagline: "For growing property operators",
    highlight: true,
    badge: "Most Popular",
    cta: "Start free trial",
    ctaHref: "/register",
    features: [
      "Up to 50 properties",
      "Full planning engine (all profiles)",
      "AI Copilot (100 queries/mo)",
      "5 team members + supplier portal",
      "Priority email support",
    ],
  },
  {
    name: "Business",
    price: "£149",
    period: "/mo",
    tagline: "For serious operators and teams",
    highlight: false,
    cta: "Contact sales",
    ctaHref: "/contact",
    features: [
      "Unlimited properties",
      "Full planning engine + all modules",
      "AI Copilot (500 queries/mo)",
      "20 team members + advanced exports",
      "Priority phone & email support",
    ],
  },
]

export default function PricingSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-1.5 mb-5">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[13px] font-semibold text-blue-700">
              7-day free trial · No credit card required
            </span>
          </div>
          <h2 className="text-[40px] sm:text-[48px] font-bold text-[#06122F] leading-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-[15px] text-slate-500 max-w-lg mx-auto leading-relaxed">
            One price. Everything included for your plan. No hidden fees, no per-property charges,
            no nasty surprises.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl overflow-hidden transition-all ${
                plan.highlight
                  ? "border-2 border-blue-500 shadow-2xl shadow-blue-600/15"
                  : "border border-slate-200 shadow-sm hover:shadow-md"
              } bg-white`}
            >
              {/* Most Popular badge */}
              {plan.badge && (
                <div className="bg-blue-600 text-white text-[12px] font-bold text-center py-2 tracking-wider uppercase flex items-center justify-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {plan.badge}
                </div>
              )}

              <div className={`flex flex-col flex-1 p-7 ${!plan.badge ? "pt-7" : ""}`}>
                {/* Plan name & tagline */}
                <div className="mb-5">
                  <h3 className="text-[20px] font-bold text-[#06122F] mb-1">{plan.name}</h3>
                  <p className="text-[13px] text-slate-400">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-0.5 mb-6">
                  <span className="text-[44px] font-black text-[#06122F] leading-none">
                    {plan.price}
                  </span>
                  <span className="text-[14px] text-slate-400 self-end mb-1">{plan.period}</span>
                </div>

                {/* CTA */}
                <Link
                  href={plan.ctaHref}
                  className={`block w-full text-center py-3 px-6 rounded-xl text-[14px] font-bold transition-all mb-7 ${
                    plan.highlight
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:-translate-y-0.5"
                      : "bg-[#06122F] hover:bg-slate-800 text-white hover:-translate-y-0.5"
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[13.5px] text-slate-600 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Trust line */}
        <p className="text-center text-[13.5px] text-slate-400 mb-10">
          All plans include a 7-day free trial &middot; No credit card required &middot; Cancel anytime
        </p>

        {/* See full pricing CTA */}
        <div className="flex justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-[15px] text-white transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
              boxShadow: "0 8px 32px rgba(37,99,235,0.3)",
            }}
          >
            See full pricing &amp; compare plans
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
