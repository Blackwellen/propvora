// Pure billing maths + small formatting helpers. Money is INTEGER PENCE.

import type {
  AddonCatalogItem,
  BillingCycle,
  BillingPlan,
  SubscriptionAddon,
} from "./types"

/** Monthly price for a plan at the given cycle (annual shown as per-month). */
export function planCyclePence(plan: BillingPlan, cycle: BillingCycle): number {
  if (cycle === "annual") return Math.round(plan.annualPence / 12)
  return plan.monthlyPence
}

/** Full annual figure (the "billed annually" total). */
export function planAnnualPence(plan: BillingPlan): number {
  return Math.round(plan.annualPence)
}

/** Monthly pence contributed by a single active add-on line. */
export function addonMonthlyPence(item: AddonCatalogItem, addon: SubscriptionAddon): number {
  if (!addon.enabled) return 0
  const qty = item.hasQuantity ? Math.max(0, addon.quantity) : 1
  if (item.unit === "credit_pack" && item.creditPacks?.length) {
    // quantity here indexes the chosen pack (0-based, clamped).
    const idx = Math.min(Math.max(0, addon.quantity), item.creditPacks.length - 1)
    return item.creditPacks[idx].pricePence
  }
  return item.unitPricePence * qty
}

export interface Totals {
  subtotalPence: number
  taxPence: number
  totalPence: number
  /** When annual, the full year figure that will actually be billed. */
  annualBilledPence: number
}

/**
 * Compute the order summary for a selected plan + add-ons.
 * Add-ons are quoted monthly; when the cycle is annual we annualise add-ons
 * at 12× and use the discounted plan annual figure for the billed total.
 */
export function computeTotals(
  plan: BillingPlan,
  cycle: BillingCycle,
  catalog: AddonCatalogItem[],
  addons: SubscriptionAddon[],
  taxRateBps: number,
): Totals {
  const addonMonthly = addons.reduce((sum, a) => {
    const item = catalog.find((c) => c.code === a.code)
    return item ? sum + addonMonthlyPence(item, a) : sum
  }, 0)

  const planMonthly = planCyclePence(plan, cycle)
  const subtotalPence = planMonthly + addonMonthly
  const taxPence = Math.round((subtotalPence * taxRateBps) / 10000)
  const totalPence = subtotalPence + taxPence

  const annualPlan = planAnnualPence(plan)
  const annualAddons = addonMonthly * 12
  const annualSubtotal = annualPlan + annualAddons
  const annualBilledPence = annualSubtotal + Math.round((annualSubtotal * taxRateBps) / 10000)

  return { subtotalPence, taxPence, totalPence, annualBilledPence }
}

export function formatBillingDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function taxRatePercent(taxRateBps: number): number {
  return Math.round(taxRateBps / 100)
}
