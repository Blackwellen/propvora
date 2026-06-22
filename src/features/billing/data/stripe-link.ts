"use client"

// Bridges the Billing-section UI plan/cycle vocabulary to the canonical Stripe
// catalogue in src/lib/billing/plans.ts and starts a REAL Stripe Checkout /
// billing-portal session through the existing /api/billing/* routes.
//
// The section UI uses PlanCode = starter | professional | business | enterprise
// and BillingCycle = monthly | annual. The canonical catalogue uses
// PlanTier   = starter | operator | scale | pro_agency | enterprise and
// BillingInterval = monthly | annual. The price amounts line up 1:1
// (professional GBP79 == operator GBP79, business GBP149 == scale GBP149), so the
// mapping below is a faithful tier alias - NOT fabricated pricing.

import { getPriceId, type PlanTier, type BillingInterval } from "@/lib/billing/plans"
import { startCheckout, openBillingPortal } from "@/lib/billing/checkout"
import type { BillingCycle, PlanCode } from "./types"

/** Section PlanCode to canonical Stripe PlanTier. */
const PLAN_TO_TIER: Record<PlanCode, PlanTier> = {
  starter: "starter",
  professional: "operator",
  business: "scale",
  enterprise: "pro_agency",
}

function toInterval(cycle: BillingCycle): BillingInterval {
  return cycle === "annual" ? "annual" : "monthly"
}

/** True when the tier is a "talk to sales" tier with no self-serve price. */
export function isContactSalesPlan(plan: PlanCode): boolean {
  return getPriceId(PLAN_TO_TIER[plan], "monthly") == null
}

export function priceIdFor(plan: PlanCode, cycle: BillingCycle): string | null {
  return getPriceId(PLAN_TO_TIER[plan], toInterval(cycle))
}

/**
 * Start a real Stripe Checkout for the chosen plan + cycle. Throws if the
 * catalogue has no price for the tier (caller should surface contact-sales).
 */
export async function startPlanCheckout(plan: PlanCode, cycle: BillingCycle): Promise<void> {
  const priceId = priceIdFor(plan, cycle)
  if (!priceId) {
    throw new Error("This plan is bespoke - contact sales to set it up.")
  }
  await startCheckout(priceId)
}

export { openBillingPortal }
