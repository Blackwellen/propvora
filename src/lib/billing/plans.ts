/**
 * Canonical Propvora plan + add-on catalog for the app UI.
 *
 * Price IDs come from src/lib/billing/catalog.generated.json (produced by
 * scripts/stripe-setup-catalog.mjs). Env vars (NEXT_PUBLIC_STRIPE_PRICE_*) can
 * override any ID without a rebuild. Display metadata lives here.
 */
import catalog from "./catalog.generated.json"

export type PlanTier = "starter" | "operator" | "scale" | "pro_agency" | "enterprise"
export type BillingInterval = "monthly" | "annual"

interface CatalogPlan {
  productId: string
  tier: string
  monthly?: { priceId: string; amount: number }
  annual?: { priceId: string; amount: number }
}
interface CatalogAddon {
  productId: string
  priceId: string
  amount: number
  interval: string | null
}

const cat = catalog as {
  plans: Record<string, CatalogPlan>
  addons: Record<string, CatalogAddon>
}

function envPrice(tier: PlanTier, interval: BillingInterval): string | undefined {
  const key = `NEXT_PUBLIC_STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()}`
  return process.env[key]
}

export interface PlanFeatureSet {
  properties: number | "Unlimited"
  teamSeats: number | "Unlimited"
  aiCopilot: boolean
  advancedReports: boolean
}

export interface PlanDef {
  tier: PlanTier
  name: string
  tagline: string
  monthlyAmount: number | null
  annualAmount: number | null
  popular?: boolean
  enterprise?: boolean
  features: PlanFeatureSet
  highlights: string[]
}

export const PLAN_DISPLAY: Record<PlanTier, Omit<PlanDef, "monthlyAmount" | "annualAmount">> = {
  starter: {
    tier: "starter",
    name: "Starter",
    tagline: "For individual landlords getting organised.",
    features: { properties: 5, teamSeats: 1, aiCopilot: false, advancedReports: false },
    highlights: ["Up to 5 properties", "1 user", "Compliance tracking", "Rent & expenses"],
  },
  operator: {
    tier: "operator",
    name: "Operator",
    tagline: "For active portfolio operators.",
    popular: true,
    features: { properties: 25, teamSeats: 3, aiCopilot: false, advancedReports: true },
    highlights: ["Up to 25 properties", "3 team seats", "Advanced reports", "Work & PPM"],
  },
  scale: {
    tier: "scale",
    name: "Scale",
    tagline: "For growing portfolios and small teams.",
    features: { properties: 100, teamSeats: 10, aiCopilot: true, advancedReports: true },
    highlights: ["Up to 100 properties", "10 team seats", "AI Copilot", "Portals & accounting"],
  },
  pro_agency: {
    tier: "pro_agency",
    name: "Pro / Agency",
    tagline: "For letting agencies and managed portfolios.",
    features: { properties: 500, teamSeats: 25, aiCopilot: true, advancedReports: true },
    highlights: ["Up to 500 properties", "25 team seats", "AI Copilot", "White-label ready"],
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    tagline: "Custom limits, SSO, SLAs and onboarding.",
    enterprise: true,
    features: { properties: "Unlimited", teamSeats: "Unlimited", aiCopilot: true, advancedReports: true },
    highlights: ["Unlimited properties", "Unlimited seats", "SSO / SAML", "Dedicated support"],
  },
}

export const PLAN_ORDER: PlanTier[] = ["starter", "operator", "scale", "pro_agency", "enterprise"]

/** Normalise any stored/legacy plan string to a canonical PlanTier. */
export function normaliseTier(plan: string | null | undefined): PlanTier {
  const p = (plan ?? "").toLowerCase()
  if (PLAN_ORDER.includes(p as PlanTier)) return p as PlanTier
  if (p === "trial" || p === "basic") return "starter"
  if (p === "growth") return "operator"
  if (p === "pro" || p === "business" || p === "agency") return "pro_agency"
  return "starter"
}

export function getPlans(): PlanDef[] {
  return PLAN_ORDER.map((tier) => {
    const c = cat.plans[tier]
    const d = PLAN_DISPLAY[tier]
    return {
      ...d,
      monthlyAmount: c?.monthly?.amount ?? null,
      annualAmount: c?.annual?.amount ?? null,
    }
  })
}

/** Resolve the Stripe price ID for a tier + interval (env override wins). */
export function getPriceId(tier: PlanTier, interval: BillingInterval): string | null {
  const override = envPrice(tier, interval)
  if (override) return override
  const c = cat.plans[tier]
  const p = interval === "monthly" ? c?.monthly : c?.annual
  return p?.priceId ?? null
}

export interface AddonDef {
  key: string
  name: string
  description: string
  amount: number
  interval: "month" | null
  priceId: string | null
}

const ADDON_DISPLAY: Record<string, { name: string; description: string }> = {
  extra_seat: { name: "Extra team seat", description: "One additional team member." },
  extra_props_10: { name: "+10 properties", description: "Raise your property allowance by 10." },
  white_label: { name: "White-label branding", description: "Your brand on portals, emails & PDFs." },
  ai_credits_1k: { name: "AI credit pack", description: "One-time top-up of 1,000 AI credits." },
  onboarding: { name: "Onboarding & migration", description: "Guided setup and data migration." },
}

export function getAddons(): AddonDef[] {
  return Object.entries(cat.addons).map(([key, a]) => ({
    key,
    name: ADDON_DISPLAY[key]?.name ?? key,
    description: ADDON_DISPLAY[key]?.description ?? "",
    amount: a.amount,
    interval: (a.interval as "month" | null) ?? null,
    priceId: a.priceId,
  }))
}

export function gbp(amountMinor: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(amountMinor / 100)
}
