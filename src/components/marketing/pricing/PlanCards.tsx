import Link from "next/link"
import {
  CheckCircle2,
  X,
  Building2,
  Brain,
  Users,
  Headphones,
  Store,
  Share2,
  Download,
  Phone,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getPlans, gbp, type PlanTier } from "@/lib/billing/plans"
import type { BillingCycle } from "./PricingToggle"

// Canonical tiers + prices come straight from src/lib/billing/plans.ts (which
// reads catalog.generated.json). No prices are duplicated/invented here.
const canonicalPlans = getPlans()

// Per-tier display copy + feature checklist for the cards. Limits/prices come
// from the canonical plan def; this only adds marketing checklist rows.
const PLAN_CARD: Record<
  PlanTier,
  {
    cta: string
    ctaHref: string
    badge?: string
    extras: { label: string; included: boolean; icon?: typeof Building2 }[]
  }
> = {
  starter: {
    cta: "Start free trial",
    ctaHref: "/register",
    extras: [
      { label: "Portfolio, Work, Contacts, Money, Calendar", included: true },
      { label: "Compliance & rent tracking", included: true },
      { label: "Email support", included: true, icon: Headphones },
      { label: "Advanced reports", included: false, icon: Download },
      { label: "AI Copilot", included: false, icon: Brain },
      { label: "Automations", included: false, icon: Activity },
      { label: "Portals & accounting", included: false, icon: Store },
      { label: "White-label branding", included: false, icon: Share2 },
    ],
  },
  operator: {
    cta: "Start free trial",
    ctaHref: "/register",
    badge: "Most Popular",
    extras: [
      { label: "Everything in Starter", included: true },
      { label: "Advanced reports", included: true, icon: Download },
      { label: "Booking management", included: true, icon: Building2 },
      { label: "Work & PPM", included: true },
      { label: "Priority email support", included: true, icon: Headphones },
      { label: "AI Copilot", included: false, icon: Brain },
      { label: "Automations", included: false, icon: Activity },
      { label: "White-label branding", included: false, icon: Share2 },
    ],
  },
  scale: {
    cta: "Start free trial",
    ctaHref: "/register",
    extras: [
      { label: "Everything in Operator", included: true },
      { label: "AI Copilot", included: true, icon: Brain },
      { label: "Direct booking pages", included: true, icon: Building2 },
      { label: "Portals & accounting", included: true, icon: Store },
      { label: "Canvas Lite automations", included: true },
      { label: "Phone & email support", included: true, icon: Phone },
    ],
  },
  pro_agency: {
    cta: "Start free trial",
    ctaHref: "/register",
    extras: [
      { label: "Everything in Scale", included: true },
      { label: "Multi-landlord / client workspaces", included: true, icon: Users },
      { label: "Owner portals", included: true, icon: Store },
      { label: "Supplier procurement rules", included: true },
      { label: "White-label ready", included: true, icon: Share2 },
      { label: "Priority phone support", included: true, icon: Phone },
    ],
  },
  enterprise: {
    cta: "Contact sales",
    ctaHref: "/contact",
    extras: [
      { label: "Everything in Pro / Agency", included: true },
      { label: "SSO / SAML", included: true },
      { label: "Custom country packs & API limits", included: true },
      { label: "Data residency review", included: true },
      { label: "Dedicated onboarding & SLA", included: true, icon: Headphones },
    ],
  },
}

interface Props {
  billing: BillingCycle
}

export default function PlanCards({ billing }: Props) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start">
          {canonicalPlans.map((plan) => {
            const card = PLAN_CARD[plan.tier]
            const monthly = plan.monthlyAmount // minor units or null
            const annual = plan.annualAmount
            const isCustom = monthly == null
            const annualPerMonth = annual != null ? annual / 12 : null
            const priceMinor = billing === "monthly" ? monthly : annualPerMonth
            const features = [
              {
                label:
                  plan.features.properties === "Unlimited"
                    ? "Unlimited properties"
                    : `Up to ${plan.features.properties} properties`,
                included: true,
                icon: Building2,
              },
              {
                label:
                  plan.features.teamSeats === "Unlimited"
                    ? "Unlimited team seats"
                    : `${plan.features.teamSeats} team seat${plan.features.teamSeats === 1 ? "" : "s"}`,
                included: true,
                icon: Users,
              },
              ...card.extras,
            ]
            return (
              <div
                key={plan.tier}
                className={cn(
                  "relative rounded-2xl border overflow-hidden h-full",
                  plan.popular
                    ? "border-blue-500 shadow-2xl shadow-blue-600/15 ring-2 ring-blue-500"
                    : "border-slate-200 shadow-sm"
                )}
              >
                {card.badge && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold text-center py-1.5 tracking-wider uppercase">
                    {card.badge}
                  </div>
                )}

                <div className={cn("p-6", card.badge && "pt-10")}>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                    <p className="text-slate-500 text-xs leading-relaxed">{plan.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-2">
                    {isCustom ? (
                      <span className="text-3xl font-bold text-slate-900">Custom</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-slate-900">
                          {gbp(priceMinor ?? 0)}
                        </span>
                        <span className="text-slate-500 text-sm">/month</span>
                      </>
                    )}
                  </div>
                  {!isCustom && billing === "annual" && annual != null ? (
                    <p className="text-emerald-600 text-xs font-medium mb-5">
                      Billed annually · {gbp(annual)}/year
                    </p>
                  ) : (
                    <div className="mb-5" />
                  )}

                  <Link
                    href={card.ctaHref}
                    className={cn(
                      "block w-full text-center py-3 px-6 rounded-xl text-sm font-bold transition-all mb-6",
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    )}
                  >
                    {card.cta}
                  </Link>

                  <div className="space-y-2.5">
                    {features.map((f) => (
                      <div key={f.label} className="flex items-start gap-2.5">
                        {f.included ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={cn(
                            "text-xs",
                            f.included ? "text-slate-700" : "text-slate-400"
                          )}
                        >
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          All plans include a 7-day free trial · No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  )
}
