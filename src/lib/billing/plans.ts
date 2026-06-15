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
  /** Stripe product ID — null until the OWNER runs the setup script. */
  productId: string | null
  /** Stripe price ID — null until the OWNER runs the setup script. */
  priceId: string | null
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

/** Which side of the platform an add-on is sold to. */
export type AddonAudience = "operator" | "supplier"

export interface AddonDef {
  key: string
  name: string
  description: string
  amount: number
  interval: "month" | null
  priceId: string | null
  audience: AddonAudience
  /** Plain-text eligibility note (e.g. "Operator+"). Display-only. */
  eligibility?: string
}

/**
 * Display metadata + audience for every add-on. Prices/intervals are the source
 * of truth in catalog.generated.json; this map is name/description/eligibility
 * only. `audience` splits operator add-ons from supplier-workspace add-ons.
 */
const ADDON_DISPLAY: Record<
  string,
  { name: string; description: string; audience: AddonAudience; eligibility?: string }
> = {
  // ── Existing operator add-ons (V1 — unchanged) ──────────────────────────
  extra_seat: { name: "Extra team seat", description: "One additional team member.", audience: "operator", eligibility: "All plans" },
  extra_props_10: { name: "+10 properties", description: "Raise your property allowance by 10.", audience: "operator", eligibility: "Starter, Operator, Scale" },
  white_label: { name: "White-label branding", description: "Your brand on portals, emails & PDFs.", audience: "operator", eligibility: "Scale+" },
  ai_credits_1k: { name: "AI credit pack", description: "One-time top-up of 1,000 AI credits.", audience: "operator", eligibility: "AI-enabled tiers" },
  onboarding: { name: "Onboarding & migration", description: "Guided setup and data migration.", audience: "operator", eligibility: "All plans" },

  // ── New operator add-ons (Layer 2) ──────────────────────────────────────
  open_banking: { name: "Open Banking", description: "Live bank feeds and reconciliation via Open Banking.", audience: "operator", eligibility: "Operator+" },
  whatsapp_business: { name: "WhatsApp Business", description: "Send and receive messages over WhatsApp Business (usage extra).", audience: "operator", eligibility: "Operator+" },
  esignature: { name: "eSignature", description: "Send documents for legally-binding e-signature (envelopes extra).", audience: "operator", eligibility: "Operator+" },
  accounting_sync: { name: "Xero / QuickBooks sync", description: "Two-way accounting sync with Xero or QuickBooks.", audience: "operator", eligibility: "Scale+" },
  mtd_itsa: { name: "MTD ITSA pack", description: "Making Tax Digital for Income Tax Self Assessment submission pack.", audience: "operator", eligibility: "Operator+" },
  booking_pages: { name: "Booking pages", description: "Public direct-booking pages (included on Scale+).", audience: "operator", eligibility: "Operator (included Scale+)" },
  automation_pack: { name: "Automation pack", description: "More recipes, runs and nodes beyond your plan cap.", audience: "operator", eligibility: "Operator+" },
  api_access: { name: "API access", description: "REST API access with full read/write endpoints.", audience: "operator", eligibility: "Pro / Agency+" },
  country_pack_beta: { name: "Country pack (beta)", description: "Legal/tax/compliance depth for an additional country (beta).", audience: "operator", eligibility: "Scale+" },

  // ── Supplier-workspace add-ons (Layer 2) ────────────────────────────────
  supplier_pro_profile: { name: "Supplier Pro Profile", description: "Richer media, case studies, service packages and profile analytics.", audience: "supplier", eligibility: "Supplier" },
  supplier_team: { name: "Supplier Team", description: "Team members, team calendar, job assignment and multi-engineer availability.", audience: "supplier", eligibility: "Supplier" },
  supplier_emergency: { name: "Emergency Availability", description: "24/7 badge, emergency dispatch eligibility and response-time SLA fields.", audience: "supplier", eligibility: "Supplier" },
  supplier_verified_plus: { name: "Verified Plus Review", description: "Manual admin evidence review for insurance, licence and business documents.", audience: "supplier", eligibility: "Supplier" },
  supplier_promoted: { name: "Promoted Local Placement", description: "Sponsored rotation in local results, clearly labelled as promoted.", audience: "supplier", eligibility: "Supplier" },
  supplier_extra_area: { name: "Extra Coverage Area", description: "Expand geographic reach with an additional service-area pack.", audience: "supplier", eligibility: "Supplier" },
  supplier_automation_pack: { name: "Supplier Automation Pack", description: "Quote follow-ups, evidence reminders and invoice nudges.", audience: "supplier", eligibility: "Supplier" },
  supplier_ai_assistant: { name: "Supplier AI Assistant", description: "Quote drafting, job summaries and customer-message drafting.", audience: "supplier", eligibility: "Supplier" },
}

export function getAddons(): AddonDef[] {
  return Object.entries(cat.addons).map(([key, a]) => {
    const d = ADDON_DISPLAY[key]
    return {
      key,
      name: d?.name ?? key,
      description: d?.description ?? "",
      amount: a.amount,
      interval: (a.interval as "month" | null) ?? null,
      priceId: a.priceId,
      audience: d?.audience ?? "operator",
      eligibility: d?.eligibility,
    }
  })
}

/** Operator-facing add-ons only (for the public pricing page). */
export function getOperatorAddons(): AddonDef[] {
  return getAddons().filter((a) => a.audience === "operator")
}

/** Supplier-workspace add-ons only. */
export function getSupplierAddons(): AddonDef[] {
  return getAddons().filter((a) => a.audience === "supplier")
}

export function gbp(amountMinor: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(amountMinor / 100)
}
