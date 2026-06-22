"use client"

// Client bridge between the Billing-section UI vocabulary and the real billing
// backend routes (/api/billing/*). The section UI uses:
//   PlanCode    = starter | professional | business | enterprise
//   AddonCode   = extra_listings | premium_support | ai_pack | ...
// The canonical Stripe catalogue (src/lib/billing/plans.ts) uses tier + key.
// These map 1:1 by price/role so nothing here fabricates pricing.

import { getPriceId, type PlanTier, type BillingInterval } from "@/lib/billing/plans"
import { startCheckout, openBillingPortal } from "@/lib/billing/checkout"
import type { AddonCode, BillingCycle, PlanCode } from "./types"

/** Section PlanCode → canonical Stripe PlanTier. */
const PLAN_TO_TIER: Record<PlanCode, PlanTier> = {
  starter: "starter",
  professional: "operator",
  business: "scale",
  enterprise: "pro_agency",
}

function toInterval(cycle: BillingCycle): BillingInterval {
  return cycle === "annual" ? "annual" : "monthly"
}

export function isContactSalesPlan(plan: PlanCode): boolean {
  return getPriceId(PLAN_TO_TIER[plan], "monthly") == null
}

export function priceIdFor(plan: PlanCode, cycle: BillingCycle): string | null {
  return getPriceId(PLAN_TO_TIER[plan], toInterval(cycle))
}

/**
 * Start a real Stripe Checkout for the chosen plan + cycle. Throws when the
 * catalogue has no price for the tier (caller surfaces contact-sales).
 */
export async function startPlanCheckout(plan: PlanCode, cycle: BillingCycle): Promise<void> {
  const priceId = priceIdFor(plan, cycle)
  if (!priceId) {
    throw new Error("This plan is bespoke — contact sales to set it up.")
  }
  await startCheckout(priceId)
}

export { openBillingPortal }

// ── Cancellation / resume ───────────────────────────────────────────────────

interface CancelResponse {
  ok?: boolean
  scheduled?: boolean
  alreadyScheduled?: boolean
  accessUntil?: string | null
  error?: string
}

/** Schedule cancel-at-period-end via /api/billing/cancel. */
export async function requestCancellation(input: {
  reason?: string
  detail?: string
}): Promise<CancelResponse> {
  const res = await fetch("/api/billing/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const json = (await res.json().catch(() => ({}))) as CancelResponse
  if (!res.ok) throw new Error(json.error || "Could not schedule cancellation")
  return json
}

/** Clear a scheduled cancellation via /api/billing/resume. */
export async function requestResume(): Promise<CancelResponse> {
  const res = await fetch("/api/billing/resume", { method: "POST" })
  const json = (await res.json().catch(() => ({}))) as CancelResponse
  if (!res.ok) throw new Error(json.error || "Could not resume your subscription")
  return json
}

// ── Add-ons ─────────────────────────────────────────────────────────────────

/** Section AddonCode → canonical catalogue key in src/lib/billing/plans.ts. */
const ADDON_TO_CATALOG_KEY: Partial<Record<AddonCode, string>> = {
  extra_listings: "extra_props_10",
  extra_seats: "extra_seat",
  white_label: "white_label",
  ai_pack: "ai_credits_1k",
  automation_pack: "automation_pack",
  // premium_support / marketplace_boost / extra_storage have no catalogue price
  // yet — the route returns an honest 409 if their key is sent.
}

export function catalogKeyForAddon(code: AddonCode): string | null {
  return ADDON_TO_CATALOG_KEY[code] ?? null
}

interface AddonResponse {
  ok?: boolean
  addonKey?: string
  action?: string
  quantity?: number
  enabled?: boolean
  error?: string
}

/**
 * Apply an add-on change via /api/billing/addons. Translates the UI AddonCode
 * to the catalogue key the backend validates against.
 */
export async function applyAddonChange(input: {
  code: AddonCode
  action: "add" | "remove" | "set_quantity"
  quantity?: number
}): Promise<AddonResponse> {
  const addonKey = catalogKeyForAddon(input.code)
  if (!addonKey) {
    throw new Error("This add-on isn't available for self-serve purchase yet.")
  }
  const res = await fetch("/api/billing/addons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addonKey, action: input.action, quantity: input.quantity }),
  })
  const json = (await res.json().catch(() => ({}))) as AddonResponse
  if (!res.ok) throw new Error(json.error || "Could not apply the add-on change")
  return json
}
