"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  Users,
  Building2,
  Palette,
  Sparkles,
  Rocket,
  Landmark,
  MessageCircle,
  PenLine,
  RefreshCw,
  Receipt,
  Code2,
  Bot,
  Brain,
  Zap,
  Calendar,
  Workflow,
  Globe,
  Puzzle,
} from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import PricingHero from "@/components/marketing/pricing/PricingHero"
import PlanCards from "@/components/marketing/pricing/PlanCards"
import FeatureComparisonTable from "@/components/marketing/pricing/FeatureComparisonTable"
import PricingFAQ from "@/components/marketing/pricing/PricingFAQ"
import type { BillingCycle } from "@/components/marketing/pricing/PricingToggle"
import { gbp, type AddonDef } from "@/lib/billing/plans"
import { useT } from "@/components/i18n/LocaleProvider"
import type { LucideIcon } from "lucide-react"

// Per-add-on icon + brand-aligned tint, keyed by the canonical catalogue key.
// Falls back to a neutral puzzle tile for any key without an explicit visual.
type AddonVisual = { icon: LucideIcon; bg: string; fg: string }
const ADDON_VISUAL: Record<string, AddonVisual> = {
  extra_seat: { icon: Users, bg: "#EFF6FF", fg: "#2563EB" },
  extra_props_10: { icon: Building2, bg: "#ECFDF5", fg: "#059669" },
  white_label: { icon: Palette, bg: "#FFF7ED", fg: "#D97706" },
  ai_credits_1k: { icon: Sparkles, bg: "#F5F3FF", fg: "#7C3AED" },
  onboarding: { icon: Rocket, bg: "#EFF6FF", fg: "#2563EB" },
  open_banking: { icon: Landmark, bg: "#ECFDF5", fg: "#059669" },
  whatsapp_business: { icon: MessageCircle, bg: "#ECFDF5", fg: "#16A34A" },
  esignature: { icon: PenLine, bg: "#F5F3FF", fg: "#7C3AED" },
  accounting_sync: { icon: RefreshCw, bg: "#EFF6FF", fg: "#2563EB" },
  mtd_itsa: { icon: Receipt, bg: "#FFF7ED", fg: "#D97706" },
  api_access: { icon: Code2, bg: "#F1F5F9", fg: "#475569" },
  ai_pro: { icon: Bot, bg: "#F5F3FF", fg: "#7C3AED" },
  intelligence_pack_1k: { icon: Brain, bg: "#EFF6FF", fg: "#2563EB" },
  action_pack_1k: { icon: Zap, bg: "#FFF7ED", fg: "#D97706" },
  booking_pages: { icon: Calendar, bg: "#EFF6FF", fg: "#2563EB" },
  automation_pack: { icon: Workflow, bg: "#F5F3FF", fg: "#7C3AED" },
  country_pack_beta: { icon: Globe, bg: "#ECFDF5", fg: "#059669" },
}
const DEFAULT_VISUAL: AddonVisual = { icon: Puzzle, bg: "#F1F5F9", fg: "#475569" }

// Operator add-ons are resolved server-side (release-stage + feature-flag aware)
// and passed in, so roadmap add-ons stay hidden until their flag ships. Prices
// all come from the canonical catalog in src/lib/billing — none invented here.
export default function PricingClient({ addons }: { addons: AddonDef[] }) {
  const operatorAddons = addons
  const [billing, setBilling] = useState<BillingCycle>("monthly")
  const tFn = useT()
  const tr = (k: string) => tFn(`marketing.${k}`)

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <PricingHero billing={billing} onChange={setBilling} />
        <PlanCards billing={billing} />
        <FeatureComparisonTable />

        {/* Add-ons */}
        <section className="py-20 bg-slate-50 border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                {tr("pricingAddonsTitle")}
              </h2>
              <p className="text-slate-600">
                {tr("pricingAddonsSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {operatorAddons.map((addon) => {
                const visual = ADDON_VISUAL[addon.key] ?? DEFAULT_VISUAL
                const Icon = visual.icon
                return (
                  <div
                    key={addon.key}
                    className="group flex flex-col bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-[0_10px_34px_rgba(2,6,23,0.07)] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
                        style={{ backgroundColor: visual.bg }}
                      >
                        <Icon className="w-5 h-5" style={{ color: visual.fg }} />
                      </span>
                      <span className="text-right">
                        <span className="block text-[17px] font-extrabold text-slate-900 leading-none">
                          {gbp(addon.amount)}
                        </span>
                        <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 mt-1">
                          {addon.interval ? "per month" : "one-time"}
                        </span>
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-[15px] mb-1">{addon.name}</h3>
                    <p className="text-slate-500 text-[12.5px] leading-relaxed flex-1">{addon.description}</p>
                    {addon.eligibility && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10.5px] font-semibold text-slate-500">
                          <Check className="w-3 h-3 text-emerald-500" />
                          {addon.eligibility}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-center text-slate-500 text-xs mt-6">
              Suppliers join Propvora free. Supplier add-ons (Pro Profile, Team, Emergency
              Availability and more) are managed inside the supplier workspace.
            </p>
          </div>
        </section>

        <PricingFAQ />

        {/* Enterprise CTA */}
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              Enterprise
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {tr("pricingEnterpriseTitle")}
            </h2>
            <p className="text-slate-600 mb-8">
              {tr("pricingEnterpriseSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-base transition-colors"
              >
                {tr("pricingContactSales")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-xl text-base transition-colors"
              >
                {tr("pricingStartTrialInstead")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
