"use client"

// Client bridge between the Billing-section UI vocabulary and the real billing
// backend routes (/api/billing/*). The section UI now uses the CANONICAL tier
// codes (starter | operator | scale | pro_agency | enterprise) — identical to
// src/lib/billing/plans.ts PlanTier and catalog.generated.json — so PlanCode
// maps 1:1 to a real Stripe price with no remap and nothing fabricates pricing.

import { getPriceId, type PlanTier, type BillingInterval } from "@/lib/billing/plans"
import { startCheckout, openBillingPortal } from "@/lib/billing/checkout"
import type { AddonCode, BillingCycle, PlanCode } from "./types"

function toInterval(cycle: BillingCycle): BillingInterval {
  return cycle === "annual" ? "annual" : "monthly"
}

/** True when a tier has no self-serve Stripe price (Enterprise → contact sales). */
export function isContactSalesPlan(plan: PlanCode): boolean {
  return getPriceId(plan as PlanTier, "monthly") == null
}

export function priceIdFor(plan: PlanCode, cycle: BillingCycle): string | null {
  return getPriceId(plan as PlanTier, toInterval(cycle))
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

// ── Retention offer (conditional, one-time, Starter-only, 3-month tenure) ────

export interface RetentionEligibility {
  eligible: boolean
  reason?: string
  creditMinor?: number
  currency?: string
}

/** Authoritative server eligibility — drives whether the offer is shown at all. */
export async function getRetentionEligibility(): Promise<RetentionEligibility> {
  try {
    const res = await fetch("/api/billing/retention", { method: "GET" })
    const json = (await res.json().catch(() => ({}))) as RetentionEligibility
    if (!res.ok) return { eligible: false, reason: "error" }
    return json
  } catch {
    return { eligible: false, reason: "error" }
  }
}

interface RetentionClaimResponse {
  ok?: boolean
  claimed?: boolean
  creditMinor?: number
  currency?: string
  alreadyClaimed?: boolean
  error?: string
}

/** Claim the retention credit via /api/billing/retention (re-checks all rules). */
export async function claimRetentionOffer(): Promise<RetentionClaimResponse> {
  const res = await fetch("/api/billing/retention", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  const json = (await res.json().catch(() => ({}))) as RetentionClaimResponse
  if (!res.ok) throw new Error(json.error || "Could not claim the retention offer")
  return json
}

// ── Add-ons ─────────────────────────────────────────────────────────────────

/** Section AddonCode → canonical catalogue key in src/lib/billing/plans.ts. */
const ADDON_TO_CATALOG_KEY: Partial<Record<AddonCode, string>> = {
  extra_listings: "extra_props_10",
  extra_seats: "extra_seat",
  white_label: "white_label",
  automation_pack: "automation_pack",
  // RECURRING add-ons only — these are applied as Stripe subscription items.
  // ai_pack maps to a ONE-TIME credit pack (ai_credits_1k) which cannot be a
  // subscription item, so it is intentionally NOT self-serve here (the UI shows
  // it as "contact billing"). premium_support / marketplace_boost / extra_storage
  // have no catalogue price yet — the route returns an honest 409 if sent.
}

export function catalogKeyForAddon(code: AddonCode): string | null {
  return ADDON_TO_CATALOG_KEY[code] ?? null
}

/** Section AddonCode → canonical ONE-TIME catalogue key (paid via one-off checkout). */
const ONE_OFF_ADDON_TO_CATALOG_KEY: Partial<Record<AddonCode, string>> = {
  ai_pack: "ai_credits_1k", // AI usage pack — one-time, payment-mode checkout
}

export function oneOffCatalogKeyForAddon(code: AddonCode): string | null {
  return ONE_OFF_ADDON_TO_CATALOG_KEY[code] ?? null
}

/**
 * Start a one-off (payment-mode) Stripe Checkout for a one-time add-on pack.
 * Redirects to Stripe; credits are granted by the webhook AFTER payment.
 */
export async function startAddonOneOffCheckout(input: {
  code: AddonCode
  quantity?: number
}): Promise<void> {
  const addonKey = oneOffCatalogKeyForAddon(input.code)
  if (!addonKey) throw new Error("This pack isn't available for purchase yet.")
  const res = await fetch("/api/billing/checkout/addon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addonKey, quantity: input.quantity ?? 1 }),
  })
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !json.url) throw new Error(json.error || "Could not start the add-on checkout")
  window.location.href = json.url
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
