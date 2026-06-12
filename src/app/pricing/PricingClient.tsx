"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  X,
  ArrowRight,
  Zap,
  Building2,
  Brain,
  Users,
  HardDrive,
  Headphones,
  Store,
  Share2,
  Download,
  Phone,
} from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import { cn } from "@/lib/utils"

type BillingCycle = "monthly" | "annual"

const monthlyPrices = { starter: 29, pro: 79, business: 149 }
const annualPrices = { starter: 24, pro: 66, business: 124 }

const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    tagline: "For operators getting started",
    monthly: monthlyPrices.starter,
    annual: annualPrices.starter,
    highlight: false,
    cta: "Start free trial",
    ctaHref: "/register",
    features: [
      { label: "Up to 5 properties", included: true, icon: Building2 },
      { label: "Portfolio, Work, Contacts, Money, Calendar", included: true },
      { label: "Basic planning (3 profiles)", included: true },
      { label: "1 team member", included: true, icon: Users },
      { label: "5GB document storage", included: true, icon: HardDrive },
      { label: "Email support", included: true, icon: Headphones },
      { label: "Full planning engine (13 profiles)", included: false },
      { label: "AI Copilot", included: false, icon: Brain },
      { label: "Supplier portal", included: false, icon: Store },
      { label: "Affiliate dashboard", included: false, icon: Share2 },
      { label: "Advanced exports", included: false, icon: Download },
      { label: "Priority phone support", included: false, icon: Phone },
    ],
  },
  {
    key: "pro" as const,
    name: "Pro",
    tagline: "For growing property operators",
    monthly: monthlyPrices.pro,
    annual: annualPrices.pro,
    highlight: true,
    badge: "Most Popular",
    cta: "Start free trial",
    ctaHref: "/register",
    features: [
      { label: "Up to 50 properties", included: true, icon: Building2 },
      { label: "Portfolio, Work, Contacts, Money, Calendar", included: true },
      { label: "Full planning engine (all 13 profiles)", included: true },
      { label: "5 team members", included: true, icon: Users },
      { label: "25GB document storage", included: true, icon: HardDrive },
      { label: "Priority email support", included: true, icon: Headphones },
      { label: "AI Copilot (100 queries/month)", included: true, icon: Brain },
      { label: "Supplier portal", included: true, icon: Store },
      { label: "Affiliate dashboard", included: false, icon: Share2 },
      { label: "Advanced exports", included: false, icon: Download },
      { label: "Priority phone support", included: false, icon: Phone },
      { label: "White-label branding", included: false },
    ],
  },
  {
    key: "business" as const,
    name: "Business",
    tagline: "For serious operators and teams",
    monthly: monthlyPrices.business,
    annual: annualPrices.business,
    highlight: false,
    cta: "Contact sales",
    ctaHref: "/contact",
    features: [
      { label: "Unlimited properties", included: true, icon: Building2 },
      { label: "Portfolio, Work, Contacts, Money, Calendar", included: true },
      { label: "Full planning engine (all 13 profiles)", included: true },
      { label: "20 team members", included: true, icon: Users },
      { label: "100GB document storage", included: true, icon: HardDrive },
      { label: "Priority support (email + phone)", included: true, icon: Headphones },
      { label: "AI Copilot (500 queries/month)", included: true, icon: Brain },
      { label: "Supplier portal", included: true, icon: Store },
      { label: "Affiliate dashboard", included: true, icon: Share2 },
      { label: "Advanced exports", included: true, icon: Download },
      { label: "Priority phone support", included: true, icon: Phone },
      { label: "White-label branding (add-on)", included: true },
    ],
  },
]

const addons = [
  {
    name: "Extra AI Query Pack",
    description: "100 additional AI Copilot queries per month",
    price: "£15/mo",
    note: "Pro & Business",
  },
  {
    name: "Storage Expansion",
    description: "50GB additional document and media storage",
    price: "£10/mo",
    note: "All plans",
  },
  {
    name: "Extra Team Members",
    description: "Add 5 additional workspace members",
    price: "£20/mo",
    note: "All plans",
  },
  {
    name: "White-label Branding",
    description: "Custom logo and colour scheme in supplier portal",
    price: "£99/mo",
    note: "Business only",
  },
  {
    name: "Advanced API Access",
    description: "REST API access with full read/write endpoints",
    price: "£49/mo",
    note: "Business only",
  },
]

