import { getPlans } from "@/lib/billing/plans"
import type {
  AddonCatalogItem,
  BillingPlan,
  PlanCode,
} from "./types"

/**
 * Plan cards for the in-app checkout — derived from the SINGLE canonical
 * catalogue (src/lib/billing/plans.ts → catalog.generated.json), the exact
 * source the public /pricing page uses. This guarantees the price the customer
 * sees in-app is the price Stripe actually charges, the tier codes map 1:1 to
 * real Stripe prices + entitlements, and there is no marketing/checkout drift.
 *
 * Previously this was a hand-maintained mock (Starter/Professional/Business/
 * Enterprise at £29/79/149/299) that diverged from Stripe (Scale £169 shown as
 * "Business £149", Pro/Agency £329 shown as "Enterprise £299") and advertised an
 * unshipped "Marketplace access" feature — a P1 commercial misrepresentation.
 *
 * Enterprise has no self-serve Stripe price (contact-sales): its amounts come
 * through as 0 and the checkout UI renders a "Contact sales" path instead of a
 * Buy button (see isContactSalesPlan / PlanCheckoutTab).
 */
export const SEED_PLANS: BillingPlan[] = getPlans().map((p, i) => ({
  id: `plan-${p.tier}`,
  code: p.tier as PlanCode,
  name: p.name,
  monthlyPence: p.monthlyAmount ?? 0,
  annualPence: p.annualAmount ?? 0,
  currency: "GBP",
  isPopular: p.popular ?? false,
  sortOrder: i + 1,
  features: p.highlights,
}))

export const SEED_ADDON_CATALOG: AddonCatalogItem[] = [
  {
    code: "extra_listings",
    name: "Extra listings",
    description: "Additional properties beyond your plan allowance.",
    unitPricePence: 40,
    unit: "per_property",
    defaultQty: 10,
    hasQuantity: true,
    available: true,
    minPlan: "starter",
    releaseStage: "V1",
  },
  {
    code: "premium_support",
    name: "Premium support",
    description: "Priority queue, phone support and a 4-hour SLA.",
    unitPricePence: 2900,
    unit: "flat",
    defaultQty: 1,
    hasQuantity: false,
    available: true,
    minPlan: "operator",
    releaseStage: "V1",
  },
  {
    code: "ai_pack",
    name: "AI usage pack",
    description: "Top up AI credits — a one-time purchase, added to your balance.",
    unitPricePence: 1500,
    unit: "credit_pack",
    defaultQty: 1,
    hasQuantity: true,
    available: true,
    minPlan: "starter",
    releaseStage: "V1",
    // Priced as N × the £15 / 1,000-credit pack (ai_credits_1k) — the Stripe
    // price is the source of truth; these mirror it for the selector preview.
    creditPacks: [
      { label: "1,000 credits", credits: 1000, pricePence: 1500 },
      { label: "5,000 credits", credits: 5000, pricePence: 7500 },
      { label: "20,000 credits", credits: 20000, pricePence: 30000 },
    ],
  },
  {
    code: "automation_pack",
    name: "Automation pack",
    description: "Higher automation run limits and advanced nodes.",
    unitPricePence: 3900,
    unit: "flat",
    defaultQty: 1,
    hasQuantity: false,
    available: true,
    minPlan: "scale",
    releaseStage: "V1.5",
    requiredFlag: "canvasLite",
  },
  {
    code: "marketplace_boost",
    name: "Marketplace boost",
    description: "Featured placement and faster supplier quotes.",
    unitPricePence: 4900,
    unit: "flat",
    defaultQty: 1,
    hasQuantity: false,
    available: true,
    minPlan: "scale",
    releaseStage: "V2",
    requiredFlag: "marketplaceEnabled",
  },
  {
    code: "white_label",
    name: "White-label",
    description: "Your brand on portals and tenant communications.",
    unitPricePence: 9900,
    unit: "flat",
    defaultQty: 1,
    hasQuantity: false,
    available: true,
    minPlan: "scale",
    releaseStage: "V1",
  },
  {
    code: "extra_storage",
    name: "Extra storage",
    description: "Additional document & media storage, sold in 10 GB packs at £5 each.",
    unitPricePence: 500,
    unit: "per_gb",
    defaultQty: 1,
    hasQuantity: true,
    available: true,
    minPlan: "starter",
    releaseStage: "V1",
  },
  {
    code: "extra_seats",
    name: "Extra team seats",
    description: "Add seats beyond your plan allowance, per seat.",
    unitPricePence: 1200,
    unit: "per_seat",
    defaultQty: 1,
    hasQuantity: true,
    available: true,
    minPlan: "starter",
    releaseStage: "V1",
  },
]

export const SEED_CANCELLATION_REASONS: string[] = [
  "Too expensive",
  "Missing features I need",
  "Switching to another product",
  "No longer managing properties",
  "Temporary pause — I'll be back",
  "Other",
]