const faqs = [
  {
    q: "Can I change plans at any time?",
    a: "Yes. You can upgrade or downgrade your plan at any point from your account settings. Upgrades take effect immediately, and you'll be charged a prorated amount for the remainder of the billing period. Downgrades take effect at the next renewal date.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Stripe. All payments are processed securely and your card details are never stored on our servers.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Every plan comes with a 14-day free trial, and no credit card is required to start. You'll have full access to all features on your chosen plan during the trial period.",
  },
  {
    q: "What happens when I cancel?",
    a: "You can cancel your subscription at any time from your account settings. You'll retain full access to your workspace until the end of your current billing period. After that, your workspace moves to read-only mode for 30 days, giving you time to export your data.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're not satisfied within the first 14 days of a paid subscription, contact us and we'll issue a full refund. After 14 days, we don't offer refunds for the current billing period, but you can cancel to prevent future charges.",
  },
  {
    q: "Is my property data secure?",
    a: "Absolutely. All data is encrypted in transit and at rest. We use Supabase with row-level security, and each workspace is fully isolated from others. We are GDPR compliant and registered with the ICO.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export your portfolio data, contacts, financial records and more from your workspace at any time. Business plan users have access to advanced bulk export features.",
  },
]

export default function PricingClient() {
  const [billing, setBilling] = useState<BillingCycle>("monthly")

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-blue-200">
            <Zap className="h-3.5 w-3.5" />
            14-day free trial · No credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-xl mx-auto mb-10">
            One price. Everything included for your plan. No hidden fees, no per-property charges.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                billing === "monthly"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                billing === "annual"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Annual
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-bold",
                  billing === "annual"
                    ? "bg-emerald-400 text-slate-900"
                    : "bg-emerald-100 text-emerald-700"
                )}
              >
                Save 2 months
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => {
              const price = billing === "monthly" ? plan.monthly : plan.annual
              return (
                <div
                  key={plan.key}
                  className={cn(
                    "relative rounded-2xl border overflow-hidden",
                    plan.highlight
                      ? "border-blue-500 shadow-2xl shadow-blue-600/15 ring-2 ring-blue-500"
                      : "border-slate-200 shadow-sm"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold text-center py-1.5 tracking-wider uppercase">
                      {plan.badge}
                    </div>
                  )}

                  <div className={cn("p-8", plan.badge && "pt-12")}>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                      <p className="text-slate-500 text-sm">{plan.tagline}</p>
                    </div>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-5xl font-bold text-slate-900">£{price}</span>
                      <span className="text-slate-500 text-sm">/month</span>
                    </div>
                    {billing === "annual" && (
                      <p className="text-emerald-600 text-sm font-medium mb-6">
                        Billed annually · Save £{(plan.monthly - price) * 12}/year
                      </p>
                    )}
                    {billing === "monthly" && <div className="mb-6" />}

                    <Link
                      href={plan.ctaHref}
                      className={cn(
                        "block w-full text-center py-3 px-6 rounded-xl text-sm font-bold transition-all mb-8",
                        plan.highlight
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      )}
                    >
                      {plan.cta}
                    </Link>

                    <div className="space-y-3">
                      {plan.features.map((f) => (
                        <div key={f.label} className="flex items-start gap-3">
                          {f.included ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={cn(
                              "text-sm",
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
            All plans include a 14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Add-ons & enhancements
            </h2>
            <p className="text-slate-600">
              Extend any plan with optional modules. Add what you need, when you need it.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addons.map((addon) => (
              <div
                key={addon.name}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{addon.name}</h3>
                  <span className="text-blue-600 font-bold text-sm ml-2 flex-shrink-0">{addon.price}</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed mb-2">{addon.description}</p>
                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                  {addon.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            Enterprise
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Need something custom?
          </h2>
          <p className="text-slate-600 mb-8">
            Running a large portfolio, a property management company, or an agency? We offer custom plans with volume pricing, dedicated support, custom integrations, and SLA agreements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-base transition-colors"
            >
              Contact sales
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-xl text-base transition-colors"
            >
              Start free trial instead
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
